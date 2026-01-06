#!/usr/bin/env tsx
/**
 * Test control book (non-explicit) to ensure explicit trigger isn't causing R18+ drift
 * Recommended: The Hunger Games (MA15+, no explicit sex)
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const CONTROL_BOOK_ISBN = '9780439023481' // The Hunger Games (should be MA15+, not R18+)

const KEY_MODELS = [
  'gpt-5',
  'gpt-5.2',
  'gpt-5.2-pro',
  'gpt-5.2-pro-2025-12-11',
  'gpt-5-mini',
  'gpt-5.1',
]

async function main() {
  console.log('🧪 Control Book Test: Non-Explicit Content')
  console.log('='.repeat(80))
  console.log(`📖 Test Book: The Hunger Games (${CONTROL_BOOK_ISBN})`)
  console.log(`📊 Expected: MA15+ (violence, no explicit sex)`)
  console.log(`⚠️  Risk: If all models return R18+, explicit trigger may be too broad`)
  console.log('')

  const { processIsbnScan } = await import('../lib/services/scan-service')
  const { createClient } = await import('@supabase/supabase-js')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const results: Array<{
    model: string
    rating: string | null
    warnings: number
    hasExplicitSex: boolean
    latency: number
  }> = []

  for (const model of KEY_MODELS) {
    console.log(`\n🧪 Testing: ${model}`)
    const startTime = Date.now()
    
    try {
      const result = await processIsbnScan(
        CONTROL_BOOK_ISBN,
        () => {}, // Suppress progress
        undefined,
        true, // forceRefresh
        model
      )

      const latency = Date.now() - startTime

      if (!result.book) {
        console.log(`   ❌ No book returned`)
        continue
      }

      // Get current rating
      const { data: book } = await supabase
        .from('books')
        .select('categories')
        .eq('id', result.book.id)
        .single()

      const rating = book?.categories?.find((c: string) => 
        c.startsWith('CLASSIFICATION:')
      )?.replace('CLASSIFICATION:', '') || 'Unknown'

      // Check for explicit sexual content warnings
      const { data: warnings } = await supabase
        .from('content_warnings')
        .select('subcategory_id')
        .eq('book_id', result.book.id)
        .or('subcategory_id.ilike.%explicit_sexual_content%,subcategory_id.ilike.%intense_romance%')

      const hasExplicitSex = (warnings?.length || 0) > 0

      results.push({
        model,
        rating,
        warnings: warnings?.length || 0,
        hasExplicitSex,
        latency
      })

      const status = rating === 'R18+' ? '⚠️  R18+' : rating === 'MA15+' ? '✅ MA15+' : '❓ ' + rating
      console.log(`   ${status} | ${warnings?.length || 0} explicit sex warnings | ${latency}ms`)

    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`)
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('📊 CONTROL TEST SUMMARY')
  console.log('='.repeat(80))
  
  const r18Count = results.filter(r => r.rating === 'R18+').length
  const ma15Count = results.filter(r => r.rating === 'MA15+').length
  const explicitSexCount = results.filter(r => r.hasExplicitSex).length

  console.log(`\n✅ Expected: MA15+ (violence, no explicit sex)`)
  console.log(`📊 Results:`)
  console.log(`   MA15+: ${ma15Count}/${results.length} models`)
  console.log(`   R18+: ${r18Count}/${results.length} models`)
  console.log(`   Explicit sex detected: ${explicitSexCount}/${results.length} models`)
  
  if (r18Count > 0) {
    console.log(`\n⚠️  WARNING: ${r18Count} model(s) returned R18+ for non-explicit book!`)
    console.log(`   This suggests the explicit trigger may be too broad.`)
    results.filter(r => r.rating === 'R18+').forEach(r => {
      console.log(`   - ${r.model}: ${r.warnings} explicit sex warning(s)`)
    })
  } else {
    console.log(`\n✅ PASS: All models correctly returned MA15+ (no false R18+ from explicit trigger)`)
  }

  if (explicitSexCount > 0) {
    console.log(`\n⚠️  WARNING: ${explicitSexCount} model(s) detected explicit sexual content in non-explicit book!`)
    results.filter(r => r.hasExplicitSex).forEach(r => {
      console.log(`   - ${r.model}: detected explicit sexual content`)
    })
  } else {
    console.log(`\n✅ PASS: No models falsely detected explicit sexual content`)
  }

  console.log('\n' + '='.repeat(80))
}

main().catch(console.error)

