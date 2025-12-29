/**
 * Quick validation test - smaller subset to verify everything works
 * Tests 2 ISBNs × 2 models × 2 agent modes = 8 total tests
 * 
 * Usage: npx tsx scripts/batch-test-models-quick.ts
 */

import { performance } from 'perf_hooks'
import * as fs from 'fs'
import * as path from 'path'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
const RESULTS_FILE = path.join(process.cwd(), 'batch-model-test-results-quick.json')

// Quick test - smaller subset
const TEST_ISBNS = [
  '9781649377159',  // First ISBN
  '9780385548984'   // Last ISBN
]

// Test with 2 models first
const MODELS = [
  'gpt-4o',         // Current production
  'gpt-4o-mini'     // Cheaper alternative
]

// Test 2 agent modes
const AGENT_MODES = [
  { name: 'hybrid', agentType: 'hybrid' },      // Current production
  { name: 'old', agentType: 'assumption-based' } // For comparison
]

// OpenAI pricing (per million tokens)
const PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 5.00, output: 15.00 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'gpt-4o-mini': { input: 2.50, output: 10.00 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 }
}

interface TestResult {
  isbn: string
  model: string
  agentMode: string
  timestamp: number
  timings: {
    total: number
    apiCall: number
  }
  quality: {
    bookFound: boolean
    bookTitle?: string
    warningCount: number
    severeCount: number
    moderateCount: number
    mildCount: number
    confidence: 'low' | 'medium' | 'high'
    reasoningLength: number
    hasReasoning: boolean
  }
  cost: {
    estimatedInputTokens: number
    estimatedOutputTokens: number
    estimatedCostUSD: number
  }
  error?: string
  rawResult?: any
}

