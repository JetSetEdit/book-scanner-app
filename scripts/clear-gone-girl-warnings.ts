import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function clearWarnings() {
    const isbn = '9780307588371'
    console.log(`Clearing warnings for ISBN: ${isbn}`)

    // First get the book ID
    const { data: books, error: bookError } = await supabase
        .from('books')
        .select('id')
        .eq('isbn', isbn)

    if (bookError || !books || books.length === 0) {
        console.error('Book not found or error:', bookError)
        return
    }

    const bookId = books[0].id
    console.log(`Found book ID: ${bookId}`)

    // Delete warnings
    const { error: deleteError } = await supabase
        .from('content_warnings')
        .delete()
        .eq('book_id', bookId)

    if (deleteError) {
        console.error('Error deleting warnings:', deleteError)
    } else {
        console.log('Successfully deleted warnings.')
    }
}

clearWarnings()
