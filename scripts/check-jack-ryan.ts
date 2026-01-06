/**
 * Check Jack Ryan 26 specifically
 */

import 'dotenv/config'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function checkJackRyan() {
  const { data, error } = await supabaseAdmin
    .from('books')
    .select('id, isbn, title, author, cover_url')
    .ilike('title', '%Jack Ryan%')

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Found ${data?.length || 0} books matching "Jack Ryan"\n`)
  
  data?.forEach(book => {
    console.log('Title:', book.title)
    console.log('ISBN:', book.isbn)
    console.log('Author:', book.author || 'Unknown')
    console.log('Cover URL:', book.cover_url || '(empty/null)')
    console.log('Cover URL length:', book.cover_url?.length || 0)
    console.log('Has cover (truthy check):', !!book.cover_url)
    console.log('Has cover (non-empty check):', book.cover_url && book.cover_url.trim() !== '')
    console.log('---')
  })
}

checkJackRyan().catch(console.error)

