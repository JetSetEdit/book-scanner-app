import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

const mainRepoPath = '/Users/jordanschepton/Documents/GitHub/Antigravity/book-scanner-app/.env.local'
const envPaths = [mainRepoPath, path.join(process.cwd(), '.env.local'), '.env.local']
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
    break
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkBookWarnings(isbn: string, title: string) {
  const { data: book } = await supabase
    .from('books')
    .select('title, author, content_warnings (category_id, subcategory_id, severity, description, score, reasoning)')
    .eq('isbn', isbn)
    .single()

  if (!book) {
    console.log(`\n❌ ${title} not found`)
    return
  }

  console.log(`\n📚 ${book.title} by ${book.author}`)
  console.log('='.repeat(80))
  if (!book.content_warnings || book.content_warnings.length === 0) {
    console.log('No warnings found')
    return
  }
  
  book.content_warnings.forEach((w: any, i: number) => {
    console.log(`${i+1}. [${w.severity.toUpperCase()}] ${w.category_id}${w.subcategory_id ? '.' + w.subcategory_id : ''}`)
    console.log(`   Score: ${w.score}`)
    console.log(`   Description: ${w.description}`)
    if (w.reasoning) {
      console.log(`   Reasoning: ${w.reasoning.substring(0, 150)}...`)
    }
    console.log('')
  })
}

(async () => {
  console.log('🔍 Checking specific book warnings...\n')
  await checkBookWarnings('9781761420917', 'Icebreaker')
  await checkBookWarnings('9780062457714', 'The Subtle Art')
  await checkBookWarnings('9781501110368', 'It Ends with Us')
  await checkBookWarnings('9781444758993', 'Red Rising')
  await checkBookWarnings('9781957635002', 'Haunting Adeline')
})().catch(console.error)
