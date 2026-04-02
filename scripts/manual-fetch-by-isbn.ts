#!/usr/bin/env tsx
/**
 * Manual fetch: get metadata for an ISBN from external APIs and optionally save to DB.
 * Usage: npx tsx scripts/manual-fetch-by-isbn.ts <ISBN> [--save]
 *   --save  Update the book row in DB with fetched title, author, description (if present).
 */

import dotenv from 'dotenv'
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || '.env.local' })

const isbn = process.argv[2]?.replace(/[-\s]/g, '')
const save = process.argv.includes('--save')
if (!isbn) {
  console.error('Usage: npx tsx scripts/manual-fetch-by-isbn.ts <ISBN> [--save]')
  process.exit(1)
}

async function main() {
  const { fetchBookByISBN } = await import('../lib/book-api')
  console.log(`\nFetching metadata for ISBN: ${isbn}\n`)
  const data = await fetchBookByISBN(isbn)
  if (!data) {
    console.log('No data returned from external APIs.')
    return
  }
  console.log('Source:', data.source || 'unknown')
  console.log('Title:', data.title)
  console.log('Author:', data.author ?? '(none)')
  console.log('Description length:', (data.description || '').length, 'chars')
  if (data.description) {
    console.log('Description preview:', data.description.slice(0, 300) + (data.description.length > 300 ? '...' : ''))
  }
  console.log('Cover URL:', data.cover_url ? 'yes' : 'no')
  console.log('')

  if (save && (data.title || data.description)) {
    const { createClient } = await import('@supabase/supabase-js')
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      console.error('Missing Supabase env vars; cannot --save')
      return
    }
    const supabase = createClient(url, key)
    const update: Record<string, unknown> = {
      last_synced_at: new Date().toISOString()
    }
    if (data.title) update.title = data.title
    if (data.author !== undefined) update.author = data.author
    if (data.description) update.description = data.description
    if (data.cover_url) update.cover_url = data.cover_url
    const { data: row, error } = await supabase.from('books').update(update).eq('isbn', isbn).select('id, title, author').single()
    if (error) {
      console.error('Update failed:', error.message)
      return
    }
    console.log('Saved to DB. Book:', row?.title, row?.author ? `by ${row.author}` : '')
  } else if (save) {
    console.log('No title or description to save; skipping DB update.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
