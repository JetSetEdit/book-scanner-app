import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectBooks() {
    const { data: books, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching books:', error);
        return;
    }

    console.log(`Found ${books.length} books. Analyzing structure...`);

    books.forEach((book: any) => {
        console.log('\n--------------------------------------------------');
        console.log(`Title: ${book.title}`);
        console.log(`ISBN: ${book.isbn}`);
        console.log(`Author: ${book.author}`);
        console.log(`Cover: ${book.cover_url ? '✅ Present' : '❌ Missing'}`);
        console.log(`Classification (Column): ${book.classification_rating}`);
        console.log(`Categories: ${JSON.stringify(book.categories)}`);

        // Check for classification in categories
        const catClass = book.categories?.find((c: string) => c.startsWith('CLASSIFICATION:'));
        console.log(`Classification (Derived): ${catClass || 'None'}`);
    });
}

inspectBooks();
