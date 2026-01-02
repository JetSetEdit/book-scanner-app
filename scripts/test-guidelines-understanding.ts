#!/usr/bin/env tsx
/**
 * Test Guidelines Understanding
 * 
 * Tests if the AI agent understands the Publications Guidelines impact factors:
 * - Emphasis, Tone, Frequency, Context, Detail, Cumulative effect
 * 
 * Usage: tsx --env-file=.env.local scripts/test-guidelines-understanding.ts
 */

import 'dotenv/config'
import { analyzeBookWithMultiModel } from '../lib/services/multi-model-analysis'

// Test book with clear content that should trigger impact assessment
const testMetadata = {
  title: "Test Book - Guidelines Understanding",
  author: "Test Author",
  isbn: "9780000000000",
  description: `A psychological thriller exploring themes of domestic violence and emotional manipulation. The narrative contains repeated scenes of physical abuse within relationships, described in moderate detail. The content includes strong language throughout, with themes of psychological trauma and control. The story deals with these elements as central themes, not as isolated incidents.`
}

async function testGuidelinesUnderstanding() {
  console.log('\n🧪 Testing AI Understanding of Publications Guidelines\n')
  console.log('─'.repeat(70))
  console.log('\n📚 Test Book:')
  console.log(`   Title: ${testMetadata.title}`)
  console.log(`   Description: ${testMetadata.description.substring(0, 100)}...`)
  console.log('\n' + '─'.repeat(70))
  console.log('\n✅ Expected: AI should reference impact factors in reasoning')
  console.log('   - Emphasis: How prominently featured')
  console.log('   - Tone: Manner of presentation')
  console.log('   - Frequency: How often it appears')
  console.log('   - Context: Setting and justification')
  console.log('   - Detail: Amount of detail')
  console.log('   - Cumulative effect: How elements combine')
  console.log('\n⏳ Running analysis...\n')

  try {
    const result = await analyzeBookWithMultiModel(
      testMetadata,
      (message) => {
        console.log(`  ${message}`)
      }
    )

    console.log('\n' + '─'.repeat(70))
    console.log('\n📊 RESULTS\n')
    console.log(`Total Warnings: ${result.warnings.length}`)
    console.log(`OpenAI Warnings: ${result.model_results.openai.length}`)
    console.log(`Gemini Warnings: ${result.model_results.gemini.length}`)
    console.log(`Agreement Score: ${(result.analysis.agreement_score * 100).toFixed(1)}%`)

    // Check if reasoning includes impact factors
    console.log('\n' + '─'.repeat(70))
    console.log('\n🔍 CHECKING FOR IMPACT FACTOR REFERENCES\n')

    const impactFactors = [
      'emphasis',
      'tone',
      'frequency',
      'context',
      'detail',
      'cumulative',
      'prominently',
      'manner',
      'often',
      'setting',
      'justification',
      'amount',
      'combine',
      'effect'
    ]

    let foundFactors: string[] = []
    let totalReasoningChecks = 0
    let passedChecks = 0

    // Check OpenAI warnings
    console.log('\n📝 OpenAI Warnings Analysis:')
    result.model_results.openai.forEach((warning, idx) => {
      totalReasoningChecks++
      const reasoning = (warning.reasoning || '').toLowerCase()
      const found = impactFactors.filter(factor => reasoning.includes(factor))
      
      if (found.length > 0) {
        foundFactors.push(...found)
        passedChecks++
        console.log(`   ✅ Warning ${idx + 1}: "${warning.subcategory_id}"`)
        console.log(`      Found factors: ${found.join(', ')}`)
        console.log(`      Reasoning excerpt: "${reasoning.substring(0, 100)}..."`)
      } else {
        console.log(`   ⚠️  Warning ${idx + 1}: "${warning.subcategory_id}"`)
        console.log(`      No impact factors found in reasoning`)
        console.log(`      Reasoning: "${reasoning.substring(0, 100)}..."`)
      }
    })

    // Check Gemini warnings
    console.log('\n📝 Gemini Warnings Analysis:')
    result.model_results.gemini.forEach((warning, idx) => {
      totalReasoningChecks++
      const reasoning = (warning.reasoning || '').toLowerCase()
      const found = impactFactors.filter(factor => reasoning.includes(factor))
      
      if (found.length > 0) {
        foundFactors.push(...found)
        passedChecks++
        console.log(`   ✅ Warning ${idx + 1}: "${warning.subcategory_id}"`)
        console.log(`      Found factors: ${found.join(', ')}`)
        console.log(`      Reasoning excerpt: "${reasoning.substring(0, 100)}..."`)
      } else {
        console.log(`   ⚠️  Warning ${idx + 1}: "${warning.subcategory_id}"`)
        console.log(`      No impact factors found in reasoning`)
        console.log(`      Reasoning: "${reasoning.substring(0, 100)}..."`)
      }
    })

    // Summary
    console.log('\n' + '─'.repeat(70))
    console.log('\n📈 SUMMARY\n')
    console.log(`Total Warnings Checked: ${totalReasoningChecks}`)
    console.log(`Warnings with Impact Factors: ${passedChecks}`)
    console.log(`Success Rate: ${((passedChecks / totalReasoningChecks) * 100).toFixed(1)}%`)
    console.log(`\nUnique Factors Found: ${[...new Set(foundFactors)].join(', ')}`)

    if (passedChecks >= totalReasoningChecks * 0.5) {
      console.log('\n✅ PASS: AI appears to understand impact assessment factors')
    } else {
      console.log('\n⚠️  PARTIAL: Some warnings lack explicit impact factor references')
      console.log('   Consider enhancing the prompt to emphasize these factors')
    }

    // Show full warnings for inspection
    console.log('\n' + '─'.repeat(70))
    console.log('\n📋 FULL WARNINGS (for inspection)\n')
    
    console.log('OpenAI Warnings:')
    result.model_results.openai.forEach((warning, idx) => {
      console.log(`\n${idx + 1}. ${warning.subcategory_id}`)
      console.log(`   Description: ${warning.description}`)
      console.log(`   Severity: ${warning.severity}`)
      console.log(`   Reasoning: ${warning.reasoning}`)
    })

    if (result.model_results.gemini.length > 0) {
      console.log('\nGemini Warnings:')
      result.model_results.gemini.forEach((warning, idx) => {
        console.log(`\n${idx + 1}. ${warning.subcategory_id}`)
        console.log(`   Description: ${warning.description}`)
        console.log(`   Severity: ${warning.severity}`)
        console.log(`   Reasoning: ${warning.reasoning}`)
      })
    }

  } catch (error) {
    console.error('\n❌ Error:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
      console.error('   Stack:', error.stack)
    }
    process.exit(1)
  }
}

// Run the test
testGuidelinesUnderstanding().catch(console.error)

