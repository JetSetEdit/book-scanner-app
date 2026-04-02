require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchOpenLibraryWorkDescriptionByKey(workKey) {
    try {
        const workRes = await fetch(`https://openlibrary.org${workKey}.json`);
        if (!workRes.ok) return null;
        const workData = await workRes.json();

        if (workData.description) {
            if (typeof workData.description === 'string') return workData.description;
            if (workData.description.value) return workData.description.value;
        }
    } catch (error) {
        console.warn(`Failed to fetch Open Library work description for ${workKey}`);
    }
    return null;
}

async function fetchOpenLibraryWorkDescription(isbn) {
    try {
        const searchRes = await fetch(`https://openlibrary.org/search.json?isbn=${isbn}&fields=key`);
        if (!searchRes.ok) return null;
        const searchData = await searchRes.json();
        if (!searchData.docs || searchData.docs.length === 0) return null;

        const workKey = searchData.docs[0].key;
        if (!workKey) return null;

        return await fetchOpenLibraryWorkDescriptionByKey(workKey);
    } catch (error) {
        console.warn(`Failed to fetch Open Library work key for ${isbn}`);
    }
    return null;
}

async function testAllEmptyBooks() {
    console.log('Fetching books with missing descriptions...');
    const { data: books, error } = await supabase
        .from('books')
        .select('isbn, title')
        .or('description.is.null,description.eq.""');

    if (error) {
        console.error('Error querying books:', error);
        return;
    }

    console.log(`Testing fallback on ${books.length} books...\n`);

    let successCount = 0;

    for (const book of books) {
        console.log(`Testing: "${book.title}" (ISBN: ${book.isbn})`);
        const desc = await fetchOpenLibraryWorkDescription(book.isbn);

        if (desc) {
            console.log(`✅ FOUND description! Length: ${desc.length} chars`);
            successCount++;
        } else {
            console.log(`❌ Failed to find description.`);
        }
        console.log('---');
        // Add a tiny delay to be nice to the API
        await new Promise(r => setTimeout(r, 200));
    }

    console.log(`\nRESULTS:`);
    console.log(`Successfully recovered descriptions for ${successCount} out of ${books.length} books (${Math.round((successCount / books.length) * 100)}%).`);
}

testAllEmptyBooks();
