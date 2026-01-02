#!/usr/bin/env tsx
/**
 * Re-scan books that don't have warnings to generate them
 */

const booksToRescan = [
  { isbn: '9780008762261', title: 'Grumpy Darling' },
  { isbn: '9781518783876', title: 'Corrupt' },
  { isbn: '9781464225901', title: 'Fallen Academy' },
  { isbn: '9780008684174', title: 'The Wicked Lies of Habren Faire' },
]

async function rescanBook(isbn: string, title: string) {
  console.log(`\n📚 Re-scanning: ${title} (${isbn})`)
  console.log('─'.repeat(60))
  
  try {
    const response = await fetch('http://localhost:3000/api/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        isbn,
        forceRefresh: true 
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    // Read SSE stream
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
              console.log(`   Book ID: ${data.result.book?.id}`)
              console.log(`   Warnings generated: ${data.result.contentWarningsGenerated}`)
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
    console.error(`❌ Error scanning ${title}:`, error instanceof Error ? error.message : error)
    throw error
  }
}

async function main() {
  console.log('🔄 Re-scanning books without warnings...')
  console.log(`Found ${booksToRescan.length} books to re-scan\n`)

  for (const book of booksToRescan) {
    try {
      await rescanBook(book.isbn, book.title)
      // Wait a bit between scans to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error(`Failed to scan ${book.title}:`, error)
    }
  }

  console.log('\n✨ Re-scanning complete!')
}

main().catch(console.error)

