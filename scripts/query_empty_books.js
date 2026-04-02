require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmptyBooks() {
    console.log('Querying for books with missing description and checking for warnings...\n');

    // Query for books with missing critical fields
    const { data: books, error: bookError } = await supabase
        .from('books')
        .select('id, isbn, title, author, description, cover_url')
        .or('title.eq."",title.is.null,author.is.null,description.is.null');

    if (bookError) {
        console.error('Error querying books:', bookError);
        return;
    }

    console.log(`Found ${books.length} books with missing data.\n`);

    if (books.length === 0) return;

    const bookIds = books.map(b => b.id);

    // Query content warnings for these books
    const { data: warnings, error: warningError } = await supabase
        .from('content_warnings')
        .select('book_id, category')
        .in('book_id', bookIds);

    if (warningError) {
        console.error('Error querying warnings:', warningError);
        return;
    }

    // Map book IDs to warning count
    const warningsByBook = warnings.reduce((acc, warning) => {
        acc[warning.book_id] = (acc[warning.book_id] || 0) + 1;
        return acc;
    }, {});

    // Print results
    let booksWithWarnings = 0;
    let booksWithoutWarnings = 0;

    console.log("--- RESULTS ---");
    books.forEach(book => {
        const warningCount = warningsByBook[book.id] || 0;
        if (warningCount > 0) booksWithWarnings++;
        else booksWithoutWarnings++;

        console.log(`Title: ${book.title ? book.title.substring(0, 40) : '[MISSING]'} | ISBN: ${book.isbn}`);
        console.log(`Status: ${warningCount > 0 ? `HAS ${warningCount} WARNINGS` : 'NO WARNINGS'}`);
        console.log(`Missing: ${!book.description ? 'Description ' : ''}${!book.cover_url ? 'Cover ' : ''}`);
        console.log('---');
    });

    console.log(`\nSummary:`);
    console.log(`- ${booksWithWarnings} books HAVE warnings despite missing descriptions`);
    console.log(`- ${booksWithoutWarnings} books HAVE NO warnings`);
}

checkEmptyBooks();
