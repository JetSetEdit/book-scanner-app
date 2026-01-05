/**
 * Test BookTok Popular Titles
 * 
 * Tests well-known BookTok books that likely haven't been scanned before
 */

import dotenv from 'dotenv'
import { findBookAndGenerateWarnings } from '../lib/content-warning-agent'
import { findBookAndGenerateWarningsV2 } from '../lib/content-warning-agent-v2'

// Load environment variables
dotenv.config({ path: '.env.local' })
dotenv.config()

// Popular BookTok titles with ISBNs
const BOOKTOK_TITLES = [
  { title: "It Ends With Us", author: "Colleen Hoover", isbn: "9781501110375" },
  { title: "The Seven Husbands of Evelyn Hugo", author: "Taylor Jenkins Reid", isbn: "9781501139239" },
  { title: "The Song of Achilles", author: "Madeline Miller", isbn: "9780062060624" },
  { title: "They Both Die at the End", author: "Adam Silvera", isbn: "9780062457806" },
  { title: "The Hating Game", author: "Sally Thorne", isbn: "9780062439598" },
  { title: "Red, White & Royal Blue", author: "Casey McQuiston", isbn: "9781250316776" },
  { title: "The Invisible Life of Addie LaRue", author: "V.E. Schwab", isbn: "9780765387561" },
  { title: "The Midnight Library", author: "Matt Haig", isbn: "9780525559474" },
  { title: "Verity", author: "Colleen Hoover", isbn: "9781538724736" },
  { title: "The Spanish Love Deception", author: "Elena Armas", isbn: "9780593336824" },
]

interface TestResult {
  isbn: string
  title: string
  author: string
  oldPattern: {
    warnings: number
    timeMs: number
    status: 'success' | 'failed' | 'partial'
    bookFound: boolean
  }
  newPattern: {
    warnings: number
    timeMs: number
    status: 'success' | 'failed' | 'partial'
    bookFound: boolean
  }
}

async function testBook(isbn: string, title: string, author: string): Promise<TestResult> {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`Testing: ${title} by ${author}`)
  console.log(`ISBN: ${isbn}`)
  console.log('='.repeat(80))

  // Test old pattern
  console.log('\n[OLD PATTERN] Testing...')
  const oldStart = Date.now()
  let oldResult;
  try {
    oldResult = await findBookAndGenerateWarnings(isbn, 'gpt-4o', 'hybrid')
    const oldTime = Date.now() - oldStart
    console.log(`[OLD PATTERN] ✅ Found ${oldResult.content_warnings.length} warnings in ${oldTime}ms`)
  } catch (error) {
    oldResult = {
      book_found: false,
      content_warnings: [],
      confidence: 'low' as const,
      reasoning: error instanceof Error ? error.message : 'Unknown error'
    }
    console.log(`[OLD PATTERN] ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  const oldTime = Date.now() - oldStart

  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Test new pattern
  console.log('\n[NEW PATTERN] Testing...')
  const newStart = Date.now()
  let newResult;
  try {
    newResult = await findBookAndGenerateWarningsV2(isbn, 'gpt-4o', 'hybrid')
    const newTime = Date.now() - newStart
    console.log(`[NEW PATTERN] ✅ Found ${newResult.content_warnings.length} warnings in ${newTime}ms`)
  } catch (error) {
    newResult = {
      book_found: false,
      content_warnings: [],
      confidence: 'low' as const,
      reasoning: error instanceof Error ? error.message : 'Unknown error'
    }
    console.log(`[NEW PATTERN] ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  const newTime = Date.now() - newStart

  return {
    isbn,
    title,
    author,
    oldPattern: {
      warnings: oldResult.content_warnings.length,
      timeMs: oldTime,
      status: oldResult.book_found ? 'success' : 'partial',
      bookFound: oldResult.book_found,
    },
    newPattern: {
      warnings: newResult.content_warnings.length,
      timeMs: newTime,
      status: newResult.book_found ? 'success' : 'partial',
      bookFound: newResult.book_found,
    }
  }
}

async function runTests() {
  console.log('📚 Testing Popular BookTok Titles')
  console.log('='.repeat(80))
  console.log(`Testing ${BOOKTOK_TITLES.length} books...\n`)

  const results: TestResult[] = []

  // Test first 2 books (to save time/tokens - can increase if needed)
  for (const book of BOOKTOK_TITLES.slice(0, 2)) {
    try {
      const result = await testBook(book.isbn, book.title, book.author)
      results.push(result)
      
      // Wait between books
      await new Promise(resolve => setTimeout(resolve, 3000))
    } catch (error) {
      console.error(`Error testing ${book.title}:`, error)
    }
  }

  // Print summary
  console.log('\n\n' + '='.repeat(80))
  console.log('SUMMARY')
  console.log('='.repeat(80))
  console.log('\n')
  console.log('Book'.padEnd(50) + '│ Old Warnings │ New Warnings │ Old Time │ New Time │ Status')
  console.log('-'.repeat(80))
  
  for (const result of results) {
    const shortTitle = (result.title.length > 45 ? result.title.substring(0, 42) + '...' : result.title).padEnd(50)
    const oldWarnings = String(result.oldPattern.warnings).padStart(12)
    const newWarnings = String(result.newPattern.warnings).padStart(12)
    const oldTime = `${(result.oldPattern.timeMs / 1000).toFixed(1)}s`.padStart(9)
    const newTime = `${(result.newPattern.timeMs / 1000).toFixed(1)}s`.padStart(9)
    const status = result.oldPattern.bookFound && result.newPattern.bookFound ? '✅' : 
                   result.oldPattern.bookFound || result.newPattern.bookFound ? '⚠️' : '❌'
    
    console.log(`${shortTitle}│${oldWarnings}│${newWarnings}│${oldTime}│${newTime}│ ${status}`)
  }

  console.log('\n')
  console.log('Key:')
  console.log('  ✅ = Both found book')
  console.log('  ⚠️  = One found book')
  console.log('  ❌ = Neither found book')
  console.log('\n')
}

runTests().catch(console.error)

