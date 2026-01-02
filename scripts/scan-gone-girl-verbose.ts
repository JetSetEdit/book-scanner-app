#!/usr/bin/env tsx
/**
 * Scan "Gone Girl" with verbose output
 * 
 * Usage: tsx --env-file=.env.local scripts/scan-gone-girl-verbose.ts
 */

// Load env vars BEFORE any imports that use them
import 'dotenv/config'
import { processIsbnScan } from '../lib/services/scan-service'
import { createClient } from '@supabase/supabase-js'

const ISBN = '9780307588371'

async function scanGoneGirl() {
  console.log('\n📚 Scanning "Gone Girl" (ISBN: ' + ISBN + ')\n')
  console.log('═'.repeat(80))
  console.log('')

  try {
    const result = await processIsbnScan(
      ISBN,
      (message) => {
        console.log('  ⏳', message)
      },
      undefined, // selectedCandidate
      true // forceRefresh
    )

    console.log('\n')
    console.log('═'.repeat(80))
    console.log('\n📊 SCAN RESULT:\n')

    if (result.error) {
      console.error('❌ Error:', result.error)
      return
    }

    if (!result.book) {
      console.error('❌ No book data returned')
      return
    }

    console.log('📖 Book:')
    console.log('   Title:', result.book.title)
    console.log('   Author:', result.book.author)
    console.log('   ISBN:', result.book.isbn)
    console.log('   ID:', result.book.id)
    console.log('   Description length:', result.book.description?.length || 0, 'characters')
    console.log('')

    // Fetch warnings from database (scan service doesn't return them)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: warnings } = await supabase
      .from('content_warnings')
      .select('*')
      .eq('book_id', result.book.id)
      .order('created_at', { ascending: false })

    if (warnings && warnings.length > 0) {
      console.log('📋 CONTENT WARNINGS (' + warnings.length + ' total):\n')

      warnings.forEach((w, i) => {
        const severityEmoji = w.severity === 'severe' ? '🔴' : w.severity === 'moderate' ? '🟡' : '🟢'
        console.log(`${i + 1}. ${severityEmoji} ${w.severity.toUpperCase()}: ${w.category_id}.${w.subcategory_id}`)
        console.log(`   Description: ${w.description || 'No description'}`)
        
        if (w.confidence_score) {
          console.log(`   Confidence: ${(w.confidence_score * 100).toFixed(1)}%`)
        }
        
        if (w.is_spoiler) {
          console.log(`   ⚠️  SPOILER`)
        }
        
        if (w.source) {
          console.log(`   Source: ${w.source}`)
        }
        
        if (w.reasoning) {
          console.log(`   Reasoning: ${w.reasoning.substring(0, 150)}${w.reasoning.length > 150 ? '...' : ''}`)
        }
        
        if (w.severity_signals) {
          const signals = typeof w.severity_signals === 'string' ? JSON.parse(w.severity_signals) : w.severity_signals
          console.log(`   Severity Signals:`)
          console.log(`      - Frequency: ${signals.frequency?.toFixed(2) || 'N/A'}`)
          console.log(`      - Explicitness: ${signals.explicitness?.toFixed(2) || 'N/A'}`)
          console.log(`      - Proximity: ${signals.proximity?.toFixed(2) || 'N/A'}`)
          console.log(`      - Centrality: ${signals.centrality?.toFixed(2) || 'N/A'}`)
          console.log(`      - Intensity: ${signals.intensity?.toFixed(2) || 'N/A'}`)
        }
        
        if (w.evidence) {
          const evidence = typeof w.evidence === 'string' ? JSON.parse(w.evidence) : w.evidence
          if (Array.isArray(evidence) && evidence.length > 0) {
            console.log(`   Evidence (${evidence.length} excerpt(s)):`)
            evidence.forEach((e: any, idx: number) => {
              console.log(`      ${idx + 1}. "${e.excerpt?.substring(0, 100)}${e.excerpt && e.excerpt.length > 100 ? '...' : ''}"`)
              if (e.location) {
                console.log(`         Location: ${e.location}`)
              }
              if (e.confidence) {
                console.log(`         Confidence: ${(e.confidence * 100).toFixed(1)}%`)
              }
            })
          }
        }
        
        console.log('')
      })

      // Check for specific warnings
      const kidnapping = warnings.find(w => 
        w.subcategory_id?.includes('kidnapping') || 
        w.subcategory_id?.includes('confinement')
      )

      if (kidnapping) {
        console.log('✅ KIDNAPPING DETECTED:', kidnapping.severity.toUpperCase())
      } else {
        console.log('❌ KIDNAPPING NOT FOUND')
      }

      const death = warnings.find(w => 
        w.category_id === 'death_or_grief' || 
        w.subcategory_id?.includes('death') ||
        w.subcategory_id?.includes('grief')
      )

      if (death) {
        console.log('✅ DEATH/GRIEF DETECTED:', death.severity.toUpperCase(), '-', death.subcategory_id)
      } else {
        console.log('❌ DEATH/GRIEF NOT FOUND')
      }

    } else {
      console.log('❌ No warnings detected')
    }

    console.log('\n')
    console.log('═'.repeat(80))
    console.log('\n✅ Scan complete!\n')

  } catch (error) {
    console.error('\n❌ Scan failed:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
      console.error('   Stack:', error.stack)
    }
  }
}

scanGoneGirl().catch(console.error)

