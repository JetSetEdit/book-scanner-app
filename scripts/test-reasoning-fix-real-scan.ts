#!/usr/bin/env tsx
/**
 * Test the reasoning fix with a real book scan
 * Verifies that reasoning text matches computed severity
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

import { processIsbnScan } from '../lib/services/scan-service'

// Test with "Sharp Objects" to verify the fix
const TEST_ISBN = '9780753822210'
const TEST_TITLE = 'Sharp Objects'

async function verifyReasoningMatchesSeverity(bookId: string) {
  console.log('\n🔍 Verifying reasoning matches computed severity...\n')
  
  // Import Supabase client after env is loaded
  const { createClient } = await import('@supabase/supabase-js')
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase environment variables')
    return false
  }
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  const { data: warnings, error } = await supabase
    .from('content_warnings')
    .select('category, subcategory_id, severity, reasoning, severity_signals')
    .eq('book_id', bookId)
    .order('severity', { ascending: false })

  if (error) {
    console.error('❌ Error fetching warnings:', error)
    return false
  }

  if (!warnings || warnings.length === 0) {
    console.log('⚠️  No warnings found for this book')
    return false
  }

  console.log(`📊 Found ${warnings.length} warnings\n`)
  
  let allMatch = true
  let mismatchCount = 0

  for (const warning of warnings) {
    const reasoning = warning.reasoning || ''
    const computedSeverity = warning.severity
    
    // Check if reasoning mentions the computed severity
    // Look for explicit severity classification mentions
    const severityPattern = new RegExp(`\\b${computedSeverity}\\s+severity\\b`, 'i')
    const mentionsSeverity = severityPattern.test(reasoning)
    
    // Also check for opposite severity mentions (which would be wrong)
    const oppositeSeverities = ['mild', 'moderate', 'severe'].filter(s => s !== computedSeverity)
    const mentionsOpposite = oppositeSeverities.some(opp => {
      const oppPattern = new RegExp(`\\b${opp}\\s+severity\\b`, 'i')
      return oppPattern.test(reasoning) || 
             reasoning.toLowerCase().includes(`justifying a ${opp}`) ||
             reasoning.toLowerCase().includes(`supporting a ${opp} classification`)
    })

    const status = mentionsSeverity && !mentionsOpposite ? '✅' : '❌'
    
    if (!mentionsSeverity || mentionsOpposite) {
      allMatch = false
      mismatchCount++
    }

    console.log(`${status} ${warning.category}${warning.subcategory_id ? '.' + warning.subcategory_id : ''}`)
    console.log(`   Computed: ${computedSeverity.toUpperCase()}`)
    console.log(`   Reasoning: ${reasoning.substring(0, 120)}...`)
    console.log(`   Match: ${mentionsSeverity && !mentionsOpposite ? 'YES' : 'NO'}`)
    
    if (warning.severity_signals) {
      const signals = warning.severity_signals as any
      console.log(`   Signals: freq=${signals.frequency?.toFixed(1)}, prox=${signals.proximity?.toFixed(1)}, cent=${signals.centrality?.toFixed(1)}, expl=${signals.explicitness?.toFixed(1)}`)
    }
    console.log('')
  }

  console.log('='.repeat(60))
  if (allMatch) {
    console.log('✅ ALL REASONING TEXTS MATCH COMPUTED SEVERITY!')
    console.log(`   ${warnings.length}/${warnings.length} warnings verified`)
  } else {
    console.log(`❌ MISMATCHES DETECTED: ${mismatchCount}/${warnings.length} warnings have incorrect reasoning`)
  }
  console.log('='.repeat(60))

  return allMatch
}

async function main() {
  console.log('🧪 Testing Reasoning Fix with Real Scan\n')
  console.log('='.repeat(60))
  console.log(`📚 Book: ${TEST_TITLE}`)
  console.log(`📖 ISBN: ${TEST_ISBN}`)
  console.log('='.repeat(60))

  try {
    // Scan the book with forceRefresh to get new reasoning
    console.log('\n🔄 Scanning book (forceRefresh=true)...\n')
    
    const result = await processIsbnScan(
      TEST_ISBN,
      (message) => {
        if (typeof message === 'string') {
          // Only show key progress messages
          if (message.includes('Analysis') || message.includes('warnings') || message.includes('complete')) {
            console.log(`  ${message}`)
          }
        }
      },
      undefined, // selectedCandidate
      true, // forceRefresh - will regenerate warnings with updated reasoning
      'gpt-4o'
    )

    if (!result.success || !result.book) {
      console.error('❌ Scan failed:', result.error || 'Unknown error')
      process.exit(1)
    }

    console.log('\n✅ Scan completed successfully!')
    console.log(`📖 Book ID: ${result.book.id}`)
    console.log(`⚠️  Warnings: ${result.warningsCount || 0}`)

    // Wait a moment for database to update
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Verify reasoning matches severity
    const verified = await verifyReasoningMatchesSeverity(result.book.id)

    if (verified) {
      console.log('\n🎉 SUCCESS: All reasoning texts match computed severity!')
      console.log('   The fix is working correctly.\n')
      process.exit(0)
    } else {
      console.log('\n⚠️  WARNING: Some reasoning texts still have mismatches.')
      console.log('   The fix may need refinement.\n')
      process.exit(1)
    }

  } catch (error) {
    console.error('\n❌ Error during scan:', error)
    process.exit(1)
  }
}

main().catch(console.error)

