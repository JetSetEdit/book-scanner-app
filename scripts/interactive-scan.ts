#!/usr/bin/env tsx

/**
 * Interactive Book Scanner
 * 
 * Simple terminal interface to scan books and see results
 * 
 * Usage: npx tsx scripts/interactive-scan.ts
 */

import * as readline from 'readline'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load .env.local
const envPaths = [
  path.join(__dirname, '..', '.env.local'),
  path.join(process.cwd(), '.env.local'),
  '.env.local'
]

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
    break
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function scanBook(isbn: string) {
  console.log(`\n📚 Scanning ISBN: ${isbn}\n`)
  console.log('─'.repeat(60))
  
  try {
    const response = await fetch(`${BASE_URL}/api/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isbn }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText || 'Failed to scan ISBN' }
      }
      throw new Error(errorData.error || 'Failed to scan ISBN')
    }

    // Handle streaming response
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let result: any = null
    let buffer = ''

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          // Check buffer one last time
          if (buffer.trim()) {
            const lines = buffer.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6))
                  if (data.result) {
                    result = data.result
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.status) {
                // Progress update
                console.log(`  → ${data.status}`)
              } else if (data.result) {
                result = data.result
              } else if (data.error) {
                throw new Error(data.error)
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
        
        if (result) break
      }
    } else {
      const data = await response.json()
      result = data.result || data
    }

    if (!result) {
      throw new Error('No result received from scan')
    }

    // Display results
    console.log('\n' + '═'.repeat(60))
    console.log('📋 SCAN RESULTS')
    console.log('═'.repeat(60) + '\n')

    if (result.book) {
      console.log(`Title: ${result.book.title || 'N/A'}`)
      console.log(`Author: ${result.book.author || 'N/A'}`)
      console.log(`ISBN: ${result.book.isbn || isbn}`)
      console.log(`Book ID: ${result.book.id || 'N/A'}`)
    }

    console.log(`\nNew Book: ${result.isNewBook ? 'Yes' : 'No'}`)
    console.log(`Warnings Generated: ${result.contentWarningsGenerated ? 'Yes' : 'No'}`)

    if (result.timings) {
      console.log('\n⏱️  Timings:')
      console.log(`  Total: ${(result.timings.total / 1000).toFixed(2)}s`)
      if (result.timings.aiContentWarningGeneration) {
        console.log(`  AI Analysis: ${(result.timings.aiContentWarningGeneration / 1000).toFixed(2)}s`)
      }
    }

    if (result.flags) {
      console.log('\n📊 Flags:')
      console.log(`  Used Web Search: ${result.flags.usedWebSearch ? 'Yes' : 'No'}`)
      console.log(`  Thin Metadata: ${result.flags.isThinMetadata ? 'Yes' : 'No'}`)
    }

    console.log('\n' + '═'.repeat(60))
    console.log('✅ Scan complete!\n')

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error)
    console.log('')
  }
}

async function main() {
  console.log('\n' + '═'.repeat(60))
  console.log('📚 Interactive Book Scanner')
  console.log('═'.repeat(60))
  console.log('Enter ISBNs to scan (or "quit" to exit)\n')

  while (true) {
    const input = await question('ISBN: ')

    if (!input || input.trim().toLowerCase() === 'quit' || input.trim().toLowerCase() === 'exit') {
      console.log('\n👋 Goodbye!\n')
      break
    }

    const isbn = input.trim()
    if (isbn) {
      await scanBook(isbn)
    }
  }

  rl.close()
}

main().catch(console.error)


