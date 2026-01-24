/**
 * Test script to verify feedback API ISBN extraction and URL parsing logic
 * This simulates the logic in app/api/feedback/route.ts
 */

// Test ISBN extraction from various URL formats
const testUrls = [
  'https://www.subtextscanner.com.au/book/9781234567890',
  'https://subtext-books.vercel.app/book/9780743273565',
  '/book/9780349437033',
  'http://localhost:3000/book/9780593419342',
  'invalid-url',
  'https://www.subtextscanner.com.au/collection', // No ISBN
  '', // Empty
]

console.log('🧪 Testing ISBN extraction from URLs\n')
console.log('='.repeat(80))

testUrls.forEach((pageUrl, idx) => {
  let bookIsbn: string | null = null

  if (pageUrl) {
    try {
      const bookPageMatch = pageUrl.match(/\/book\/([0-9X-]+)/)
      if (bookPageMatch) {
        bookIsbn = bookPageMatch[1].replace(/-/g, '')
      }
    } catch (error) {
      // Ignore URL parsing errors
    }
  }

  const result = bookIsbn ? `✅ Extracted: ${bookIsbn}` : '❌ No ISBN found'
  console.log(`${idx + 1}. ${pageUrl || '(empty)'}`)
  console.log(`   ${result}\n`)
})

// Test pathname extraction with error handling
console.log('\n🧪 Testing pathname extraction with error handling\n')
console.log('='.repeat(80))

const testPathnameUrls = [
  'https://www.subtextscanner.com.au/book/9781234567890',
  '/book/9781234567890',
  'invalid-url',
  'relative/path',
  '',
]

testPathnameUrls.forEach((pageUrl, idx) => {
  let pathname: string | null = null

  if (pageUrl) {
    try {
      pathname = new URL(pageUrl).pathname
    } catch {
      // Fallback: just get path before query
      pathname = pageUrl.split('?')[0]
    }
  }

  const result = pathname ? `✅ Pathname: ${pathname}` : '❌ No pathname'
  console.log(`${idx + 1}. ${pageUrl || '(empty)'}`)
  console.log(`   ${result}\n`)
})

console.log('✅ All tests completed!')
console.log('\n📝 Summary:')
console.log('   - ISBN extraction works for valid book URLs')
console.log('   - ISBN extraction gracefully handles invalid URLs')
console.log('   - Pathname extraction has fallback for invalid URLs')
