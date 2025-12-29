import fs from 'fs';
import path from 'path';

async function backfillClassifications() {
    // 1. Load env vars with proper quote handling
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.+)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                process.env[key] = value;
            }
        });
    }

    // 2. Import dependencies after env is set
    const { createClient } = await import('@supabase/supabase-js');
    const { generateContentWarnings } = await import('../lib/content-warning-agent');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials. Check your .env.local file.');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔄 Backfilling classifications for books missing them...\n');

    // 3. Get all books that don't have classifications
    const { data: allBooks, error: fetchError } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: true });

    if (fetchError || !allBooks) {
        console.error('❌ Failed to fetch books:', fetchError);
        return;
    }

    // Filter books that don't have classifications
    const booksWithoutClassification = allBooks.filter(book => {
        if (!book.categories || book.categories.length === 0) return true;
        return !book.categories.some((c: string) => c.startsWith('CLASSIFICATION:'));
    });

    console.log(`Found ${allBooks.length} total books`);
    console.log(`Found ${booksWithoutClassification.length} books without classifications\n`);

    if (booksWithoutClassification.length === 0) {
        console.log('✅ All books already have classifications!');
        return;
    }

    // Get batch size from command line args or default to 5
    const batchSize = parseInt(process.argv[2]) || 5;
    const totalBatches = Math.ceil(booksWithoutClassification.length / batchSize);
    
    console.log(`📦 Processing in batches of ${batchSize} books (${totalBatches} batches total)\n`);

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    // 4. Process books in batches
    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
        const batchStart = batchNum * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, booksWithoutClassification.length);
        const batch = booksWithoutClassification.slice(batchStart, batchEnd);
        
        console.log(`\n═══════════════════════════════════════`);
        console.log(`📦 Batch ${batchNum + 1}/${totalBatches} (Books ${batchStart + 1}-${batchEnd})`);
        console.log(`═══════════════════════════════════════\n`);

        for (let i = 0; i < batch.length; i++) {
            const book = batch[i];
            const globalIndex = batchStart + i + 1;
            console.log(`[${globalIndex}/${booksWithoutClassification.length}] Processing: ${book.title} by ${book.author || 'Unknown'}`);

        try {
            // Generate content warnings (which includes classification)
            let result;
            let retries = 3;
            let lastError;
            
            while (retries > 0) {
                try {
                    result = await generateContentWarnings({
                        book_title: book.title,
                        book_author: book.author || 'Unknown',
                        book_description: book.description || undefined,
                        book_categories: book.categories || undefined,
                        book_isbn: book.isbn
                    });
                    break; // Success, exit retry loop
                } catch (error: any) {
                    lastError = error;
                    // Check if it's a rate limit error
                    if (error?.code === 'rate_limit_exceeded' || error?.status === 429) {
                        const waitTime = error?.error?.message?.match(/try again in ([\d.]+)s/)?.[1] || '60';
                        const waitSeconds = Math.ceil(parseFloat(waitTime)) + 5; // Add buffer
                        console.log(`   ⏳ Rate limit hit. Waiting ${waitSeconds} seconds before retry...`);
                        await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
                        retries--;
                    } else {
                        throw error; // Not a rate limit error, throw immediately
                    }
                }
            }
            
            if (!result) {
                throw lastError || new Error('Failed after retries');
            }

            // Extract classification from result
            const classificationRating = (result as any).classification_rating;

            if (classificationRating) {
                // Update book categories with classification
                const categories = book.categories || [];
                const hasClassification = categories.some((c: string) => c.startsWith('CLASSIFICATION:'));
                
                if (!hasClassification) {
                    categories.push(`CLASSIFICATION:${classificationRating}`);
                    
                    const { error: updateError } = await supabase
                        .from('books')
                        .update({ categories })
                        .eq('id', book.id);

                    if (updateError) {
                        console.error(`   ❌ Failed to update book:`, updateError.message);
                        failCount++;
                    } else {
                        console.log(`   ✅ Added classification: ${classificationRating}`);
                        successCount++;
                    }
                } else {
                    console.log(`   ⏭️  Classification already exists, skipping`);
                    skippedCount++;
                }
            } else {
                console.log(`   ⚠️  No classification generated (confidence: ${result.confidence})`);
                failCount++;
            }

        } catch (error) {
            console.error(`   ❌ Error:`, error instanceof Error ? error.message : 'Unknown error');
            failCount++;
        }

            // Add a delay between books in the same batch
            if (i < batch.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            console.log('');
        }
        
        // Longer delay between batches to avoid rate limits
        if (batchNum < totalBatches - 1) {
            console.log(`\n⏸️  Batch complete. Waiting 30 seconds before next batch...\n`);
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    }

    console.log('═══════════════════════════════════════');
    console.log('📊 Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📚 Total processed: ${booksWithoutClassification.length}`);
    console.log('═══════════════════════════════════════');
}

// Run the script
backfillClassifications().catch(console.error);









