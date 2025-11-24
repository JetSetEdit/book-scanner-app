import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://tawolulyrlnpxjyyxpdw.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhd29sdWx5cmxucHhqeXl4cGR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ5NDM5NywiZXhwIjoyMDc1MDcwMzk3fQ.ige4kgvZav25IO9cINTl6mPgg-ACHDsG8t-hLBiGqSM"

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCovers() {
    const { data: books } = await supabase
        .from('books')
        .select('title, isbn, cover_url')
        .order('title', { ascending: true });

    if (!books) {
        console.log('No books found');
        return;
    }

    console.log(`\n📚 Cover Status for ${books.length} Books:\n`);

    let hasRealCover = 0;
    let noCover = 0;

    books.forEach(book => {
        const status = book.cover_url ? '✅ HAS COVER' : '❌ NO COVER';
        const coverPreview = book.cover_url ? book.cover_url.substring(0, 60) + '...' : 'null';

        console.log(`${status} - ${book.title}`);
        console.log(`   ISBN: ${book.isbn}`);
        console.log(`   Cover: ${coverPreview}`);
        console.log('');

        if (book.cover_url) {
            hasRealCover++;
        } else {
            noCover++;
        }
    });

    console.log('═══════════════════════════════════════');
    console.log(`✅ Books with covers: ${hasRealCover}`);
    console.log(`❌ Books without covers: ${noCover}`);
    console.log(`📊 Total: ${books.length}`);
    console.log('═══════════════════════════════════════');
}

checkCovers();
