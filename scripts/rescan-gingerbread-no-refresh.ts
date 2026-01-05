#!/usr/bin/env tsx
import 'dotenv/config'
import { processIsbnScan } from '../lib/services/scan-service'

async function rescanGingerbreadNoRefresh() {
  console.log('🔄 Re-scanning "The Gingerbread Bakery" with updated description (no force refresh)\n')
  console.log('='.repeat(60))

  const isbn = '9780008728090'
  
  console.log(`\n📖 ISBN: ${isbn}`)
  console.log('🔄 Using existing description in database (no force refresh)\n')

  const result = await processIsbnScan(
    isbn,
    (msg) => {
      console.log(`  ${msg}`)
    },
    undefined, // selectedCandidate
    false, // forceRefresh = false to use updated description
    'gpt-4o' // model
  )

  console.log('\n' + '='.repeat(60))
  console.log('\n✅ Scan complete!\n')
  
  console.log(`Success: ${result.success}`)
  console.log(`Book ID: ${result.bookId}`)
  console.log(`Content Warnings Generated: ${result.contentWarningsGenerated}`)
  console.log(`Warnings Count: ${result.warnings?.length || 0}`)
  
  if (result.warnings && result.warnings.length > 0) {
    console.log('\n📋 Warnings Found:')
    result.warnings.forEach((w: any, i: number) => {
      console.log(`\n${i + 1}. ${w.subcategory_id}`)
      console.log(`   Description: ${w.description}`)
      console.log(`   Severity: ${w.severity}`)
    })
  } else {
    console.log('\n❌ No warnings found')
  }

  console.log('\n' + '='.repeat(60))
}

rescanGingerbreadNoRefresh().catch(console.error)

