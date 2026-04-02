#!/usr/bin/env tsx
/**
 * Fetch a book description via web search (Wikipedia summary) and optionally save to DB.
 * Uses Wikipedia API for a short plot summary (public domain-style factual summary).
 *
 * Usage: npx tsx scripts/fetch-description-web-search.ts <ISBN> [--save]
 *   With --save: updates the book row's description in DB (book must already exist).
 *
 * Requires: book already in DB with correct title/author (we search Wikipedia by title + author).
 */

import dotenv from 'dotenv'
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || '.env.local' })

const isbn = process.argv[2]?.replace(/[-\s]/g, '')
const save = process.argv.includes('--save')
if (!isbn) {
  console.error('Usage: npx tsx scripts/fetch-description-web-search.ts <ISBN> [--save]')
  process.exit(1)
}

async function main() {
  const { createClient } = await import('@supabase/supabase-js')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing Supabase env vars')
    process.exit(1)
  }
  const supabase = createClient(url, key)

  const { data: book, error: bookErr } = await supabase
    .from('books')
    .select('id, title, author, description')
    .eq('isbn', isbn)
    .maybeSingle()
  if (bookErr || !book) {
    console.error('Book not found for ISBN', isbn)
    process.exit(1)
  }

  const title = book.title || 'Unknown'
  const author = book.author || undefined
  console.log(`\nWeb search description for: ${title}${author ? ` by ${author}` : ''}\n`)

  const { getWikipediaSummary } = await import('../lib/wikipedia-summary')
  const summary = await getWikipediaSummary(title, author)
  if (!summary) {
    console.log('No Wikipedia summary found. Try a different title/author or add description manually.')
    return
  }
  console.log('Wikipedia summary length:', summary.length, 'chars')
  console.log('Preview:', summary.slice(0, 300) + (summary.length > 300 ? '...' : ''))
  console.log('')

  if (save) {
    const { error: updateErr } = await supabase
      .from('books')
      .update({
        description: summary,
        last_synced_at: new Date().toISOString()
      })
      .eq('isbn', isbn)
    if (updateErr) {
      console.error('Update failed:', updateErr.message)
      process.exit(1)
    }
    console.log('Saved to DB.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
