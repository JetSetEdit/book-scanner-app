#!/usr/bin/env tsx
/**
 * Test API Response Script
 * 
 * Tests the multi-model analysis API to see what response we get
 * for a specific book (Gone Girl by default)
 * 
 * Usage: tsx --env-file=.env.local scripts/test-api-response.ts
 */

// Import dotenv/config to load .env.local automatically
import 'dotenv/config'
import { analyzeBookWithMultiModel } from '../lib/services/multi-model-analysis'

// Check for API keys
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Missing OPENAI_API_KEY in .env.local')
  process.exit(1)
}

if (!process.env.GEMINI_API_KEY) {
  console.error('⚠️  Missing GEMINI_API_KEY in .env.local (will use OpenAI only)')
}

async function testAPIResponse() {
  // Test with "Gone Girl" metadata
  const testMetadata = {
    title: "Gone Girl",
    author: "Gillian Flynn",
    isbn: "9780307588371",
    description: `On a warm summer morning in North Carthage, Missouri, it is Nick and Amy Dunne's fifth wedding anniversary. Presents are being wrapped and reservations are being made when Nick's clever and beautiful wife disappears. Husband-of-the-Year Nick isn't doing himself any favors with cringe-worthy daydreams about the slope and shape of his wife's head, but passages from Amy's diary reveal the alpha-girl perfectionist could have put anyone dangerously on edge. Under mounting pressure from the police and the media—as well as Amy's fiercely doting parents—the town golden boy parades an endless series of lies, deceits, and inappropriate behavior. Nick is oddly evasive, and he's definitely bitter—but is he really a killer?`
  }

  console.log('\n🧪 Testing Multi-Model Analysis API\n')
  console.log('─'.repeat(60))
  console.log(`\n📚 Book: ${testMetadata.title}`)
  console.log(`👤 Author: ${testMetadata.author}`)
  console.log(`📖 ISBN: ${testMetadata.isbn}`)
  console.log(`📝 Description: ${testMetadata.description.substring(0, 100)}...`)
  console.log('\n' + '─'.repeat(60))
  console.log('\n⏳ Calling API...\n')

  try {
    const startTime = Date.now()
    
    const result = await analyzeBookWithMultiModel(
      testMetadata,
      (message) => {
        console.log(`  ${message}`)
      }
    )

    const duration = Date.now() - startTime

    console.log('\n' + '─'.repeat(60))
    console.log('\n✅ API Response Received\n')
    console.log(`⏱️  Duration: ${duration}ms\n`)

    // Log full response structure
    console.log('📊 Response Structure:')
    console.log(JSON.stringify(result, null, 2))

    // Detailed breakdown
    console.log('\n' + '─'.repeat(60))
    console.log('\n📋 Detailed Breakdown:\n')

    console.log(`Total Warnings: ${result.warnings.length}`)
    console.log(`Agreement Score: ${(result.analysis.agreement_score * 100).toFixed(1)}%`)
    console.log(`OpenAI Warnings: ${result.model_results.openai.length}`)
    console.log(`Gemini Warnings: ${result.model_results.gemini.length}`)
    console.log(`Unique to OpenAI: ${result.analysis.unique_to_openai.length}`)
    console.log(`Unique to Gemini: ${result.analysis.unique_to_gemini.length}`)

    if (result.analysis.verification_metrics) {
      console.log('\n🔍 Verification Metrics:')
      console.log(`  Unique Before: ${result.analysis.verification_metrics.unique_before}`)
      console.log(`  Kept: ${result.analysis.verification_metrics.kept}`)
      console.log(`  Dropped: ${result.analysis.verification_metrics.dropped}`)
      console.log(`  Adjusted: ${result.analysis.verification_metrics.adjusted}`)
      console.log(`  Latency: ${result.analysis.verification_metrics.latency_ms}ms`)
    }

    // Show raw warnings before verification
    console.log('\n' + '─'.repeat(60))
    console.log('\n📋 Raw Warnings (Before Verification):\n')
    
    const allRawWarnings = [
      ...result.model_results.openai,
      ...result.model_results.gemini
    ]
    
    console.log(`OpenAI Raw Warnings (${result.model_results.openai.length}):`)
    result.model_results.openai.forEach((w, i) => {
      console.log(`  ${i + 1}. [${w.severity}] ${w.subcategory_id}`)
      console.log(`     Description: ${w.description || 'N/A'}`)
    })
    
    if (result.model_results.gemini.length > 0) {
      console.log(`\nGemini Raw Warnings (${result.model_results.gemini.length}):`)
      result.model_results.gemini.forEach((w, i) => {
        console.log(`  ${i + 1}. [${w.severity}] ${w.subcategory_id}`)
        console.log(`     Description: ${w.description || 'N/A'}`)
      })
    }

    // Check for kidnapping specifically in raw warnings
    console.log('\n' + '─'.repeat(60))
    console.log('\n🔍 Kidnapping Warning Check (Raw + Final):\n')
    
    const rawKidnapping = allRawWarnings.filter(w => 
      w.subcategory_id?.includes('kidnapping') || 
      w.subcategory_id?.includes('confinement')
    )
    
    if (rawKidnapping.length > 0) {
      console.log('⚠️  Found in RAW warnings (before verification):')
      rawKidnapping.forEach(w => {
        console.log(`  - [${w.severity}] ${w.subcategory_id}`)
        console.log(`    Description: ${w.description || 'N/A'}`)
        console.log(`    Evidence: ${w.evidence?.length || 0} span(s)`)
      })
    }
    
    const kidnappingWarnings = result.warnings.filter(w => 
      w.subcategory_id?.includes('kidnapping') || 
      w.subcategory_id?.includes('confinement')
    )

    if (kidnappingWarnings.length > 0) {
      kidnappingWarnings.forEach(w => {
        console.log(`✅ Found: ${w.subcategory_id}`)
        console.log(`   Severity: ${w.severity}`)
        console.log(`   Description: ${w.description || 'N/A'}`)
        console.log(`   Signals:`, w.severity_signals)
        console.log(`   Evidence: ${w.evidence?.length || 0} span(s)`)
        if (w.evidence && w.evidence.length > 0) {
          console.log(`   First Evidence: "${w.evidence[0].excerpt?.substring(0, 100)}..."`)
        }
        console.log('')
      })
    } else {
      console.log('❌ No kidnapping/confinement warning found')
    }

    // Show all warnings with severity
    console.log('\n' + '─'.repeat(60))
    console.log('\n📝 All Warnings:\n')
    
    result.warnings.forEach((w, i) => {
      console.log(`${i + 1}. [${w.severity.toUpperCase()}] ${w.subcategory_id}`)
      console.log(`   Description: ${w.description || 'N/A'}`)
      console.log(`   Signals: frequency=${w.severity_signals.frequency.toFixed(2)}, explicitness=${w.severity_signals.explicitness.toFixed(2)}, proximity=${w.severity_signals.proximity.toFixed(2)}`)
      console.log('')
    })

    // Check for description quality issues
    console.log('\n' + '─'.repeat(60))
    console.log('\n🔍 Description Quality Check:\n')
    
    const issues: string[] = []
    result.warnings.forEach((w, i) => {
      const desc = w.description || ''
      
      // Check for verbatim quotes (looks like dialogue or specific plot)
      if (desc.includes('"') || desc.match(/^[A-Z][a-z]+ (was|is|did|said)/)) {
        issues.push(`Warning ${i + 1} (${w.subcategory_id}): Possible verbatim quote - "${desc.substring(0, 60)}..."`)
      }
    })

    // Check for duplicates
    const descriptions = result.warnings.map(w => w.description?.trim().toLowerCase()).filter(Boolean)
    const duplicates = descriptions.filter((desc, i) => descriptions.indexOf(desc) !== i)
    if (duplicates.length > 0) {
      issues.push(`Found ${duplicates.length} duplicate description(s)`)
    }

    if (issues.length > 0) {
      console.log('⚠️  Potential Issues:')
      issues.forEach(issue => console.log(`  - ${issue}`))
    } else {
      console.log('✅ No obvious description quality issues detected')
    }

    console.log('\n' + '─'.repeat(60))
    console.log('\n✅ Test Complete!\n')

  } catch (error) {
    console.error('\n❌ Error calling API:')
    console.error(error)
    if (error instanceof Error) {
      console.error(`\nMessage: ${error.message}`)
      console.error(`Stack: ${error.stack}`)
    }
    process.exit(1)
  }
}

// Run the test
testAPIResponse().catch(error => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})

