#!/usr/bin/env tsx
/**
 * Test all available GPT-5 models on a book and compare results
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const TEST_BOOK_ISBN = '9780571334650' // Normal People

const GPT5_MODELS = [
  'gpt-5',
  'gpt-5-2025-08-07',
  'gpt-5-mini',
  'gpt-5-mini-2025-08-07',
  'gpt-5-nano',
  'gpt-5-nano-2025-08-07',
  'gpt-5-pro',
  'gpt-5-pro-2025-10-06',
  'gpt-5.1',
  'gpt-5.1-2025-11-13',
  'gpt-5.2',
  'gpt-5.2-2025-12-11',
  'gpt-5.2-pro',
  'gpt-5.2-pro-2025-12-11',
]

interface TestResult {
  model: string
  success: boolean
  error?: string
  warnings?: number
  rating?: string
  maxImpact?: number
  topWarning?: string
  latency?: number
}

async function testModel(model: string): Promise<TestResult> {
  console.log(`\n🧪 Testing: ${model}`)
  console.log('─'.repeat(60))
  
  const startTime = Date.now()
  
  try {
    const { processIsbnScan } = await import('../lib/services/scan-service')
    
    const result = await processIsbnScan(
      TEST_BOOK_ISBN,
      (msg) => {
        // Suppress most progress messages, only show key ones
        const msgStr = typeof msg === 'string' ? msg : String(msg)
        if (msgStr.includes('Analyzing') || msgStr.includes('Complete') || msgStr.includes('Error')) {
          process.stdout.write(`   ${msgStr}\n`)
        }
      },
      undefined, // selectedCandidate
      true, // forceRefresh
      model // model
    )
    
    const latency = Date.now() - startTime
    
    if (!result.book) {
      return {
        model,
        success: false,
        error: 'No book returned',
        latency
      }
    }
    
    // Get warnings and rating from database
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data: warnings } = await supabase
      .from('content_warnings')
      .select('*')
      .eq('book_id', result.book.id)
      .order('created_at', { ascending: false })
      .limit(20)
    
    const { data: bookData } = await supabase
      .from('books')
      .select('age_rating, age_recommendation, age_rating_reasoning')
      .eq('id', result.book.id)
      .single()
    
    // Calculate max impact (simplified - just get from rating reasoning if available)
    let maxImpact: number | undefined
    let topWarning: string | undefined
    
    if (bookData?.age_rating_reasoning) {
      const impactMatch = bookData.age_rating_reasoning.match(/impact score: ([\d.]+)/i)
      if (impactMatch) {
        maxImpact = parseFloat(impactMatch[1])
      }
    }
    
    if (warnings && warnings.length > 0) {
      // Get top warning by severity
      const sortedWarnings = warnings.sort((a, b) => {
        const severityOrder = { severe: 3, moderate: 2, mild: 1 }
        return (severityOrder[b.severity as keyof typeof severityOrder] || 0) - 
               (severityOrder[a.severity as keyof typeof severityOrder] || 0)
      })
      topWarning = sortedWarnings[0]?.subcategory_id || undefined
    }
    
    return {
      model,
      success: true,
      warnings: warnings?.length || 0,
      rating: bookData?.age_rating || 'N/A',
      maxImpact,
      topWarning,
      latency
    }
    
  } catch (error) {
    const latency = Date.now() - startTime
    return {
      model,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      latency
    }
  }
}

async function main() {
  console.log('🚀 Testing All GPT-5 Models')
  console.log('='.repeat(60))
  console.log(`📖 Test Book: Normal People (${TEST_BOOK_ISBN})`)
  console.log(`📊 Testing ${GPT5_MODELS.length} models\n`)
  
  const results: TestResult[] = []
  
  for (const model of GPT5_MODELS) {
    const result = await testModel(model)
    results.push(result)
    
    if (result.success) {
      console.log(`   ✅ Success: ${result.warnings} warnings, Rating: ${result.rating}, Latency: ${result.latency}ms`)
      if (result.topWarning) {
        console.log(`   📌 Top Warning: ${result.topWarning}`)
      }
    } else {
      console.log(`   ❌ Failed: ${result.error}`)
    }
    
    // Small delay between tests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 SUMMARY')
  console.log('='.repeat(60))
  
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  
  console.log(`\n✅ Successful: ${successful.length}/${GPT5_MODELS.length}`)
  console.log(`❌ Failed: ${failed.length}/${GPT5_MODELS.length}`)
  
  if (successful.length > 0) {
    console.log('\n📈 Results by Model:')
    console.log('─'.repeat(60))
    console.log('Model'.padEnd(30) + 'Warnings'.padEnd(10) + 'Rating'.padEnd(10) + 'Latency')
    console.log('─'.repeat(60))
    
    successful.forEach(r => {
      const warnings = (r.warnings || 0).toString().padEnd(10)
      const rating = (r.rating || 'N/A').padEnd(10)
      const latency = `${r.latency}ms`
      console.log(`${r.model.padEnd(30)}${warnings}${rating}${latency}`)
    })
    
    // Group by rating
    const ratingGroups = successful.reduce((acc, r) => {
      const rating = r.rating || 'N/A'
      if (!acc[rating]) acc[rating] = []
      acc[rating].push(r.model)
      return acc
    }, {} as Record<string, string[]>)
    
    console.log('\n📊 Ratings Distribution:')
    Object.entries(ratingGroups).forEach(([rating, models]) => {
      console.log(`   ${rating}: ${models.length} model(s)`)
      models.forEach(m => console.log(`      - ${m}`))
    })
    
    // Compare warnings count
    const warningCounts = successful.map(r => r.warnings || 0)
    const avgWarnings = warningCounts.reduce((a, b) => a + b, 0) / warningCounts.length
    const minWarnings = Math.min(...warningCounts)
    const maxWarnings = Math.max(...warningCounts)
    
    console.log(`\n📊 Warnings Statistics:`)
    console.log(`   Average: ${avgWarnings.toFixed(1)}`)
    console.log(`   Range: ${minWarnings} - ${maxWarnings}`)
    
    // Latency comparison
    const latencies = successful.map(r => r.latency || 0)
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length
    const minLatency = Math.min(...latencies)
    const maxLatency = Math.max(...latencies)
    
    console.log(`\n⏱️  Latency Statistics:`)
    console.log(`   Average: ${avgLatency.toFixed(0)}ms`)
    console.log(`   Range: ${minLatency}ms - ${maxLatency}ms`)
    
    // Fastest and slowest
    const fastest = successful.reduce((prev, curr) => 
      (curr.latency || 0) < (prev.latency || 0) ? curr : prev
    )
    const slowest = successful.reduce((prev, curr) => 
      (curr.latency || 0) > (prev.latency || 0) ? curr : prev
    )
    
    console.log(`\n⚡ Performance:`)
    console.log(`   Fastest: ${fastest.model} (${fastest.latency}ms)`)
    console.log(`   Slowest: ${slowest.model} (${slowest.latency}ms)`)
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Models:')
    failed.forEach(r => {
      console.log(`   ${r.model}: ${r.error}`)
    })
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Test Complete')
  console.log('='.repeat(60))
}

main().catch(console.error)

