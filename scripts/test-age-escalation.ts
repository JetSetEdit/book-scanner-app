#!/usr/bin/env tsx
/**
 * Test Age Escalation Weights
 * 
 * Tests the new age escalation weights system with existing books
 * to see how ratings change (or stay the same)
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { Database } from '../types/supabase'
import { calculateAgeRating } from '../lib/utils/age-rating'
import { EnhancedContentWarning } from '../lib/config/taxonomy-context'

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
  process.exit(1)
}

const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseKey)

async function testBook(isbn: string) {
  console.log(`\n📚 Testing: ${isbn}`)
  
  // Get book
  const { data: book, error: bookError } = await supabaseAdmin
    .from('books')
    .select('id, title, author, isbn, categories')
    .eq('isbn', isbn)
    .single()

  if (bookError || !book) {
    console.error(`   ❌ Book not found`)
    return null
  }

  console.log(`   Title: ${book.title}`)
  console.log(`   Author: ${book.author}`)

  // Get warnings
  const { data: warnings, error: warningsError } = await supabaseAdmin
    .from('content_warnings')
    .select('subcategory_id, severity, description, category, category_id')
    .eq('book_id', book.id)

  if (warningsError || !warnings) {
    console.error(`   ❌ Error fetching warnings`)
    return null
  }

  // Get current rating
  const currentRating = book.categories?.find((c: string) => 
    c.startsWith('CLASSIFICATION:')
  )?.replace('CLASSIFICATION:', '') || 'Unknown'

  console.log(`   Current Rating: ${currentRating}`)

  // Convert to EnhancedContentWarning format
  const enhancedWarnings: EnhancedContentWarning[] = warnings.map(w => ({
    subcategory_id: w.subcategory_id || undefined,
    severity: w.severity as 'mild' | 'moderate' | 'severe',
    modifiers: [],
    evidence: [],
    severity_signals: {
      frequency: 0.5,
      explicitness: 0.5,
      proximity: 0.5,
      centrality: 0.5,
      intensity_markers: []
    },
    taxonomy_version: '2.5.0',
    is_spoiler: false,
    description: w.description,
    reasoning: undefined
  }))

  // Calculate new rating
  const newRating = calculateAgeRating(enhancedWarnings)

  console.log(`   New Rating: ${newRating.rating}`)
  console.log(`   Age Recommendation: ${newRating.ageRecommendation}`)
  console.log(`   Reasoning: ${newRating.reasoning}`)

  // Show SEVERE warnings and their escalation weights
  const severeWarnings = warnings.filter(w => w.severity === 'severe')
  if (severeWarnings.length > 0) {
    console.log(`\n   SEVERE Warnings (${severeWarnings.length}):`)
    const { getEscalationWeight } = await import('../lib/config/age-escalation-weights')
    severeWarnings.forEach(w => {
      const categoryId = w.category_id || w.category || 'other'
      const weight = getEscalationWeight(categoryId, w.subcategory_id)
      console.log(`     - ${w.subcategory_id || w.category}: weight ${weight.toFixed(2)}`)
    })
  }

  return {
    isbn,
    title: book.title,
    currentRating,
    newRating: newRating.rating,
    changed: currentRating !== newRating.rating
  }
}

async function main() {
  console.log('🧪 Testing Age Escalation Weights')
  console.log('='.repeat(80))

  const testBooks = [
    '9780593336823', // The Love Hypothesis (0 SEVERE, should be M)
    '9780062678416', // The Woman in the Window (1 SEVERE mental health, should be MA15+)
    '9781619634442', // A Court of Thorns and Roses (if available)
  ]

  const results: Array<{ isbn: string; title: string; currentRating: string; newRating: string; changed: boolean }> = []

  for (const isbn of testBooks) {
    const result = await testBook(isbn)
    if (result) {
      results.push(result)
    }
  }

  console.log(`\n${'='.repeat(80)}`)
  console.log('📊 SUMMARY')
  console.log('='.repeat(80))

  results.forEach(r => {
    const status = r.changed ? '🔄 CHANGED' : '✅ UNCHANGED'
    console.log(`\n${status}: ${r.title}`)
    console.log(`   ${r.currentRating} → ${r.newRating}`)
  })

  const changedCount = results.filter(r => r.changed).length
  console.log(`\n📈 Results: ${changedCount}/${results.length} ratings changed`)
}

main().catch(console.error)

