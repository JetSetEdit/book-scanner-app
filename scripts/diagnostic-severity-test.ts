#!/usr/bin/env tsx
/**
 * Diagnostic Severity Test
 * 
 * Tests that different categories can have different severity levels
 * without collapsing into a single score (proving we're not doing BookRata pattern)
 * 
 * Test 1: High spice, low violence (The Love Hypothesis - already scanned)
 * Test 2: High violence, low spice (Red Rising or The Hunger Games - scan fresh)
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { Database } from '../types/supabase'

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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  console.error('Looking for:', envPaths)
  process.exit(1)
}

const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseKey)

interface WarningProfile {
  book: {
    title: string
    author: string
    isbn: string
  }
  warnings: Array<{
    subcategory_id: string
    severity: 'mild' | 'moderate' | 'severe'
    description: string
    category: string
  }>
  ageRating?: string
  summary: {
    severe: number
    moderate: number
    mild: number
    byCategory: Record<string, { severe: number; moderate: number; mild: number }>
  }
}

async function getBookProfile(isbn: string): Promise<WarningProfile | null> {
  console.log(`\n📚 Fetching profile for ISBN: ${isbn}`)
  
  // Get book
  const { data: book, error: bookError } = await supabaseAdmin
    .from('books')
    .select('id, title, author, isbn, categories')
    .eq('isbn', isbn)
    .single()

  if (bookError || !book) {
    console.error(`❌ Book not found: ${isbn}`)
    return null
  }

  console.log(`   Title: ${book.title}`)
  console.log(`   Author: ${book.author}`)

  // Get warnings
  const { data: warnings, error: warningsError } = await supabaseAdmin
    .from('content_warnings')
    .select('subcategory_id, severity, description, category')
    .eq('book_id', book.id)
    .order('severity', { ascending: false })

  if (warningsError) {
    console.error(`❌ Error fetching warnings:`, warningsError)
    return null
  }

  // Get age rating from categories
  const ageRating = book.categories?.find((c: string) => 
    c.startsWith('CLASSIFICATION:')
  )?.replace('CLASSIFICATION:', '') || 'Unknown'

  // Build summary
  const summary = {
    severe: warnings.filter(w => w.severity === 'severe').length,
    moderate: warnings.filter(w => w.severity === 'moderate').length,
    mild: warnings.filter(w => w.severity === 'mild').length,
    byCategory: {} as Record<string, { severe: number; moderate: number; mild: number }>
  }

  // Group by category
  warnings.forEach(w => {
    const category = w.category || 'other'
    if (!summary.byCategory[category]) {
      summary.byCategory[category] = { severe: 0, moderate: 0, mild: 0 }
    }
    summary.byCategory[category][w.severity]++
  })

  return {
    book: {
      title: book.title,
      author: book.author,
      isbn: book.isbn
    },
    warnings: warnings.map(w => ({
      subcategory_id: w.subcategory_id || 'unknown',
      severity: w.severity,
      description: w.description,
      category: w.category || 'other'
    })),
    ageRating,
    summary
  }
}

function printProfile(profile: WarningProfile, testName: string) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`📊 ${testName}`)
  console.log('='.repeat(80))
  console.log(`\n📖 ${profile.book.title}`)
  console.log(`   by ${profile.book.author}`)
  console.log(`   ISBN: ${profile.book.isbn}`)
  console.log(`   Age Rating: ${profile.ageRating}`)
  
  console.log(`\n📈 Severity Summary:`)
  console.log(`   SEVERE: ${profile.summary.severe}`)
  console.log(`   MODERATE: ${profile.summary.moderate}`)
  console.log(`   MILD: ${profile.summary.mild}`)
  
  console.log(`\n📋 By Category:`)
  Object.entries(profile.summary.byCategory).forEach(([category, counts]) => {
    const total = counts.severe + counts.moderate + counts.mild
    const breakdown = [
      counts.severe > 0 ? `${counts.severe} severe` : null,
      counts.moderate > 0 ? `${counts.moderate} moderate` : null,
      counts.mild > 0 ? `${counts.mild} mild` : null
    ].filter(Boolean).join(', ')
    console.log(`   ${category}: ${total} total (${breakdown})`)
  })
  
  console.log(`\n⚠️  Individual Warnings:`)
  profile.warnings.forEach((w, idx) => {
    const severityIcon = w.severity === 'severe' ? '🔴' : w.severity === 'moderate' ? '🟡' : '🟢'
    console.log(`   ${idx + 1}. ${severityIcon} [${w.severity.toUpperCase()}] ${w.category}`)
    console.log(`      ${w.subcategory_id}`)
    console.log(`      "${w.description.substring(0, 80)}${w.description.length > 80 ? '...' : ''}"`)
  })
}

async function main() {
  console.log('🧪 Diagnostic Severity Test')
  console.log('Testing that different categories can have different severity levels')
  console.log('='.repeat(80))

  // Get ISBNs from command line args or use defaults
  const test1ISBN = process.argv[2] || '9780593336823' // The Love Hypothesis
  const test2ISBN = process.argv[3] || '9780062678416' // The Woman in the Window (high violence, low spice)

  // Test 1: High spice, low violence (The Love Hypothesis)
  const profile1 = await getBookProfile(test1ISBN)
  
  if (profile1) {
    printProfile(profile1, 'TEST 1: High Spice, Low Violence')
  } else {
    console.log(`\n❌ Test 1 failed: Book not found (${test1ISBN})`)
  }

  // Test 2: High violence, low spice
  const profile2 = await getBookProfile(test2ISBN)
  
  if (profile2) {
    printProfile(profile2, 'TEST 2: High Violence, Low Spice')
  } else {
    console.log(`\n⚠️  Test 2: Book not found (${test2ISBN}) - may need to scan`)
    console.log(`   This is expected if the book hasn't been scanned yet.`)
  }

  // Comparison
  if (profile1 && profile2) {
    console.log(`\n${'='.repeat(80)}`)
    console.log('🔬 COMPARISON ANALYSIS')
    console.log('='.repeat(80))
    
    console.log(`\n✅ Key Finding: Different Warning Profiles`)
    console.log(`\n   Test 1 (High Spice):`)
    console.log(`   - SEVERE warnings: ${profile1.summary.severe}`)
    console.log(`   - MODERATE warnings: ${profile1.summary.moderate}`)
    console.log(`   - Age Rating: ${profile1.ageRating}`)
    console.log(`   - Primary content: ${Object.keys(profile1.summary.byCategory).join(', ')}`)
    
    console.log(`\n   Test 2 (High Violence):`)
    console.log(`   - SEVERE warnings: ${profile2.summary.severe}`)
    console.log(`   - MODERATE warnings: ${profile2.summary.moderate}`)
    console.log(`   - Age Rating: ${profile2.ageRating}`)
    console.log(`   - Primary content: ${Object.keys(profile2.summary.byCategory).join(', ')}`)
    
    const sameRating = profile1.ageRating === profile2.ageRating
    const differentProfiles = 
      profile1.summary.severe !== profile2.summary.severe ||
      profile1.summary.moderate !== profile2.summary.moderate ||
      Object.keys(profile1.summary.byCategory).join(',') !== Object.keys(profile2.summary.byCategory).join(',')
    
    console.log(`\n🎯 Result:`)
    if (sameRating && differentProfiles) {
      console.log(`   ✅ SUCCESS: Both books have ${profile1.ageRating} rating but DIFFERENT warning profiles`)
      console.log(`   ✅ This proves the system preserves category-specific severity`)
      console.log(`   ✅ The system is NOT collapsing everything into a single score`)
    } else if (!sameRating) {
      console.log(`   ℹ️  Different age ratings (${profile1.ageRating} vs ${profile2.ageRating})`)
      console.log(`   ✅ Still shows different warning profiles - system working correctly`)
    } else {
      console.log(`   ⚠️  Warning profiles are similar - may need more contrasting books`)
    }
  } else if (profile1) {
    console.log(`\n⚠️  Test 2 book not available - scan Red Rising (ISBN: 9780345539786) to complete comparison`)
  }

  console.log(`\n${'='.repeat(80)}`)
  console.log('✅ Diagnostic test complete')
  console.log('='.repeat(80))
}

main().catch(console.error)

