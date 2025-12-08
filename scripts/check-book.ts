import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const isbn = process.argv[2]
if (!isbn) {
    console.error('Please provide an ISBN')
    process.exit(1)
}

async function checkBook() {
    console.log(`Checking for ISBN: ${isbn}`)

    const { data: book, error } = await supabase
        .from('books')
        .select('*')
        .eq('isbn', isbn)
        .single()

    if (error) {
        console.error('Error fetching book:', error.message, error.code)
    } else {
        console.log('Book found:', book)
    }
}

checkBook()
