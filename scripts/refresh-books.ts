import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function refreshMissingCovers() {
    // Dynamic imports to ensure env vars are loaded first
    const { supabaseAdmin } = await import('@/lib/supabase/admin');
    const { processIsbnScan } = await import('@/lib/services/scan-service');

    console.log('🔍 Finding books with missing covers...');

    // Find books with missing covers or placeholder covers
    const { data: books, error } = await supabaseAdmin
        .from('books')
        .select('isbn, title, cover_url')
        .or('cover_url.is.null,cover_url.eq.No cover available,cover_url.ilike.%google%');

    if (error) {
        console.error('❌ Failed to fetch books:', error);
        process.exit(1);
    }

    console.log(`Found ${books.length} books to refresh:`);
    books.forEach((b: any) => console.log(` - ${b.title} (${b.isbn})`));

    for (const book of books) {
        console.log(`\n🔄 Refreshing: ${book.title}...`);
        try {
            await processIsbnScan(
                book.isbn,
                (msg) => console.log(`   [Progress] ${msg}`),
                undefined,
                true // forceRefresh
            );
            console.log(`✅ Successfully refreshed ${book.title}`);
        } catch (err) {
            console.error(`❌ Failed to refresh ${book.title}:`, err);
        }
    }

    console.log('\n✨ All done!');
}

refreshMissingCovers().catch(console.error);
