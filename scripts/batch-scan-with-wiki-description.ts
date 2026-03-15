#!/usr/bin/env tsx
/**
 * Run scan-with-wiki-description for all books with null or thin description.
 * Fetches Wikipedia description if thin, then runs scan. Adds a short delay between books
 * to avoid rate limits.
 *
 * Usage: npx tsx scripts/batch-scan-with-wiki-description.ts
 * Optional: npx tsx scripts/batch-scan-with-wiki-description.ts --comfort-only
 *   (only books with zero content warnings and thin/missing description — "comfort reading" review set)
 */

import dotenv from 'dotenv'
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || '.env.local' })

const COMFORT_ONLY = process.argv.includes('--comfort-only')
const DELAY_MS = 2000

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
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

  // Books with null description (candidates for wiki enrichment + scan)
  let query = supabase
    .from('books')
    .select('id, isbn, title, author, description')
    .is('description', null)
    .order('title')

  if (COMFORT_ONLY) {
    const { data: withWarnings } = await supabase.from('content_warnings').select('book_id')
    const bookIdsWithWarnings = new Set((withWarnings ?? []).map((r: { book_id: string }) => r.book_id))
    const { data: allWithoutDesc } = await query
    const filtered = (allWithoutDesc ?? []).filter((b: { id: string }) => !bookIdsWithWarnings.has(b.id))
    if (filtered.length === 0) {
      console.log('No books in comfort-only set (no description + zero warnings).')
      return
    }
    console.log(`Running wiki+scan for ${filtered.length} books (comfort-only: no description, zero warnings).\n`)
    for (let i = 0; i < filtered.length; i++) {
      const book = filtered[i] as { id: string; isbn: string; title: string; author: string | null; description: string | null }
      await runOne(supabase, book, i + 1, filtered.length)
      if (i < filtered.length - 1) await delay(DELAY_MS)
    }
    return
  }

  const { data: books, error } = await query
  if (error) {
    console.error('Failed to fetch books:', error.message)
    process.exit(1)
  }
  if (!books?.length) {
    console.log('No books with null description found.')
    return
  }

  console.log(`Running wiki+scan for ${books.length} books with null description.\n`)
  for (let i = 0; i < books.length; i++) {
    await runOne(supabase, books[i], i + 1, books.length)
    if (i < books.length - 1) await delay(DELAY_MS)
  }
  console.log('\nBatch done.')
}

async function runOne(
  supabase: Awaited<ReturnType<typeof import('@supabase/supabase-js')['createClient']>>,
  book: { id: string; isbn: string; title: string; author: string | null; description: string | null },
  index: number,
  total: number
) {
  const { isbn, title, author, description, id } = book
  console.log(`[${index}/${total}] ${title} (${isbn})`)

  const descLen = (description || '').length
  if (descLen < 300) {
    console.log(`  Description ${descLen} chars; fetching Wikipedia...`)
    const { getWikipediaSummary } = await import('../lib/wikipedia-summary')
    const wikiSummary = await getWikipediaSummary(title, author ?? undefined)
    if (wikiSummary && wikiSummary.length > descLen) {
      const { error: updateErr } = await supabase
        .from('books')
        .update({
          description: wikiSummary,
          last_synced_at: new Date().toISOString()
        })
        .eq('id', id)
      if (updateErr) {
        console.warn('  Failed to save Wiki:', updateErr.message)
      } else {
        console.log(`  Saved Wikipedia (${wikiSummary.length} chars)`)
      }
    } else {
      console.log('  No Wikipedia summary found')
    }
  } else {
    console.log(`  Description already ${descLen} chars; skipping Wikipedia`)
  }

  console.log('  Running scan...')
  const { processIsbnScan } = await import('../lib/services/scan-service')
  const onProgress = (msg: string) => console.log('   ', msg)
  try {
    await processIsbnScan(isbn, onProgress, undefined, false)
  } catch (e) {
    console.warn('  Scan error:', e instanceof Error ? e.message : e)
  }
  console.log('')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