async function testCombination(
  isbn: string,
  model: string,
  agentMode: { name: string; agentType: string }
): Promise<TestResult> {
  const startTime = performance.now()
  
  try {
    console.log(`  📡 Calling API: ${model} + ${agentMode.name}...`)
    
    const response = await fetch(`${BASE_URL}/api/dev/scan-with-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isbn,
        agentType: agentMode.agentType,
        model
      })
    })

    const apiCallTime = performance.now() - startTime

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`HTTP ${response.status}: ${errorData.error || 'Unknown error'}`)
    }

    const data = await response.json()
    const totalTime = performance.now() - startTime

    // Extract quality metrics
    const warnings = data.warnings || []
    const severeCount = warnings.filter((w: any) => w.severity === 'severe').length
    const moderateCount = warnings.filter((w: any) => w.severity === 'moderate').length
    const mildCount = warnings.filter((w: any) => w.severity === 'mild').length

    // Estimate token usage
    const reasoningLength = data.reasoning?.length || 0
    const estimatedInputTokens = Math.ceil((reasoningLength + 2000) / 4)
    const estimatedOutputTokens = Math.ceil((reasoningLength + warnings.length * 100) / 4)

    // Calculate cost
    const pricing = PRICING[model] || PRICING['gpt-4o']
    const inputCost = (estimatedInputTokens / 1_000_000) * pricing.input
    const outputCost = (estimatedOutputTokens / 1_000_000) * pricing.output
    const totalCost = inputCost + outputCost

    return {
      isbn,
      model,
      agentMode: agentMode.name,
      timestamp: Date.now(),
      timings: {
        total: totalTime,
        apiCall: apiCallTime
      },
      quality: {
        bookFound: data.success || false,
        bookTitle: data.book?.title,
        warningCount: warnings.length,
        severeCount,
        moderateCount,
        mildCount,
        confidence: data.confidence || 'medium',
        reasoningLength,
        hasReasoning: !!data.reasoning && data.reasoning.length > 0
      },
      cost: {
        estimatedInputTokens,
        estimatedOutputTokens,
        estimatedCostUSD: totalCost
      },
      rawResult: data
    }
  } catch (error) {
    return {
      isbn,
      model,
      agentMode: agentMode.name,
      timestamp: Date.now(),
      timings: {
        total: performance.now() - startTime,
        apiCall: 0
      },
      quality: {
        bookFound: false,
        warningCount: 0,
        severeCount: 0,
        moderateCount: 0,
        mildCount: 0,
        confidence: 'low',
        reasoningLength: 0,
        hasReasoning: false
      },
      cost: {
        estimatedInputTokens: 0,
        estimatedOutputTokens: 0,
        estimatedCostUSD: 0
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function runQuickTest() {
  console.log('\n🧪 Quick Validation Test')
  console.log('='.repeat(80))
  console.log(`Testing ${TEST_ISBNS.length} ISBNs × ${MODELS.length} models × ${AGENT_MODES.length} agent modes`)
  console.log(`Total combinations: ${TEST_ISBNS.length * MODELS.length * AGENT_MODES.length}`)
  console.log('='.repeat(80))

  const allResults: TestResult[] = []
  let completed = 0
  const total = TEST_ISBNS.length * MODELS.length * AGENT_MODES.length

  for (const isbn of TEST_ISBNS) {
    for (const model of MODELS) {
      for (const agentMode of AGENT_MODES) {
        completed++
        console.log(`\n[${completed}/${total}] Testing: ${isbn} | ${model} | ${agentMode.name}`)
        
        const result = await testCombination(isbn, model, agentMode)
        allResults.push(result)

        if (result.error) {
          console.log(`  ❌ Error: ${result.error}`)
        } else {
          console.log(`  ✅ Success`)
          console.log(`     Time: ${(result.timings.total / 1000).toFixed(1)}s`)
          console.log(`     Warnings: ${result.quality.warningCount} (${result.quality.severeCount} severe, ${result.quality.moderateCount} moderate, ${result.quality.mildCount} mild)`)
          console.log(`     Confidence: ${result.quality.confidence}`)
          console.log(`     Cost: $${result.cost.estimatedCostUSD.toFixed(6)}`)
          if (result.quality.bookTitle) {
            console.log(`     Book: ${result.quality.bookTitle}`)
          }
        }

        // Delay to avoid rate limits (3 seconds between requests)
        if (completed < total) {
          console.log(`  ⏳ Waiting 3 seconds before next test...`)
          await new Promise(resolve => setTimeout(resolve, 3000))
        }
      }
    }
  }

  // Save results
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(allResults, null, 2))
  console.log(`\n💾 Results saved to ${RESULTS_FILE}`)

  // Generate summary
  generateSummary(allResults)
}

function generateSummary(results: TestResult[]) {
  console.log('\n\n📊 QUICK TEST SUMMARY')
  console.log('='.repeat(80))

  const successful = results.filter(r => !r.error)
  const failed = results.filter(r => r.error)

  console.log(`\n✅ Successful: ${successful.length}/${results.length}`)
  console.log(`❌ Failed: ${failed.length}/${results.length}`)

  if (failed.length > 0) {
    console.log('\n❌ Errors:')
    failed.forEach(r => {
      console.log(`  - ${r.model} + ${r.agentMode} (ISBN: ${r.isbn}): ${r.error}`)
    })
  }

  if (successful.length > 0) {
    console.log('\n📈 Averages (Successful Tests):')
    
    // Group by model
    const byModel: Record<string, TestResult[]> = {}
    successful.forEach(r => {
      if (!byModel[r.model]) byModel[r.model] = []
      byModel[r.model].push(r)
    })

    for (const [model, modelResults] of Object.entries(byModel)) {
      const avgTime = modelResults.reduce((sum, r) => sum + r.timings.total, 0) / modelResults.length
      const avgWarnings = modelResults.reduce((sum, r) => sum + r.quality.warningCount, 0) / modelResults.length
      const avgCost = modelResults.reduce((sum, r) => sum + r.cost.estimatedCostUSD, 0) / modelResults.length
      
      console.log(`\n  ${model}:`)
      console.log(`    Avg Time: ${(avgTime / 1000).toFixed(1)}s`)
      console.log(`    Avg Warnings: ${avgWarnings.toFixed(1)}`)
      console.log(`    Avg Cost: $${avgCost.toFixed(6)}`)
    }

    // Group by agent mode
    const byAgent: Record<string, TestResult[]> = {}
    successful.forEach(r => {
      if (!byAgent[r.agentMode]) byAgent[r.agentMode] = []
      byAgent[r.agentMode].push(r)
    })

    console.log('\n📋 By Agent Mode:')
    for (const [agentMode, agentResults] of Object.entries(byAgent)) {
      const avgTime = agentResults.reduce((sum, r) => sum + r.timings.total, 0) / agentResults.length
      const avgWarnings = agentResults.reduce((sum, r) => sum + r.quality.warningCount, 0) / agentResults.length
      
      console.log(`\n  ${agentMode}:`)
      console.log(`    Avg Time: ${(avgTime / 1000).toFixed(1)}s`)
      console.log(`    Avg Warnings: ${avgWarnings.toFixed(1)}`)
    }
  }

  console.log('\n✅ Quick test complete!')
  console.log('If this looks good, you can run the full batch test: npx tsx scripts/batch-test-models.ts')
}

// Run the test
runQuickTest()
  .then(() => {
    console.log('\n✅ Quick validation test complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Quick test failed:', error)
    process.exit(1)
  })

