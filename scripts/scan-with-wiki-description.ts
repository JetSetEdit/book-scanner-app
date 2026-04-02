#!/usr/bin/env tsx
/**
 * Ensure book has a Wikipedia description (if thin), then run scan without refetch.
 * Analysis uses the description in DB (Wiki or existing); no external API overwrite.
 *
 * Usage: npx tsx scripts/scan-with-wiki-description.ts <ISBN>
 */

import dotenv from 'dotenv'
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || '.env.local' })

const isbn = process.argv[2]?.replace(/[-\s]/g, '')
if (!isbn) {
  console.error('Usage: npx tsx scripts/scan-with-wiki-description.ts <ISBN>')
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

  const descLen = (book.description || '').length
  if (descLen < 300) {
    console.log(`Description is ${descLen} chars; fetching Wikipedia summary...`)
    const { getWikipediaSummary } = await import('../lib/wikipedia-summary')
    const wikiSummary = await getWikipediaSummary(book.title, book.author)
    if (wikiSummary && wikiSummary.length > descLen) {
      const { error: updateErr } = await supabase
        .from('books')
        .update({
          description: wikiSummary,
          last_synced_at: new Date().toISOString()
        })
        .eq('id', book.id)
      if (updateErr) {
        console.error('Failed to save Wiki description:', updateErr.message)
        process.exit(1)
      }
      console.log(`Saved Wikipedia description (${wikiSummary.length} chars).\n`)
    } else {
      console.log('No longer Wikipedia summary found; using existing description.\n')
    }
  } else {
    console.log(`Description already ${descLen} chars; skipping Wikipedia.\n`)
  }

  console.log('Running scan (no refetch — using description in DB)...\n')
  const { processIsbnScan } = await import('../lib/services/scan-service')
  const onProgress = (msg: string) => console.log(' ', msg)
  await processIsbnScan(isbn, onProgress, undefined, false)
  console.log('\nDone.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
