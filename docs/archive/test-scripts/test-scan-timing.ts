/**
 * Test script to measure scan timing
 * Usage: 
 *   Single: npx tsx scripts/test-scan-timing.ts <isbn>
 *   Batch:  npx tsx scripts/test-scan-timing.ts --batch <isbn1> <isbn2> ...
 */

import { performance } from 'perf_hooks'
import * as fs from 'fs'
import * as path from 'path'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
const RESULTS_FILE = path.join(process.cwd(), 'pipeline-test-results.json')

interface TestResult {
  isbn: string
  bookTitle?: string
  timestamp: number
  timings: {
    dbLookup: number
    externalMetadataFetch: number
    webSearch: number
    imageValidation: number
    aiContentWarningGeneration: number
    dbWrites: number
    total: number
  }
  flags: {
    usedWebSearch: boolean
    isThinMetadata: boolean
    pipelinePath: string
  }
  clientTimings: {
    apiResponse: number
    streamStart: number
    resultReceived: number
    total: number
  }
}

async function testScanTiming(isbn: string, saveToFile: boolean = false): Promise<TestResult> {
  console.log(`\n🔍 Testing scan timing for ISBN: ${isbn}`)
  console.log(`📍 Base URL: ${BASE_URL}\n`)

  const clientTimings: Record<string, number> = {}
  const startTime = performance.now()

  try {
    // Stage 1: Initiate scan
    clientTimings['scan-initiated'] = performance.now() - startTime

    // Stage 2: Send API request
    const requestStart = performance.now()
    const forceRefresh = process.argv.includes('--force-refresh') || process.argv.includes('-f')
    const response = await fetch(`${BASE_URL}/api/scan-isbn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isbn, stream: true, forceRefresh }),
    })
    clientTimings['api-response-received'] = performance.now() - requestStart

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    // Stage 3: Start streaming
    const streamStart = performance.now()
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('Response body is not readable')
    }

    clientTimings['stream-started'] = performance.now() - streamStart

    // Stage 4: Read stream
    const readStart = performance.now()
    let result: any = null
    let lastStatus = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))

            if (data.status) {
              lastStatus = data.status
              console.log(`  📢 Status: ${data.status}`)
            } else if (data.result) {
              result = data.result
              clientTimings['result-received'] = performance.now() - readStart
              break
            } else if (data.error) {
              throw new Error(data.error)
            }
          } catch (parseError) {
            // Ignore parse errors for now
          }
        }
      }

      if (result) break
    }

    clientTimings['stream-completed'] = performance.now() - readStart
    clientTimings['total'] = performance.now() - startTime

    // Extract server-side timings from result
    const serverTimings = result?.timings || {}
    const flags = result?.flags || {
      usedWebSearch: false,
      isThinMetadata: false,
      pipelinePath: 'unknown'
    }

    // Log detailed timings
    console.log(`\n📊 Server-Side Timing Breakdown:`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    if (serverTimings.total) {
      Object.entries(serverTimings).forEach(([stage, duration]) => {
        if (stage !== 'total') {
          const percentage = ((duration as number / serverTimings.total) * 100).toFixed(1)
          const bar = '█'.repeat(Math.floor((duration as number / serverTimings.total) * 50))
          console.log(`  ${stage.padEnd(30)} ${(duration as number).toFixed(0).padStart(6)}ms (${percentage.padStart(5)}%) ${bar}`)
        }
      })
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`  ${'TOTAL (Server)'.padEnd(30)} ${serverTimings.total.toFixed(0).padStart(6)}ms (100.0%)\n`)
    } else {
      console.log(`  ⚠️  No server-side timings available\n`)
    }

    // Log flags
    console.log(`📋 Pipeline Flags:`)
    console.log(`  Used Web Search: ${flags.usedWebSearch ? '✅ Yes' : '❌ No'}`)
    console.log(`  Thin Metadata: ${flags.isThinMetadata ? '⚠️  Yes' : '✅ No'}`)
    console.log(`  Pipeline Path: ${flags.pipelinePath}`)

    // Log client-side timings
    console.log(`\n📊 Client-Side Timing:`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    Object.entries(clientTimings).forEach(([stage, duration]) => {
      const percentage = ((duration / clientTimings.total) * 100).toFixed(1)
      const bar = '█'.repeat(Math.floor((duration / clientTimings.total) * 50))
      console.log(`  ${stage.padEnd(25)} ${duration.toFixed(0).padStart(6)}ms (${percentage.padStart(5)}%) ${bar}`)
    })
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`  ${'TOTAL (Client)'.padEnd(25)} ${clientTimings.total.toFixed(0).padStart(6)}ms (100.0%)\n`)

    if (result?.book) {
      const bookUrl = `${BASE_URL}/book/${result.book.isbn}`
      console.log(`✅ Book found: ${result.book.title}`)
      console.log(`📖 Book URL: ${bookUrl}\n`)
    }

    // Prepare result for saving
    const testResult: TestResult = {
      isbn,
      bookTitle: result?.book?.title,
      timestamp: Date.now(),
      timings: {
        dbLookup: serverTimings.dbLookup || 0,
        externalMetadataFetch: serverTimings.externalMetadataFetch || 0,
        webSearch: serverTimings.webSearch || 0,
        imageValidation: serverTimings.imageValidation || 0,
        aiContentWarningGeneration: serverTimings.aiContentWarningGeneration || 0,
        dbWrites: serverTimings.dbWrites || 0,
        total: serverTimings.total || clientTimings.total
      },
      flags: {
        usedWebSearch: flags.usedWebSearch || false,
        isThinMetadata: flags.isThinMetadata || false,
        pipelinePath: flags.pipelinePath || 'unknown'
      },
      clientTimings: {
        apiResponse: clientTimings['api-response-received'] || 0,
        streamStart: clientTimings['stream-started'] || 0,
        resultReceived: clientTimings['result-received'] || 0,
        total: clientTimings.total || 0
      }
    }

    // Save to file if requested
    if (saveToFile) {
      let results: TestResult[] = []
      if (fs.existsSync(RESULTS_FILE)) {
        try {
          results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'))
        } catch (e) {
          console.warn('⚠️  Could not read existing results file, starting fresh')
        }
      }
      results.push(testResult)
      fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2))
      console.log(`💾 Result saved to ${RESULTS_FILE}`)
    }

    return testResult

  } catch (error) {
    const totalTime = performance.now() - startTime
    console.error(`\n❌ Error after ${totalTime.toFixed(0)}ms:`)
    console.error(error)
    throw error
  }
}

function calculateStats(results: TestResult[]) {
  const stages = ['dbLookup', 'externalMetadataFetch', 'webSearch', 'imageValidation', 'aiContentWarningGeneration', 'dbWrites', 'total'] as const
  
  const stats: Record<string, { median: number; p95: number }> = {}
  
  stages.forEach(stage => {
    const values = results.map(r => r.timings[stage]).sort((a, b) => a - b)
    const median = values[Math.floor(values.length / 2)]
    const p95Index = Math.floor(values.length * 0.95)
    const p95 = values[p95Index] || values[values.length - 1]
    
    stats[stage] = { median, p95 }
  })
  
  const webSearchCount = results.filter(r => r.flags.usedWebSearch).length
  const webSearchPercent = (webSearchCount / results.length) * 100
  
  return { stats, webSearchCount, webSearchPercent }
}

async function runBatch(isbns: string[]) {
  console.log(`\n🚀 Running batch test with ${isbns.length} ISBNs\n`)
  
  const results: TestResult[] = []
  
  for (let i = 0; i < isbns.length; i++) {
    const isbn = isbns[i]
    console.log(`\n[${i + 1}/${isbns.length}] Processing ISBN: ${isbn}`)
    console.log('='.repeat(60))
    
    try {
      const result = await testScanTiming(isbn, true)
      results.push(result)
    } catch (error) {
      console.error(`❌ Failed to process ${isbn}:`, error)
    }
    
    // Small delay between requests
    if (i < isbns.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  // Calculate and display summary statistics
  console.log(`\n\n📈 Batch Test Summary`)
  console.log('='.repeat(60))
  console.log(`Total Tests: ${results.length}`)
  console.log(`Web Search Used: ${results.filter(r => r.flags.usedWebSearch).length} (${((results.filter(r => r.flags.usedWebSearch).length / results.length) * 100).toFixed(1)}%)`)
  console.log(`Thin Metadata: ${results.filter(r => r.flags.isThinMetadata).length} (${((results.filter(r => r.flags.isThinMetadata).length / results.length) * 100).toFixed(1)}%)`)
  
  const { stats, webSearchCount, webSearchPercent } = calculateStats(results)
  
  console.log(`\n📊 Timing Statistics (median / p95):`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  Object.entries(stats).forEach(([stage, { median, p95 }]) => {
    console.log(`  ${stage.padEnd(30)} ${median.toFixed(0).padStart(6)}ms / ${p95.toFixed(0).padStart(6)}ms`)
  })
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  
  console.log(`\n📋 Pipeline Path Distribution:`)
  const pathCounts: Record<string, number> = {}
  results.forEach(r => {
    pathCounts[r.flags.pipelinePath] = (pathCounts[r.flags.pipelinePath] || 0) + 1
  })
  Object.entries(pathCounts).forEach(([path, count]) => {
    console.log(`  ${path.padEnd(40)} ${count} (${((count / results.length) * 100).toFixed(1)}%)`)
  })
  
  console.log(`\n✅ Batch test completed. Results saved to ${RESULTS_FILE}\n`)
}

// Main execution
const args = process.argv.slice(2)

if (args[0] === '--batch' || args[0] === '-b') {
  const isbns = args.slice(1)
  if (isbns.length === 0) {
    console.error('❌ Error: Please provide at least one ISBN for batch mode')
    console.error('Usage: npx tsx scripts/test-scan-timing.ts --batch <isbn1> <isbn2> ...')
    process.exit(1)
  }
  runBatch(isbns)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Batch test failed:', error)
      process.exit(1)
    })
} else {
  const isbn = args[0] || '9781405293181'
  testScanTiming(isbn, false)
    .then(() => {
      console.log('✅ Test completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Test failed:', error)
      process.exit(1)
    })
}
