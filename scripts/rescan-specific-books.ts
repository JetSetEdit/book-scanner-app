#!/usr/bin/env tsx
/**
 * Re-scan specific books with forceRefresh: true
 * This applies the latest analysis logic including the new explicit_sexual_content decision rubric
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load .env.local FIRST before any other imports
dotenv.config({ path: '.env.local' })
dotenv.config() // Also load .env if it exists

const booksToRescan = [
  { isbn: '9780571334650', title: 'Normal People' },
]

async function rescanBook(isbn: string, title: string) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`🔄 Re-scanning: ${title} (${isbn})`)
  console.log('='.repeat(80))
  
  // Dynamic import after env vars are loaded
  const { processIsbnScan } = await import('../lib/services/scan-service')
  
  try {
    const result = await processIsbnScan(
      isbn,
      (progress) => {
        process.stdout.write(`\r   ${progress}`)
      },
      undefined, // selectedCandidate
      true, // forceRefresh: true - this will re-analyze with latest logic
      'gpt-5' // model - testing with GPT 5.0 (latest)
    )
    
    console.log(`\n   ✅ Complete`)
    console.log(`   Rating: ${result.ageRating?.rating || 'N/A'}`)
    console.log(`   Warnings: ${result.warnings?.length || 0}`)
    
    // Check for explicit_sexual_content vs intense_romance
    const explicitSex = result.warnings?.filter(w => 
      w.subcategory_id?.includes('explicit_sexual_content')
    ) || []
    const intenseRomance = result.warnings?.filter(w => 
      w.subcategory_id?.includes('intense_romance')
    ) || []
    
    if (explicitSex.length > 0) {
      console.log(`   ✅ Found ${explicitSex.length} explicit_sexual_content warning(s)`)
      explicitSex.forEach(w => {
        console.log(`      - ${w.subcategory_id}: ${w.severity} (${w.description})`)
      })
    }
    if (intenseRomance.length > 0) {
      console.log(`   📝 Found ${intenseRomance.length} intense_romance warning(s)`)
      intenseRomance.forEach(w => {
        console.log(`      - ${w.subcategory_id}: ${w.severity} (${w.description})`)
      })
    }
    
    return result
  } catch (error) {
    console.error(`\n   ❌ Error:`, error instanceof Error ? error.message : String(error))
    return null
  }
}

async function main() {
  console.log('🔄 Re-scanning specific books with latest logic')
  console.log('='.repeat(80))
  console.log('This will apply the new explicit_sexual_content decision rubric')
  
  for (const book of booksToRescan) {
    await rescanBook(book.isbn, book.title)
    // Small delay between scans
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  console.log(`\n${'='.repeat(80)}`)
  console.log('✅ Re-scan complete')
  console.log('='.repeat(80))
  console.log('\nRun the diagnostic script to see updated impact scores:')
  console.log('  npx tsx scripts/diagnostic-age-rating.ts')
}

main().catch(console.error)

