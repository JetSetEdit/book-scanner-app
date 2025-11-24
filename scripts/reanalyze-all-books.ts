
import fs from 'fs';
import path from 'path';

async function reanalyzeAllBooks() {
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

    console.log('Supabase URL:', supabaseUrl ? 'Loaded' : 'Missing');
    console.log('Supabase Key:', supabaseKey ? 'Loaded' : 'Missing');

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔄 Re-analyzing all books in the database...\n');

    // 3. Get all books
    const { data: books, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: true });

    if (error || !books) {
        console.error('❌ Failed to fetch books:', error);
        return;
    }

    console.log(`Found ${books.length} books to analyze.\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < books.length; i++) {
        const book = books[i];
        console.log(`[${i + 1}/${books.length}] 📖 ${book.title} by ${book.author || 'Unknown'}`);
        console.log(`   ISBN: ${book.isbn}`);

        try {
            // Delete existing warnings
            await supabase
                .from('content_warnings')
                .delete()
                .eq('book_id', book.id);

            // Generate new warnings
            const result = await generateContentWarnings({
                book_title: book.title,
                book_author: book.author || 'Unknown',
                book_description: book.description || undefined,
                book_categories: book.categories || undefined,
                book_isbn: book.isbn
            });

            console.log(`   Generated ${result.content_warnings.length} warnings`);
            console.log(`   Classification: ${result.classification_rating || 'N/A'}`);
            console.log(`   Confidence: ${result.confidence}`);

            // Save warnings
            if (result.content_warnings.length > 0) {
                const warningsToInsert = result.content_warnings.map((w: any) => ({
                    book_id: book.id,
                    category: w.category,
                    description: w.description,
                    severity: w.severity,
                    user_id: null,
                    reasoning: w.reasoning || null,
                    is_author_verified: w.is_author_verified || false,
                    source_url: w.source_url || null
                }));

                const { error: insertError } = await supabase
                    .from('content_warnings')
                    .insert(warningsToInsert);

                if (insertError) {
                    console.error(`   ❌ Failed to save warnings:`, insertError.message);
                    failCount++;
                } else {
                    console.log(`   ✅ Saved successfully`);
                    successCount++;
                }
            } else {
                console.log(`   ✅ No warnings needed (${result.classification_rating || 'G'})`);
                successCount++;
            }

            // Update book categories with classification if needed
            if (result.classification_rating) {
                const categories = book.categories || [];
                const hasClassification = categories.some((c: string) => c.startsWith('CLASSIFICATION:'));
                if (!hasClassification) {
                    categories.push(`CLASSIFICATION:${result.classification_rating}`);
                    await supabase
                        .from('books')
                        .update({ categories })
                        .eq('id', book.id);
                }
            }

        } catch (error) {
            console.error(`   ❌ Error:`, error instanceof Error ? error.message : 'Unknown error');
            failCount++;
        }

        console.log('');
    }

    console.log('═══════════════════════════════════════');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📊 Total: ${books.length}`);
    console.log('═══════════════════════════════════════');
}

reanalyzeAllBooks();
