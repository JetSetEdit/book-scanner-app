/**
 * Batch Re-scan Script for Content Warnings
 * 
 * This script re-analyzes books to regenerate content warnings using the updated taxonomy.
 * It's useful when:
 * - New taxonomy subcategories are added (e.g., romance-focused terms)
 * - The taxonomy structure changes
 * - You want to ensure all books use the latest classification system
 * 
 * Usage:
 *   npx tsx scripts/batch-rescan-warnings.ts [options]
 * 
 * Options:
 *   --all                    Re-scan ALL books in the database (default: only books with warnings)
 *   --with-warnings          Only re-scan books that currently have warnings (default)
 *   --batch-size=N           Process N books per batch (default: 5)
 * 
 * Examples:
 *   # Re-scan all books with warnings (default, batch size 5)
 *   npx tsx scripts/batch-rescan-warnings.ts
 * 
 *   # Re-scan all books in database
 *   npx tsx scripts/batch-rescan-warnings.ts --all
 * 
 *   # Re-scan with larger batches (10 books per batch)
 *   npx tsx scripts/batch-rescan-warnings.ts --batch-size=10
 * 
 * Notes:
 *   - The script deletes existing warnings before generating new ones
 *   - Rate limiting is handled automatically with retries
 *   - Delays are added between books (3s) and batches (30s) to avoid API limits
 *   - Classifications are also updated if generated
 */

import fs from 'fs';
import path from 'path';

async function batchRescanWarnings() {
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
    const { findBookAndGenerateWarnings } = await import('../lib/content-warning-agent');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials. Check your .env.local file.');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔄 Batch re-scanning books to use updated taxonomy...\n');

    // 3. Get all books (or filter by criteria)
    const scanAll = process.argv.includes('--all');
    const scanOnlyWithWarnings = process.argv.includes('--with-warnings') || !scanAll; // Default to --with-warnings if --all not specified
    
    const { data: allBooks, error: fetchError } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: true });

    if (fetchError || !allBooks) {
        console.error('❌ Failed to fetch books:', fetchError);
        return;
    }

    // Filter books based on flags
    let booksToRescan = allBooks;
    if (scanOnlyWithWarnings && !scanAll) {
        // Get books that have warnings
        const { data: warningsData } = await supabase
            .from('content_warnings')
            .select('book_id');
        
        if (warningsData) {
            const bookIdsWithWarnings = [...new Set(warningsData.map(w => w.book_id))];
            booksToRescan = allBooks.filter(b => bookIdsWithWarnings.includes(b.id));
        } else {
            booksToRescan = [];
        }
    }

    console.log(`Found ${allBooks.length} total books`);
    console.log(`Will re-scan ${booksToRescan.length} books\n`);

    if (booksToRescan.length === 0) {
        console.log('✅ No books to re-scan!');
        return;
    }

    // Get batch size from command line args or default to 5
    const batchSizeArg = process.argv.find(arg => arg.startsWith('--batch-size='));
    const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 5;
    const totalBatches = Math.ceil(booksToRescan.length / batchSize);
    
    console.log(`📦 Processing in batches of ${batchSize} books (${totalBatches} batches total)\n`);
    console.log(`💡 Usage: npm run rescan-warnings [--all] [--with-warnings] [--batch-size=N]\n`);

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    // 4. Process books in batches
    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
        const batchStart = batchNum * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, booksToRescan.length);
        const batch = booksToRescan.slice(batchStart, batchEnd);
        
        console.log(`\n═══════════════════════════════════════`);
        console.log(`📦 Batch ${batchNum + 1}/${totalBatches} (Books ${batchStart + 1}-${batchEnd})`);
        console.log(`═══════════════════════════════════════\n`);

        for (let i = 0; i < batch.length; i++) {
            const book = batch[i];
            const globalIndex = batchStart + i + 1;
            console.log(`[${globalIndex}/${booksToRescan.length}] Re-scanning: ${book.title} by ${book.author || 'Unknown'}`);

            try {
                // Delete existing warnings for this book
                console.log(`   🗑️  Deleting existing warnings...`);
                const { error: deleteError } = await supabase
                    .from('content_warnings')
                    .delete()
                    .eq('book_id', book.id);

                if (deleteError) {
                    console.error(`   ⚠️  Warning: Failed to delete old warnings:`, deleteError.message);
                    // Continue anyway - we'll try to insert new ones
                } else {
                    console.log(`   ✅ Old warnings deleted`);
                }

                // Generate new warnings using the updated taxonomy
                let result;
                let retries = 3;
                let lastError;
                
                while (retries > 0) {
                    try {
                        console.log(`   🤖 Generating new warnings with updated taxonomy...`);
                        result = await findBookAndGenerateWarnings(book.isbn, "gpt-4o");
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

                // Insert new warnings
                if (result.content_warnings && result.content_warnings.length > 0) {
                    const warningsToInsert = result.content_warnings.map((warning: any) => ({
                        book_id: book.id,
                        category: warning.category || null,
                        category_id: warning.category_id || null,
                        subcategory_id: warning.subcategory_id || null,
                        description: warning.description || null,
                        severity: warning.severity || 'mild',
                        confidence_score: warning.score || null,
                        source: 'ai_generated',
                        presence: warning.presence || null,
                        detail_level: warning.detail_level || null,
                    }));

                    const { error: insertError } = await supabase
                        .from('content_warnings')
                        .insert(warningsToInsert);

                    if (insertError) {
                        console.error(`   ❌ Failed to insert warnings:`, insertError.message);
                        failCount++;
                    } else {
                        console.log(`   ✅ Generated ${result.content_warnings.length} new warnings with updated taxonomy`);
                        successCount++;
                    }
                } else {
                    console.log(`   ⚠️  No warnings generated (confidence: ${result.confidence})`);
                    if (result.reasoning) {
                        console.log(`   📝 Reasoning: ${result.reasoning.substring(0, 100)}...`);
                    }
                    skippedCount++;
                }

                // Update classification if present
                const classificationRating = (result as any).classification_rating;
                if (classificationRating) {
                    const categories = book.categories || [];
                    // Remove old classification
                    const filteredCategories = categories.filter((c: string) => !c.startsWith('CLASSIFICATION:'));
                    // Add new classification
                    filteredCategories.push(`CLASSIFICATION:${classificationRating}`);
                    
                    const { error: updateError } = await supabase
                        .from('books')
                        .update({ categories: filteredCategories })
                        .eq('id', book.id);

                    if (updateError) {
                        console.error(`   ⚠️  Failed to update classification:`, updateError.message);
                    } else {
                        console.log(`   ✅ Updated classification: ${classificationRating}`);
                    }
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

    console.log('\n═══════════════════════════════════════');
    console.log('📊 Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📚 Total processed: ${booksToRescan.length}`);
    console.log('═══════════════════════════════════════');
}

// Run the script
batchRescanWarnings().catch(console.error);









