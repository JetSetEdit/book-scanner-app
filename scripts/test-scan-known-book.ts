#!/usr/bin/env tsx
/**
 * Test scanning a known book to see what breaks
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const TEST_ISBN = '9780064430173' // Goodnight Moon (gentle kids book, likely unscanned)

async function main() {
  console.log('🧪 Testing Scan Flow — New Book (No Warnings Expected)')
  console.log('='.repeat(80))
  console.log(`📖 ISBN: ${TEST_ISBN} (Goodnight Moon)`)
  console.log('')

  const { processIsbnScan } = await import('../lib/services/scan-service')

  try {
    const result = await processIsbnScan(
      TEST_ISBN,
      (msg) => {
        const msgStr = typeof msg === 'string' ? msg : msg.action || JSON.stringify(msg)
        console.log(`   ${msgStr}`)
      },
      undefined, // selectedCandidate
      false, // forceRefresh - should return early for known book
      undefined // model - should use MODEL_VERSION (gpt-5.2-pro-2025-12-11)
    )

    console.log('')
    console.log('✅ Scan completed')
    console.log(`   Success: ${result.success}`)
    console.log(`   Is New Book: ${result.isNewBook}`)
    console.log(`   Content Warnings Generated: ${result.contentWarningsGenerated}`)
    console.log(`   Book Title: ${result.book?.title}`)
    console.log(`   Book ID: ${result.book?.id}`)
    
    if (result.flags) {
      console.log(`   Pipeline Path: ${result.flags.pipelinePath}`)
    }

  } catch (error) {
    console.error('')
    console.error('❌ Scan failed with error:')
    console.error(error instanceof Error ? error.message : String(error))
    if (error instanceof Error && error.stack) {
      console.error('')
      console.error('Stack trace:')
      console.error(error.stack)
    }
  }
}

main().catch(console.error)

