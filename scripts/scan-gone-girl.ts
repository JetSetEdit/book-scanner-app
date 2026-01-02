#!/usr/bin/env tsx
/**
 * Scan "Gone Girl" and save warnings to database
 */

import 'dotenv/config'
import { processIsbnScan } from '../lib/services/scan-service'

async function scanGoneGirl() {
  const isbn = '9780307588371'

  console.log(`\n📚 Scanning "Gone Girl" (ISBN: ${isbn})\n`)
  console.log('─'.repeat(60))

  const result = await processIsbnScan(
    isbn,
    (message) => {
      if (typeof message === 'string') {
        console.log(`  ${message}`)
      } else {
        console.log(`  ${message.action}`)
      }
    },
    undefined,
    true // forceRefresh - will delete old warnings and generate new ones
  )

  console.log('\n' + '─'.repeat(60))
  console.log('\n✅ Scan Complete!\n')

  if (result.success) {
    console.log(`📖 Book: ${result.book?.title || 'Unknown'}`)
    console.log(`👤 Author: ${result.book?.author || 'Unknown'}`)
    console.log(`⚠️  Warnings Generated: ${result.contentWarningsGenerated ? 'Yes' : 'No'}`)
    console.log(`📊 Warning Count: ${result.warningsCount || 0}`)
    
    if (result.book) {
      console.log(`\n🔗 View at: /book/${isbn}`)
    }
  } else {
    console.log(`❌ Scan failed: ${result.error || 'Unknown error'}`)
  }

  console.log('')
}

scanGoneGirl().catch(console.error)

