/**
 * Test script to compare different AI models for content warning generation
 * Usage: npx tsx scripts/test-models.ts <isbn> [model1] [model2] ...
 * 
 * Example: npx tsx scripts/test-models.ts 9780593356159 gpt-4o gpt-4o-mini
 */

import { performance } from 'perf_hooks'
import * as fs from 'fs'
import * as path from 'path'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
const RESULTS_FILE = path.join(process.cwd(), 'model-comparison-results.json')

interface ModelTestResult {
  model: string
  isbn: string
  bookTitle?: string
  timestamp: number
  timings: {
    total: number
    aiContentWarningGeneration: number
    webSearch: number
    dbLookup: number
    dbWrites: number
  }
  flags: {
    usedWebSearch: boolean
    pipelinePath: string
  }
  warnings: {
    count: number
    categories: string[]
    severities: string[]
  }
  quality: {
    hasReasoning: boolean
    reasoningLength: number
    confidence: string
  }
  error?: string
}

const DEFAULT_MODELS = ['gpt-4o', 'gpt-4o-mini']

async function testModel(isbn: string, model: string): Promise<ModelTestResult> {
  console.log(`\n🤖 Testing model: ${model}`)
  console.log(`   ISBN: ${isbn}`)
  
  const startTime = performance.now()
  let result: any = null
  let error: string | undefined = undefined

  try {
    const response = await fetch(`${BASE_URL}/api/scan-isbn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        isbn, 
        stream: true, 
        forceRefresh: true,
        model // Pass model to API
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`HTTP ${response.status}: ${errorData.error || 'Unknown error'}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('Response body is not readable')
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.result) {
              result = data.result
              break
            } else if (data.error) {
              throw new Error(data.error)
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
      if (result) break
    }

    const totalTime = performance.now() - startTime
    const serverTimings = result?.timings || {}
    const flags = result?.flags || {}

    // Extract warning details from result (warnings are in the book's content_warnings)
    // For now, we'll need to query them separately or they should be in the result
    const warnings: any[] = [] // Would need to fetch from API or include in result

    const testResult: ModelTestResult = {
      model,
      isbn,
      bookTitle: result?.book?.title,
      timestamp: Date.now(),
      timings: {
        total: serverTimings.total || totalTime,
        aiContentWarningGeneration: serverTimings.aiContentWarningGeneration || 0,
        webSearch: serverTimings.webSearch || 0,
        dbLookup: serverTimings.dbLookup || 0,
        dbWrites: serverTimings.dbWrites || 0,
      },
      flags: {
        usedWebSearch: flags.usedWebSearch || false,
        pipelinePath: flags.pipelinePath || 'unknown'
      },
      warnings: {
        count: 0, // Would need to fetch warnings
        categories: [],
        severities: []
      },
      quality: {
        hasReasoning: false,
        reasoningLength: 0,
        confidence: 'unknown'
      }
    }

    // Display results
    console.log(`   ⏱️  Total Time: ${testResult.timings.total.toFixed(0)}ms`)
    console.log(`   🤖 AI Generation: ${testResult.timings.aiContentWarningGeneration.toFixed(0)}ms`)
    console.log(`   🔍 Web Search: ${testResult.timings.webSearch.toFixed(0)}ms`)
    console.log(`   📋 Pipeline: ${testResult.flags.pipelinePath}`)
    console.log(`   ✅ Success: Yes`)

    return testResult

  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error'
    console.error(`   ❌ Error: ${error}`)
    
    return {
      model,
      isbn,
      timestamp: Date.now(),
      timings: {
        total: performance.now() - startTime,
        aiContentWarningGeneration: 0,
        webSearch: 0,
        dbLookup: 0,
        dbWrites: 0,
      },
      flags: {
        usedWebSearch: false,
        pipelinePath: 'error'
      },
      warnings: {
        count: 0,
        categories: [],
        severities: []
      },
      quality: {
        hasReasoning: false,
        reasoningLength: 0,
        confidence: 'unknown'
      },
      error
    }
  }
}

async function compareModels(isbn: string, models: string[] = DEFAULT_MODELS) {
  console.log(`\n🔬 Model Comparison Test`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`ISBN: ${isbn}`)
  console.log(`Models: ${models.join(', ')}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  const results: ModelTestResult[] = []

  for (const model of models) {
    try {
      const result = await testModel(isbn, model)
      results.push(result)
      
      // Delay between tests to avoid rate limits
      if (model !== models[models.length - 1]) {
        console.log(`   ⏳ Waiting 3 seconds before next test...`)
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    } catch (error) {
      console.error(`Failed to test ${model}:`, error)
    }
  }

  // Compare results
  console.log(`\n\n📊 Comparison Summary`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  
  if (results.length > 0) {
    const baseline = results.find(r => r.model === 'gpt-4o') || results[0]
    
    console.log(`\n⏱️  Speed Comparison (vs ${baseline.model}):`)
    results.forEach(r => {
      if (r.error) {
        console.log(`  ${r.model.padEnd(20)} ❌ FAILED: ${r.error}`)
      } else {
        const speedup = baseline.timings.total > 0 ? 
          ((baseline.timings.total - r.timings.total) / baseline.timings.total * 100).toFixed(1) : '0'
        const faster = r.timings.total < baseline.timings.total ? '✅' : '❌'
        const timeDiff = r.timings.total - baseline.timings.total
        console.log(`  ${r.model.padEnd(20)} ${r.timings.total.toFixed(0).padStart(6)}ms ${faster} ${speedup}% ${r.timings.total < baseline.timings.total ? 'faster' : 'slower'} (${timeDiff > 0 ? '+' : ''}${timeDiff.toFixed(0)}ms)`)
      }
    })

    console.log(`\n🤖 AI Generation Time:`)
    results.forEach(r => {
      if (!r.error) {
        const aiTime = r.timings.aiContentWarningGeneration
        const baselineAiTime = baseline.timings.aiContentWarningGeneration
        const speedup = baselineAiTime > 0 ? 
          ((baselineAiTime - aiTime) / baselineAiTime * 100).toFixed(1) : '0'
        console.log(`  ${r.model.padEnd(20)} ${aiTime.toFixed(0).padStart(6)}ms (${speedup}% ${aiTime < baselineAiTime ? 'faster' : 'slower'})`)
      }
    })

    console.log(`\n📋 Pipeline Path:`)
    results.forEach(r => {
      if (!r.error) {
        console.log(`  ${r.model.padEnd(20)} ${r.flags.pipelinePath}`)
      }
    })

    // Save results
    let allResults: ModelTestResult[] = []
    if (fs.existsSync(RESULTS_FILE)) {
      try {
        allResults = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'))
      } catch (e) {
        // Start fresh
      }
    }
    allResults.push(...results)
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(allResults, null, 2))
    console.log(`\n💾 Results saved to ${RESULTS_FILE}`)
  }

  console.log(`\n✅ Comparison complete!\n`)
}

// Main execution
const args = process.argv.slice(2)
const isbn = args[0] || '9780593356159'
const models = args.slice(1).length > 0 ? args.slice(1) : DEFAULT_MODELS

console.log(`
📝 Model Comparison Test
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This will test different AI models with the same ISBN to compare:
- Speed (total time, AI generation time)
- Reliability (success rate, error handling)
- Pipeline paths

Models available: gpt-4o, gpt-4o-mini, gpt-3.5-turbo

`)

compareModels(isbn, models)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })
