/**
 * Test SSS assignment with real book data: fetch metadata, run real analysis, then assignSSS.
 * Usage: npx tsx scripts/test-sss-assignment.ts [ISBN]
 *        DOTENV_CONFIG_PATH=.env.local npx tsx scripts/test-sss-assignment.ts [ISBN]
 * Default ISBN: 9780593440872 (Book Lovers, Emily Henry)
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY (and GEMINI_API_KEY for full analysis).
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY']
const missing = required.filter((k) => !process.env[k])
if (missing.length) {
  console.error('Missing env (use .env.local):', missing.join(', '))
  process.exit(1)
}

const DEFAULT_ISBN = '9780593440872'

async function main() {
  const { fetchCandidatesByISBN } = await import('../lib/book-api')
  const { analyzeBookWithMultiModel } = await import('../lib/services/multi-model-analysis')
  const { assignSSS } = await import('../lib/services/sss-assignment')

  const isbn = process.argv[2]?.replace(/[-\s]/g, '') || DEFAULT_ISBN
  console.log('=== SSS assignment test (real data) ===\n')
  console.log(`ISBN: ${isbn}\n`)

  const onProgress = (msg: string) => console.log('   ', msg)

  // 1. Real metadata
  const candidates = await fetchCandidatesByISBN(isbn)
  if (!candidates?.length) {
    console.error('No book found for this ISBN.')
    process.exit(1)
  }
  const book = candidates[0]
  const title = book.title || 'Unknown'
  const author = book.author || 'Unknown'
  const description = book.description || ''

  console.log(`Book: "${title}" by ${author}`)
  console.log(`Description length: ${description.length} chars\n`)

  // 2. Real analysis (multi-model pipeline)
  console.log('Running real content-warning analysis...')
  const { warnings, noWarningsReasoning } = await analyzeBookWithMultiModel(
    { title, author, description, isbn },
    onProgress
  )

  console.log(`\nWarnings found: ${warnings.length}`)
  if (warnings.length > 0) {
    warnings.forEach((w, i) => {
      console.log(`   ${i + 1}. ${w.subcategory_id} (${w.severity}): ${(w.description || w.reasoning || '').slice(0, 80)}...`)
    })
  } else if (noWarningsReasoning) {
    console.log('   No-warnings reasoning:', noWarningsReasoning.slice(0, 120) + '...')
  }
  console.log('')

  // 3. Real SSS assignment
  console.log('Running SSS assignment...')
  const sss = await assignSSS({
    warnings,
    title,
    author,
    description,
  })
  console.log('Result:', sss)
  console.log('\nDone.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
