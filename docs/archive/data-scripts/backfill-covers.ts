import fs from 'fs';
import path from 'path';

async function backfillCovers() {
    // 1. Load env vars
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.+)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                process.env[key] = value;
            }
        });
    }

    // 2. Import dependencies
    const { createClient } = await import('@supabase/supabase-js');
    const { fetchBookCover } = await import('../lib/utils/fetch-book-cover');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🖼️  Backfilling missing book covers...\n');

    // 3. Get all books without covers
    const { data: books } = await supabase
        .from('books')
        .select('id, isbn, title, cover_url')
        .or('cover_url.is.null,cover_url.eq.');

    if (!books || books.length === 0) {
        console.log('✅ All books have covers!');
        return;
    }

    console.log(`Found ${books.length} books without covers.\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < books.length; i++) {
        const book = books[i];
        console.log(`[${i + 1}/${books.length}] 📖 ${book.title}`);
        console.log(`   ISBN: ${book.isbn}`);

        try {
            const coverUrl = await fetchBookCover(book.isbn, book.title);

            if (coverUrl) {
                await supabase
                    .from('books')
                    .update({ cover_url: coverUrl })
                    .eq('id', book.id);

                console.log(`   ✅ Cover found: ${coverUrl.substring(0, 50)}...`);
                successCount++;
            } else {
                console.log(`   ❌ No cover available`);
                failCount++;
            }
        } catch (error) {
            console.error(`   ❌ Error:`, error instanceof Error ? error.message : 'Unknown');
            failCount++;
        }

        console.log('');
    }

    console.log('═══════════════════════════════════════');
    console.log(`✅ Found: ${successCount}`);
    console.log(`❌ Not Found: ${failCount}`);
    console.log(`📊 Total: ${books.length}`);
    console.log('═══════════════════════════════════════');
}

backfillCovers();
