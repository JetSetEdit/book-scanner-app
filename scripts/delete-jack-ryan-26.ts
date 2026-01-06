/**
 * Delete Jack Ryan 26 specifically (cover URL exists but image doesn't load)
 */

import 'dotenv/config'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function deleteJackRyan26() {
  const { data: books, error } = await supabaseAdmin
    .from('books')
    .select('id, isbn, title, author, cover_url')
    .ilike('title', '%Jack Ryan 26%')

  if (error) {
    console.error('Error:', error)
    return
  }

  if (!books || books.length === 0) {
    console.log('✅ Book not found')
    return
  }

  console.log(`Found ${books.length} book(s) to delete:\n`)
  books.forEach(book => {
    console.log(`- ${book.title} (${book.isbn})`)
    console.log(`  Cover URL: ${book.cover_url}`)
  })
  console.log()

  for (const book of books) {
    try {
      // Delete content warnings
      await supabaseAdmin
        .from('content_warnings')
        .delete()
        .eq('book_id', book.id)

      // Delete scans
      await supabaseAdmin
        .from('scans')
        .delete()
        .eq('isbn', book.isbn)

      // Delete book
      const { error: deleteError } = await supabaseAdmin
        .from('books')
        .delete()
        .eq('id', book.id)

      if (deleteError) {
        console.error(`❌ Failed: ${deleteError.message}`)
      } else {
        console.log(`✅ Deleted: ${book.title}`)
      }
    } catch (error) {
      console.error(`❌ Error: ${error}`)
    }
  }
}

deleteJackRyan26().catch(console.error)

