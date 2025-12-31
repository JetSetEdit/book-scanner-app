#!/usr/bin/env tsx

/**
 * Simple Book Checker Script
 * 
 * Checks basic book information for a given ISBN
 * Outputs simple yes/no status for each check
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { normalizeISBN } from '../lib/isbn-validation'
import { fetchCandidatesByISBN } from '../lib/book-api'

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBook(isbn: string) {
  const cleanIsbn = normalizeISBN(isbn)
  
  console.log(`\n📚 Checking ISBN: ${cleanIsbn}\n`)
  console.log('─'.repeat(50))
  
  // Check 1: Book in database
  console.log('\n1. Database Check:')
  const { data: dbBook, error: dbError } = await supabase
    .from('books')
    .select('id, title, author, cover_url, description')
    .eq('isbn', cleanIsbn)
    .maybeSingle()
  
  if (dbError) {
    console.log('   ❌ Database error:', dbError.message)
  } else if (dbBook) {
    console.log('   ✅ Found book - y')
    console.log(`      Title: ${dbBook.title || 'N/A'}`)
    console.log(`      Author: ${dbBook.author || 'N/A'}`)
  } else {
    console.log('   ❌ Found book - n')
  }
  
  // Check 2: Cover URL
  if (dbBook?.cover_url) {
    console.log('\n2. Cover Check:')
    try {
      const response = await fetch(dbBook.cover_url, { method: 'HEAD' })
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        const contentLength = response.headers.get('content-length')
        const size = contentLength ? parseInt(contentLength) : 0
        
        if (size > 1000 && size !== 15567) {
          console.log('   ✅ Found cover - y')
          console.log(`      URL: ${dbBook.cover_url.substring(0, 60)}...`)
          console.log(`      Size: ${(size / 1024).toFixed(1)} KB`)
        } else {
          console.log('   ⚠️  Found cover - n (placeholder or too small)')
        }
      } else {
        console.log('   ❌ Found cover - n (invalid URL)')
      }
    } catch (error) {
      console.log('   ❌ Found cover - n (fetch failed)')
    }
  } else {
    console.log('\n2. Cover Check:')
    console.log('   ❌ Found cover - n (no URL in database)')
  }
  
  // Check 3: Description
  console.log('\n3. Description Check:')
  if (dbBook?.description) {
    const descLength = dbBook.description.length
    console.log('   ✅ Found description - y')
    console.log(`      Length: ${descLength} characters`)
    if (descLength < 150) {
      console.log('      ⚠️  Thin description (< 150 chars)')
    }
  } else {
    console.log('   ❌ Found description - n')
  }
  
  // Check 4: External API check
  console.log('\n4. External API Check:')
  try {
    const candidates = await fetchCandidatesByISBN(cleanIsbn)
    if (candidates.length > 0) {
      console.log('   ✅ Found in external APIs - y')
      console.log(`      Found ${candidates.length} candidate(s)`)
      candidates.slice(0, 3).forEach((c, i) => {
        console.log(`      ${i + 1}. ${c.title} by ${c.author || 'Unknown'} (${c.source})`)
      })
    } else {
      console.log('   ❌ Found in external APIs - n')
    }
  } catch (error) {
    console.log('   ❌ Found in external APIs - n (error)')
    console.log(`      Error: ${error instanceof Error ? error.message : 'Unknown'}`)
  }
  
  // Check 5: Content warnings
  if (dbBook) {
    console.log('\n5. Content Warnings Check:')
    const { data: warnings, error: warningsError } = await supabase
      .from('content_warnings')
      .select('id, category_id, severity')
      .eq('book_id', dbBook.id)
    
    if (warningsError) {
      console.log('   ❌ Error checking warnings:', warningsError.message)
    } else if (warnings && warnings.length > 0) {
      console.log('   ✅ Found warnings - y')
      console.log(`      Count: ${warnings.length}`)
      const severityCounts = warnings.reduce((acc, w) => {
        acc[w.severity] = (acc[w.severity] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      console.log(`      Severity: ${Object.entries(severityCounts).map(([s, c]) => `${s}:${c}`).join(', ')}`)
    } else {
      console.log('   ❌ Found warnings - n')
    }
  } else {
    console.log('\n5. Content Warnings Check:')
    console.log('   ❌ Found warnings - n (book not in database)')
  }
  
  console.log('\n' + '─'.repeat(50))
  console.log('\n✅ Check complete!\n')
}

// Main
const isbn = process.argv[2]

if (!isbn) {
  console.error('Usage: tsx scripts/check-book.ts <ISBN>')
  console.error('Example: tsx scripts/check-book.ts 9781501110368')
  process.exit(1)
}

checkBook(isbn).catch(error => {
  console.error('\n❌ Error:', error)
  process.exit(1)
})

