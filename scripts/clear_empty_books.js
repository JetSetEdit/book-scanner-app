require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteEmptyBooks() {
    console.log('Querying for books with missing descriptions...');

    // 1. Identify the books
    const { data: books, error: queryError } = await supabase
        .from('books')
        .select('isbn, title')
        .or('description.is.null,description.eq.""');

    if (queryError) {
        console.error('Error querying books:', queryError);
        return;
    }

    if (!books || books.length === 0) {
        console.log('✅ No empty books found.');
        return;
    }

    console.log(`Found ${books.length} books to delete.`);
    const isbns = books.map(b => b.isbn);

    console.log('Books to delete:');
    books.forEach(b => console.log(`- ${b.title} (${b.isbn})`));

    // 2. Delete them
    console.log('\nExecuting delete...');
    const { data: deleted, error: deleteError } = await supabase
        .from('books')
        .delete()
        .in('isbn', isbns)
        .select();

    if (deleteError) {
        console.error('Error deleting books:', deleteError);
    } else {
        console.log(`✅ Successfully deleted ${deleted?.length || 0} books.`);
    }
}

deleteEmptyBooks();
