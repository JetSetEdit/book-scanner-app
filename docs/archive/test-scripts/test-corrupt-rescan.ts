#!/usr/bin/env tsx
/**
 * Test re-scanning Corrupt to verify it doesn't generate generic warnings
 */

async function testRescan() {
  console.log('📚 Testing re-scan of "Corrupt" with improved prompts...\n')
  
  try {
    const response = await fetch('http://localhost:3000/api/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        isbn: '9781518783876',
        forceRefresh: true 
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
              console.log(`\n✅ Scan complete!`)
              console.log(`   Warnings generated: ${data.result.contentWarningsGenerated}`)
              if (!data.result.contentWarningsGenerated) {
                console.log(`   ✅ Correctly skipped analysis due to minimal description`)
              }
              return data.result
            }
            if (data.error) {
              throw new Error(data.error)
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error:`, error instanceof Error ? error.message : error)
    throw error
  }
}

testRescan().catch(console.error)

