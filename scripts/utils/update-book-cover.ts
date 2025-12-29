/**
 * Update book cover for a specific ISBN
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { fetchBookCover } from '../lib/utils/fetch-book-cover'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateBookCover(isbn: string) {
  console.log(`\n🔄 Updating cover for ISBN: ${isbn}\n`)

  // Get current book
  const { data: book, error: fetchError } = await supabase
    .from('books')
    .select('id, isbn, title, cover_url')
    .eq('isbn', isbn)
    .single()

  if (fetchError || !book) {
    console.error(`❌ Book not found: ${fetchError?.message || 'Unknown error'}`)
    return
  }

  console.log(`📖 Book: ${book.title}`)
  console.log(`   Current cover: ${book.cover_url || 'NULL (missing)'}\n`)

  // Fetch new cover
  console.log('🔍 Fetching cover from all sources...')
  const newCoverUrl = await fetchBookCover(isbn, book.title)

  if (newCoverUrl) {
    console.log(`\n✅ Found new cover: ${newCoverUrl.substring(0, 80)}...`)
    
    // Update database
    const { error: updateError } = await supabase
      .from('books')
      .update({ cover_url: newCoverUrl })
      .eq('id', book.id)

    if (updateError) {
      console.error(`❌ Failed to update cover: ${updateError.message}`)
    } else {
      console.log(`✅ Cover updated successfully!`)
    }
  } else {
    console.log(`\n❌ No valid cover found from any source`)
  }
}

const isbn = process.argv[2]
if (!isbn) {
  console.error('Usage: npx tsx scripts/update-book-cover.ts <ISBN>')
  process.exit(1)
}

updateBookCover(isbn).catch(console.error)







