import fs from 'fs';
import path from 'path';

async function recheckAllCovers() {
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

    console.log('🔍 Re-checking ALL book covers for placeholders...\n');

    // 3. Get ALL books (including those with covers)
    const { data: books } = await supabase
        .from('books')
        .select('id, isbn, title, cover_url')
        .order('title', { ascending: true });

    if (!books || books.length === 0) {
        console.log('No books found');
        return;
    }

    console.log(`Found ${books.length} books to check.\n`);

    let replacedCount = 0;
    let validCount = 0;
    let failCount = 0;

    for (let i = 0; i < books.length; i++) {
        const book = books[i];
        console.log(`[${i + 1}/${books.length}] 📖 ${book.title}`);
        console.log(`   ISBN: ${book.isbn}`);
        console.log(`   Current: ${book.cover_url ? book.cover_url.substring(0, 60) + '...' : 'null'}`);

        try {
            const newCoverUrl = await fetchBookCover(book.isbn, book.title);

            if (newCoverUrl && newCoverUrl !== book.cover_url) {
                await supabase
                    .from('books')
                    .update({ cover_url: newCoverUrl })
                    .eq('id', book.id);

                console.log(`   ✅ REPLACED with: ${newCoverUrl.substring(0, 60)}...`);
                replacedCount++;
            } else if (newCoverUrl) {
                console.log(`   ✅ Cover is valid (no change)`);
                validCount++;
            } else {
                console.log(`   ❌ No valid cover available`);
                failCount++;
            }
        } catch (error) {
            console.error(`   ❌ Error:`, error instanceof Error ? error.message : 'Unknown');
            failCount++;
        }

        console.log('');
    }

    console.log('═══════════════════════════════════════');
    console.log(`🔄 Replaced: ${replacedCount}`);
    console.log(`✅ Valid (unchanged): ${validCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📊 Total: ${books.length}`);
    console.log('═══════════════════════════════════════');
}

recheckAllCovers();
