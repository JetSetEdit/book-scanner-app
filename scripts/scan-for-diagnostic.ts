#!/usr/bin/env tsx
/**
 * Scan a book for diagnostic testing
 * Usage: npx tsx scripts/scan-for-diagnostic.ts <ISBN>
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { Database } from '../types/supabase'
import { processIsbnScan } from '../lib/services/scan-service'

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

const isbn = process.argv[2]

if (!isbn) {
  console.error('Usage: npx tsx scripts/scan-for-diagnostic.ts <ISBN>')
  process.exit(1)
}

async function scanBook() {
  console.log(`\n🔍 Scanning book with ISBN: ${isbn}`)
  console.log('='.repeat(80))
  
  const onProgress = (message: string | { action: string }) => {
    const msg = typeof message === 'string' ? message : message.action
    console.log(`   ${msg}`)
  }
  
  try {
    const result = await processIsbnScan(isbn, onProgress, undefined, false)
    
    if (result.success) {
      console.log('\n✅ Scan completed successfully!')
      console.log(`   Book: ${result.book?.title || 'Unknown'}`)
      console.log(`   Warnings: ${result.contentWarningsGenerated ? 'Yes' : 'No'}`)
    } else {
      console.log('\n❌ Scan failed')
      console.log(`   Error: ${result.error || 'Unknown error'}`)
    }
  } catch (error) {
    console.error('\n❌ Scan error:', error)
    process.exit(1)
  }
}

scanBook()

