/**
 * Test Voice Agent
 * 
 * Tests the voice agent API endpoint and service logic
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

interface TestCase {
  name: string
  query: string
  isbn?: string
  bookId?: string
  expectedContains?: string[]
}

const TEST_CASES: TestCase[] = [
  {
    name: 'Query without ISBN or bookId',
    query: 'What are the content warnings?',
    expectedContains: ['ISBN', 'scan']
  },
  {
    name: 'Query with ISBN',
    query: 'What are the content warnings?',
    isbn: '9781405293181',
    expectedContains: ['warning']
  },
  {
    name: 'Severe warnings query',
    query: 'What are the severe warnings?',
    isbn: '9781405293181',
    expectedContains: ['severe', 'warning']
  },
  {
    name: 'Book summary query',
    query: 'Tell me about this book',
    isbn: '9781405293181',
    expectedContains: ['by', 'contains']
  },
  {
    name: 'Rating query',
    query: 'What is the classification rating?',
    isbn: '9781405293181',
    expectedContains: ['rating', 'classification']
  },
  {
    name: 'Author query',
    query: 'Who wrote this book?',
    isbn: '9781405293181',
    expectedContains: ['by']
  }
]

async function testVoiceAgent(testCase: TestCase): Promise<{
  success: boolean
  response?: any
  error?: string
}> {
  console.log(`\n🧪 Testing: ${testCase.name}`)
  console.log(`   Query: "${testCase.query}"`)
  if (testCase.isbn) console.log(`   ISBN: ${testCase.isbn}`)
  if (testCase.bookId) console.log(`   Book ID: ${testCase.bookId}`)

  try {
    const response = await fetch(`${BASE_URL}/api/voice/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: testCase.query,
        isbn: testCase.isbn,
        bookId: testCase.bookId
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`HTTP ${response.status}: ${errorData.error || 'Unknown error'}`)
    }

    const data = await response.json()

    // Validate response structure
    if (!data.success) {
      throw new Error('Response success flag is false')
    }

    if (!data.text || typeof data.text !== 'string') {
      throw new Error('Response missing text field')
    }

    if (typeof data.shouldContinue !== 'boolean') {
      throw new Error('Response missing shouldContinue field')
    }

    // Check expected content
    if (testCase.expectedContains) {
      const textLower = data.text.toLowerCase()
      const missing = testCase.expectedContains.filter(
        expected => !textLower.includes(expected.toLowerCase())
      )

      if (missing.length > 0) {
        console.warn(`   ⚠️  Expected to contain: ${missing.join(', ')}`)
      }
    }

    console.log(`   ✅ Success`)
    console.log(`   Response: "${data.text.substring(0, 100)}${data.text.length > 100 ? '...' : ''}"`)
    if (data.suggestedQuestions && data.suggestedQuestions.length > 0) {
      console.log(`   Suggested questions: ${data.suggestedQuestions.length}`)
    }

    return {
      success: true,
      response: data
    }
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`)
    return {
      success: false,
      error: error.message
    }
  }
}

async function runTests() {
  console.log('🎤 Voice Agent Test Suite')
  console.log(`📍 Base URL: ${BASE_URL}\n`)

  const results = []
  let passed = 0
  let failed = 0

  for (const testCase of TEST_CASES) {
    const result = await testVoiceAgent(testCase)
    results.push({ testCase, result })
    
    if (result.success) {
      passed++
    } else {
      failed++
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Test Summary')
  console.log('='.repeat(60))
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📊 Total: ${results.length}`)
  console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`)

  // Detailed failures
  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    results.forEach(({ testCase, result }) => {
      if (!result.success) {
        console.log(`   - ${testCase.name}: ${result.error}`)
      }
    })
  }

  process.exit(failed > 0 ? 1 : 0)
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

