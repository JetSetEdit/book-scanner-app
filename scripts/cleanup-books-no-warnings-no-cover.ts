/**
 * Delete books that have:
 * - No content warnings
 * - No cover image
 * 
 * These are incomplete entries that don't provide value.
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupBooks() {
    console.log('🔍 Finding books with no content warnings and no cover...\n');

    // Find books with no warnings and no cover
    const { data: booksToDelete, error: findError } = await supabase
        .rpc('get_books_no_warnings_no_cover')
        .catch(async () => {
            // If RPC doesn't exist, use a direct query
            const { data, error } = await supabase
                .from('books')
                .select(`
                    id,
                    isbn,
                    title,
                    cover_url,
                    content_warnings!left(id)
                `)
                .is('cover_url', null);

            if (error) throw error;

            // Filter to only books with no warnings
            return {
                data: data?.filter(book => !book.content_warnings || book.content_warnings.length === 0) || [],
                error: null
            };
        });

    if (findError) {
        console.error('Error finding books:', findError);
        process.exit(1);
    }

    if (!booksToDelete || booksToDelete.length === 0) {
        console.log('✅ No books found matching criteria (no warnings + no cover)');
        return;
    }

    console.log(`Found ${booksToDelete.length} books to delete:\n`);
    booksToDelete.forEach((book: any) => {
        console.log(`  - ${book.title} (${book.isbn})`);
    });

    console.log(`\n🗑️  Deleting ${booksToDelete.length} books...`);

    const bookIds = booksToDelete.map((b: any) => b.id);
    
    // Delete books (cascade will handle related records)
    const { error: deleteError } = await supabase
        .from('books')
        .delete()
        .in('id', bookIds);

    if (deleteError) {
        console.error('❌ Error deleting books:', deleteError);
        process.exit(1);
    }

    console.log(`✅ Successfully deleted ${booksToDelete.length} books`);
}

cleanupBooks().catch(console.error);

