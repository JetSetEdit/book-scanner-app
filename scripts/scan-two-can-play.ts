#!/usr/bin/env tsx
/**
 * Manually run scan for Two Can Play (9798217192694).
 * Fetches candidate from Google Books by title then runs scan with that candidate (avoids 429 on isbn: lookup).
 * Usage: npx tsx scripts/scan-two-can-play.ts
 */
import dotenv from 'dotenv'
import path from 'path'
import { extractISBNsFromGoogleBooks } from '../lib/book-api'
import { normalizeISBN } from '../lib/isbn-validation'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const ISBN = '9798217192694'

async function fetchCandidateFromGoogle(): Promise<{ isbn: string; title: string; author?: string; cover_url?: string; description?: string; source: 'googlebooks' } | null> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY
  const url = new URL('https://www.googleapis.com/books/v1/volumes')
  url.searchParams.set('q', 'two can play')
  url.searchParams.set('maxResults', '5')
  if (apiKey) url.searchParams.set('key', apiKey)
  const res = await fetch(url.toString(), { headers: { 'User-Agent': 'Book-Scanner-App/1.0' } })
  if (!res.ok) {
    console.error('Google Books response:', res.status)
    return null
  }
  const data = await res.json()
  const items = data.items || []
  if (items.length === 0) {
    console.error('Google Books returned 0 items')
    return null
  }
  const wantIsbn = normalizeISBN(ISBN)
  for (const item of data.items || []) {
    const v = item.volumeInfo
    if (!v?.title || !/two can play/i.test(v.title)) continue
    const author = (v.authors || []).join(' ')
    if (!/hazelwood/i.test(author)) continue
    const isbns = extractISBNsFromGoogleBooks(v.industryIdentifiers)
    const matchIsbn = isbns.length ? isbns.find((i) => normalizeISBN(i) === wantIsbn) : null
    const coverUrl = v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail
    return {
      isbn: ISBN,
      title: v.title,
      author: v.authors?.[0],
      cover_url: coverUrl?.replace('http:', 'https:')?.replace('&edge=curl', ''),
      description: v.description,
      source: 'googlebooks',
    }
  }
  return null
}

async function main() {
  console.log('Fetching candidate from Google Books (q=Two Can Play Ali Hazelwood)...')
  const candidate = await fetchCandidateFromGoogle()
  if (!candidate) {
    console.error('Could not fetch book data from Google Books.')
    process.exit(1)
  }
  console.log('  Found:', candidate.title, 'by', candidate.author)
  console.log('\nScanning with candidate...\n')
  const { processIsbnScan } = await import('../lib/services/scan-service')
  const result = await processIsbnScan(
    ISBN,
    (msg) => console.log(' ', typeof msg === 'string' ? msg : (msg as any)?.action || JSON.stringify(msg)),
    candidate,
    false
  )
  console.log('\nDone.')
  console.log('  Success:', result.success)
  console.log('  Message:', result.message ?? '')
  console.log('  Book:', result.book?.title, '| ID:', result.book?.id)
  if (!result.success) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
