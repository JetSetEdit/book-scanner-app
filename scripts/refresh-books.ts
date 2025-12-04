import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function refreshMissingCovers() {
    // Dynamic imports to ensure env vars are loaded first
    const { supabaseAdmin } = await import('@/lib/supabase/admin');
    const { processIsbnScan } = await import('@/lib/services/scan-service');

    console.log('🔍 Finding books with missing covers...');

    const { data: books, error } = await supabaseAdmin
        .from('books')
        .select('isbn, title, cover_url');

    if (error) {
        console.error('❌ Failed to fetch books:', error);
        process.exit(1);
    }

    // Filter for specific ISBNs
    const targetIsbns = ['9781101904220', '9780593135204', '9781761266492'];
    const targetBooks = books.filter((b: any) => targetIsbns.includes(b.isbn));

    console.log(`Found ${targetBooks.length} books to refresh:`);
    targetBooks.forEach((b: any) => console.log(` - ${b.title} (${b.isbn})`));

    for (const book of targetBooks) {
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

refreshMissingCovers();
