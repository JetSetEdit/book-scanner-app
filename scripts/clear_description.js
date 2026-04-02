require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);


async function run() {
    const isbn = '9780735224292'; // Little fires everywhere

    console.log(`Clearing description for ISBN: ${isbn}`);
    const { data: books, error: fetchError } = await supabase
        .from('books')
        .update({ description: '' })
        .eq('isbn', isbn)
        .select();

    if (fetchError || !books || books.length === 0) {
        console.error("Failed to clear description or book not found", fetchError);
        return;
    }

    console.log("Description cleared. Running scan with forceRefresh = false to simulate missing description.");

    // Need to import processIsbnScan dynamically or via tsx since it's TypeScript. We will use a separate ts script for the scan.
}

run();
