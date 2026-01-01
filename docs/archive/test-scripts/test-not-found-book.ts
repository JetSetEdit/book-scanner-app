#!/usr/bin/env tsx
/**
 * Test that invalid ISBNs don't create "Unknown Book" records
 */

async function testNotFoundBook() {
  console.log('🧪 Testing: Invalid ISBN should return error, not create "Unknown Book" record\n')
  
  // Use a clearly invalid ISBN that definitely won't exist
  // Format: 13 digits starting with 999 (not a valid publisher prefix)
  const invalidIsbn = '9991234567890'
  
  console.log(`Testing with ISBN: ${invalidIsbn}\n`)
  
  try {
    const response = await fetch('http://localhost:3000/api/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        isbn: invalidIsbn,
        forceRefresh: false 
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('No response body')
    }

    let buffer = ''
    let lastStatus = ''
    let result: any = null
    let error: any = null

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.status) {
              const status = typeof data.status === 'string' ? data.status : data.status.action
              if (status !== lastStatus) {
                console.log(`  ${status}`)
                lastStatus = status
              }
            }
            if (data.result) {
              result = data.result
            }
            if (data.error) {
              error = data.error
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    console.log('\n' + '='.repeat(60))
    
    if (error) {
      console.log('❌ Error received:', error)
      console.log('✅ Correct: Error returned instead of creating record')
      return
    }
    
    if (result) {
      console.log('📊 Result received:')
      console.log(`   Success: ${result.success}`)
      console.log(`   Status: ${result.status}`)
      console.log(`   Message: ${result.message || 'N/A'}`)
      console.log(`   Book: ${result.book ? result.book.title : 'null'}`)
      
      if (result.success === false && result.status === 'error') {
        console.log('\n✅ PASS: Correctly returned error, no book record created')
      } else if (result.book && result.book.title?.includes('Unknown')) {
        console.log('\n❌ FAIL: Still creating "Unknown Book" record!')
        console.log('   Book title:', result.book.title)
      } else {
        console.log('\n⚠️  UNEXPECTED: Got a result but not sure if it\'s correct')
      }
    } else {
      console.log('⚠️  No result or error received')
    }
    
  } catch (error) {
    console.error(`❌ Test error:`, error instanceof Error ? error.message : error)
  }
}

testNotFoundBook().catch(console.error)

