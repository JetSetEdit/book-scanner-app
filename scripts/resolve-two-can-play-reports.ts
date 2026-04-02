/**
 * 1) Resolve today's "Two Can Play" not_found reports in manual_handling_scans.
 * 2) Look up which ISBNs Google Books returns for "Two Can Play" so we know which will scan.
 * Run: npx tsx scripts/resolve-two-can-play-reports.ts
 */
import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { extractISBNsFromGoogleBooks } from '../lib/book-api'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const TODAY_ISBNS = ['9798217192342', '9781408737217', '9798217192694']

async function main() {
  // 1) Resolve today's reports for these ISBNs
  const { data: updated, error } = await supabase
    .from('manual_handling_scans')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolution_notes: 'Fixed: search candidate + Google Books fallback deployed. Use search "two can play" or scan with candidate.',
      resolved_by: 'script-resolve-two-can-play',
    })
    .in('isbn', TODAY_ISBNS)
    .gte('created_at', '2026-03-03')
    .select('id', 'isbn', 'created_at')

  if (error) {
    console.error('Update error:', error)
    return
  }
  console.log('Resolved', updated?.length ?? 0, 'reports from today for Two Can Play ISBNs:', TODAY_ISBNS.join(', '))
  updated?.forEach((r) => console.log('  -', r.isbn, r.id))

  // 2) Which ISBNs does Google Books return for "Two Can Play"?
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY
  if (!apiKey) {
    console.log('\nNo GOOGLE_BOOKS_API_KEY, skipping ISBN lookup.')
    return
  }
  console.log('\nGoogle Books: ISBNs for "Two Can Play" (q=two can play):')
  const url = new URL('https://www.googleapis.com/books/v1/volumes')
  url.searchParams.set('q', 'two can play')
  url.searchParams.set('maxResults', '10')
  url.searchParams.set('key', apiKey)
  const res = await fetch(url.toString(), { headers: { 'User-Agent': 'Book-Scanner-App/1.0' } })
  const data = await res.json()
  if (!res.ok || !data.items?.length) {
    console.log('  No results or error:', data.error?.message || '')
    return
  }
  const byTitle: Record<string, string[]> = {}
  for (const item of data.items) {
    const v = item.volumeInfo
    const title = v?.title || '?'
    const isbns = extractISBNsFromGoogleBooks(v?.industryIdentifiers)
    if (isbns.length) (byTitle[title] = byTitle[title] || []).push(...isbns)
  }
  const twoCanPlay = data.items.find((i: any) =>
    /two can play/i.test(i.volumeInfo?.title) && /ali hazelwood/i.test((i.volumeInfo?.authors || []).join(' '))
  )
  if (twoCanPlay) {
    const v = twoCanPlay.volumeInfo
    const isbns = extractISBNsFromGoogleBooks(v?.industryIdentifiers)
    console.log('  "Two Can Play" by Ali Hazelwood → ISBNs:', isbns.join(', ') || 'none in response')
  }
  console.log('  All titles with ISBNs:', Object.entries(byTitle).map(([t, isbns]) => `${t}: ${[...new Set(isbns)].join(', ')}`).join(' | '))
}

main().catch(console.error)
