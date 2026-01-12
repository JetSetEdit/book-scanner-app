#!/usr/bin/env npx tsx

/**
 * Test script to verify deduplication logic
 * Rescans an ISBN that should match an existing book by title/author
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables FIRST before importing anything that uses them
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config() // Also load .env if it exists

async function testDeduplication() {
  // Now import after env vars are loaded
  const { processIsbnScan } = await import('../lib/services/scan-service')
  const { createClient } = await import('@supabase/supabase-js')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const testIsbn = '9780439023528' // The ISBN from the deleted duplicate
  
  console.log('🧪 Testing Deduplication Logic\n')
  console.log(`📖 Scanning ISBN: ${testIsbn}`)
  console.log('   (This ISBN was on the deleted duplicate)\n')
  
  // Check existing book before scan
  const { data: existingBook } = await supabase
    .from('books')
    .select('id, isbn, title, author')
    .eq('title', 'The Hunger Games')
    .eq('author', 'Suzanne Collins')
    .maybeSingle()
  
  if (existingBook) {
    console.log(`✅ Found existing book:`)
    console.log(`   ID: ${existingBook.id}`)
    console.log(`   ISBN: ${existingBook.isbn}`)
    console.log(`   Title: ${existingBook.title}`)
    console.log(`   Author: ${existingBook.author}\n`)
  }
  
  console.log('🔄 Starting scan...\n')
  
  const progressMessages: string[] = []
  const onProgress = (message: string | any) => {
    const msg = typeof message === 'string' ? message : message.action || JSON.stringify(message)
    progressMessages.push(msg)
    console.log(`   ${msg}`)
  }
  
  try {
    const result = await processIsbnScan(
      testIsbn,
      onProgress,
      undefined, // no selected candidate
      false, // don't force refresh
      undefined, // use default model
      undefined, // no analysis options
      'deep', // deep scan mode
      null // no model assignment
    )
    
    console.log('\n📊 Scan Result:')
    console.log(`   Success: ${result.success}`)
    console.log(`   Book ID: ${result.book?.id}`)
    console.log(`   Book ISBN: ${result.book?.isbn}`)
    console.log(`   Book Title: ${result.book?.title}`)
    console.log(`   Is New Book: ${result.isNewBook}`)
    
    // Verify deduplication worked
    if (result.book && existingBook) {
      if (result.book.id === existingBook.id) {
        console.log('\n✅ DEDUPLICATION SUCCESSFUL!')
        console.log(`   The scan used the existing book (ID: ${existingBook.id})`)
        console.log(`   instead of creating a new duplicate entry.`)
      } else {
        console.log('\n❌ DEDUPLICATION FAILED!')
        console.log(`   Expected book ID: ${existingBook.id}`)
        console.log(`   Got book ID: ${result.book.id}`)
        console.log(`   A new duplicate was created!`)
      }
    }
    
    // Check for deduplication message in progress
    const dedupMessage = progressMessages.find(msg => 
      msg.toLowerCase().includes('existing entry') || 
      msg.toLowerCase().includes('deduplication') ||
      msg.toLowerCase().includes('using existing book')
    )
    
    if (dedupMessage) {
      console.log(`\n💬 Deduplication message: "${dedupMessage}"`)
    }
    
  } catch (error: any) {
    console.error('\n❌ Scan failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

testDeduplication().catch(console.error)
