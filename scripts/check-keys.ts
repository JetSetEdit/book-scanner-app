/**
 * Check that required API keys are set and (optionally) that Google Books responds.
 * Run: npx tsx scripts/check-keys.ts
 */
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const keys = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GOOGLE_BOOKS_API_KEY',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
] as const

console.log('Env keys (set = length > 0):\n')
for (const key of keys) {
  const val = process.env[key]
  const set = val != null && String(val).trim().length > 0
  console.log(`  ${key}: ${set ? `set (${String(val).length} chars)` : 'NOT SET'}`)
}

// Quick Google Books test
async function testGoogleBooks() {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY
  if (!apiKey) return
  console.log('\nGoogle Books test (q=two can play):')
  const url = new URL('https://www.googleapis.com/books/v1/volumes')
  url.searchParams.set('q', 'two can play')
  url.searchParams.set('maxResults', '3')
  url.searchParams.set('key', apiKey)
  try {
    const res = await fetch(url.toString(), { headers: { 'User-Agent': 'Book-Scanner-App/1.0' } })
    const data = await res.json()
    if (res.ok && data.items?.length) {
      console.log(`  OK: ${data.items.length} result(s), first: "${data.items[0].volumeInfo?.title}"`)
    } else {
      console.log(`  Response: ${res.status}`, data.error?.message || data.message || '')
    }
  } catch (e) {
    console.log('  Error:', e instanceof Error ? e.message : e)
  }
}
testGoogleBooks()
