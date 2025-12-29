#!/usr/bin/env tsx

/**
 * Test multi-model service
 * Usage: npx tsx scripts/test-multi-model.ts <ISBN>
 */

import { fetchCandidatesByISBN } from '../lib/book-api'
import { runMultiModelAnalysis } from '../lib/services/multi-model-service'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const isbn = process.argv[2]
if (!isbn) {
  console.error('Usage: npx tsx scripts/test-multi-model.ts <ISBN>')
  process.exit(1)
}

async function test() {
  console.log(`\n🧪 Testing Multi-Model Analysis for ISBN: ${isbn}\n`)
  console.log('='.repeat(60))

  // Fetch book metadata
  console.log('📖 Fetching book metadata...')
  const candidates = await fetchCandidatesByISBN(isbn)
  if (candidates.length === 0) {
    console.error('❌ Book not found')
    process.exit(1)
  }

  const bookData = candidates[0]
  console.log(`✅ Found: "${bookData.title}" by ${bookData.author}\n`)

  // Run multi-model analysis
  console.log('🤖 Running multi-model analysis (GPT-4o + Gemini)...\n')
  const result = await runMultiModelAnalysis(
    isbn,
    bookData.title,
    bookData.author || 'Unknown',
    bookData.description,
    bookData.categories
  )

  // Display results
  console.log('='.repeat(60))
  console.log('📊 MULTI-MODEL RESULTS')
  console.log('='.repeat(60))

  console.log('\n⏱️  Model Timings:')
  result.model_results.forEach(r => {
    console.log(`   ${r.model}: ${r.timing}ms`)
  })

  console.log('\n📈 Combined Warnings:', result.combined_warnings.length)
  console.log(`   Classification: ${result.classification_rating || 'N/A'}`)
  console.log(`   Confidence: ${result.confidence}`)

  console.log('\n🔍 Model Agreement Analysis:')
  console.log(`   Agreement Score: ${Math.round(result.analysis.agreement_score * 100)}%`)
  console.log(`   Unique to GPT-4o: ${result.analysis.unique_to_gpt4o.length} (${result.analysis.unique_to_gpt4o.join(', ') || 'None'})`)
  console.log(`   Unique to Gemini: ${result.analysis.unique_to_gemini.length} (${result.analysis.unique_to_gemini.join(', ') || 'None'})`)

  if (result.analysis.severity_differences.length > 0) {
    console.log('\n📊 Severity Differences:')
    result.analysis.severity_differences.forEach(diff => {
      console.log(`   ${diff.category}: GPT-4o=${diff.gpt4o_score.toFixed(2)}, Gemini=${diff.gemini_score.toFixed(2)}, Diff=${diff.difference.toFixed(2)}`)
    })
  }

  console.log('\n💭 Analysis Insights:')
  console.log(`   ${result.analysis.reasoning_insights}`)

  console.log('\n📋 Combined Warnings:')
  result.combined_warnings.forEach((w, i) => {
    const source = w.source === 'combined' 
      ? `combined (agreement: ${w.model_agreement})`
      : w.source
    console.log(`   ${i + 1}. [${w.category_id}] ${w.description}`)
    console.log(`      Severity: ${w.severity} (score: ${w.score?.toFixed(2) || 'N/A'}) | Source: ${source}`)
    if (w.original_scores) {
      console.log(`      Original scores: ${w.original_scores.map((s: any) => `${s.model}=${s.score.toFixed(2)}`).join(', ')}`)
    }
  })

  console.log('\n📝 Individual Model Results:')
  result.model_results.forEach(modelResult => {
    console.log(`\n   ${modelResult.model.toUpperCase()}:`)
    console.log(`   - Warnings: ${modelResult.content_warnings.length}`)
    console.log(`   - Classification: ${modelResult.classification_rating || 'N/A'}`)
    console.log(`   - Confidence: ${modelResult.confidence}`)
    console.log(`   - Reasoning: ${modelResult.reasoning.substring(0, 150)}...`)
  })

  console.log('\n' + '='.repeat(60))
}

test().catch(console.error)

