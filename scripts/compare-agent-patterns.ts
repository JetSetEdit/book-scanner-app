/**
 * Compare Agent Patterns: Old vs New API
 * 
 * Tests the same ISBN using:
 * 1. Old pattern: `run(agent, inputText, {})` (current implementation)
 * 2. New pattern: `Runner` + `withTrace()` (modern API)
 * 
 * Compares:
 * - Execution time
 * - Results quality
 * - Error handling
 * - Trace/observability features
 */

import dotenv from 'dotenv'
import { readFileSync } from 'fs'

// Load environment variables
dotenv.config({ path: '.env.local' })
dotenv.config()

// Get ISBN from command line argument or use default
const TEST_ISBN = process.argv[2] || '9780593440872' // Default: "Book Lovers" by Emily Henry

interface ComparisonResult {
  pattern: 'old' | 'new'
  config: string
  warnings: number
  timeMs: number
  reasoning?: string
  error?: string
  status: 'success' | 'failed' | 'partial'
  details?: {
    bookFound?: boolean
    descriptionLength?: number
    confidence?: string
    warnings?: any[]
    hasTrace?: boolean
    traceMetadata?: any
  }
}

/**
 * Test using OLD pattern: run(agent, inputText, {})
 */
async function testOldPattern(instructionMode: 'old' | 'new' | 'hybrid' = 'hybrid'): Promise<ComparisonResult> {
  const startTime = Date.now()
  
  try {
    console.log(`\n[OLD PATTERN] Testing ${instructionMode} mode...`)
    
    const { findBookAndGenerateWarnings } = await import('../lib/content-warning-agent')
    
    const result = await findBookAndGenerateWarnings(TEST_ISBN, 'gpt-4o', instructionMode)
    
    const timeMs = Date.now() - startTime
    
    return {
      pattern: 'old',
      config: `Old Pattern (${instructionMode})`,
      warnings: result.content_warnings.length,
      timeMs,
      status: result.book_found ? 'success' : 'partial',
      reasoning: result.reasoning,
      details: {
        bookFound: result.book_found,
        descriptionLength: result.book_description?.length || 0,
        confidence: result.confidence,
        warnings: result.content_warnings,
        hasTrace: false, // Old pattern doesn't have trace
        fullResult: result, // Include full result for inspection
      }
    }
  } catch (error) {
    return {
      pattern: 'old',
      config: `Old Pattern (${instructionMode})`,
      warnings: 0,
      timeMs: Date.now() - startTime,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Test using NEW pattern: Runner + withTrace()
 * 
 * This is a simplified version - you'd need to complete the migration
 * in content-warning-agent-v2.ts first
 */
async function testNewPattern(instructionMode: 'old' | 'new' | 'hybrid' = 'hybrid'): Promise<ComparisonResult> {
  const startTime = Date.now()
  
  try {
    console.log(`\n[NEW PATTERN] Testing ${instructionMode} mode...`)
    
    // Try to import the new pattern (if it exists)
    try {
      const { findBookAndGenerateWarningsV2 } = await import('../lib/content-warning-agent-v2')
      
      const result = await findBookAndGenerateWarningsV2(TEST_ISBN, 'gpt-4o', instructionMode)
      
      const timeMs = Date.now() - startTime
      
      return {
        pattern: 'new',
        config: `New Pattern (${instructionMode})`,
        warnings: result.content_warnings.length,
        timeMs,
        status: result.book_found ? 'success' : 'partial',
        reasoning: result.reasoning,
        details: {
          bookFound: result.book_found,
          descriptionLength: result.book_description?.length || 0,
          confidence: result.confidence,
          warnings: result.content_warnings,
          hasTrace: !!result.raw_output, // New pattern includes trace
          traceMetadata: result.raw_output?.traceMetadata,
          fullResult: result, // Include full result for inspection
        }
      }
    } catch (importError) {
      // If v2 doesn't exist yet, create a minimal test using Runner directly
      console.log('[NEW PATTERN] v2 not available, testing Runner API directly...')
      
      const agentsModule = await import('@openai/agents')
      const { Agent, Runner, withTrace, tool, setDefaultOpenAIKey } = agentsModule
      const { z } = await import('zod')
      
      // Ensure API key
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY not set')
      }
      setDefaultOpenAIKey(apiKey.trim())
      
      // Simple test agent
      const submitTool = tool({
        name: 'submit_result',
        description: 'Submit the result',
        parameters: z.object({
          book_found: z.boolean(),
          warnings_count: z.number(),
          message: z.string(),
        }),
        execute: async (args) => {
          return "Result submitted."
        },
      })
      
      const agent = new Agent({
        name: "Test Agent",
        instructions: `You are testing the new Runner API pattern. 
        For ISBN ${TEST_ISBN}, determine if the book was found and estimate warning count.
        Call submit_result with your findings.`,
        model: "gpt-4o",
        tools: [submitTool],
      })
      
      let capturedResult: any = null
      
      const result = await withTrace("testNewPattern", async () => {
        // AgentInputItem is an array of conversation items
        const conversationHistory: Array<{ role: string; content: Array<{ type: string; text: string }> }> = [
          { 
            role: "user", 
            content: [{ type: "input_text", text: `Find information about ISBN ${TEST_ISBN}` }] 
          }
        ]
        
        const runner = new Runner({
          traceMetadata: {
            __trace_source__: "pattern-comparison-test",
            instruction_mode: instructionMode,
            isbn: TEST_ISBN,
          }
        })
        
        const runResult = await runner.run(agent, conversationHistory)
        
        // Extract result from tool calls
        // This is simplified - real implementation would parse tool calls
        capturedResult = {
          book_found: true, // Placeholder
          warnings_count: 0, // Placeholder
          message: "Test completed with Runner API"
        }
        
        return runResult
      })
      
      const timeMs = Date.now() - startTime
      
      return {
        pattern: 'new',
        config: `New Pattern (${instructionMode}) - Simplified Test`,
        warnings: capturedResult?.warnings_count || 0,
        timeMs,
        status: 'partial', // Simplified test
        reasoning: capturedResult?.message || 'Simplified Runner API test',
        details: {
          bookFound: capturedResult?.book_found || false,
          hasTrace: true,
          traceMetadata: result?.traceMetadata,
        }
      }
    }
  } catch (error) {
    return {
      pattern: 'new',
      config: `New Pattern (${instructionMode})`,
      warnings: 0,
      timeMs: Date.now() - startTime,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Main comparison function
 */
async function runComparison() {
  console.log('='.repeat(80))
  console.log('AGENT PATTERN COMPARISON TEST')
  console.log('='.repeat(80))
  console.log(`Testing ISBN: ${TEST_ISBN}`)
  console.log(`\nThis will compare:`)
  console.log(`  1. Old Pattern: run(agent, inputText, {})`)
  console.log(`  2. New Pattern: Runner + withTrace()`)
  console.log('='.repeat(80))
  
  const results: ComparisonResult[] = []
  
  // Test each instruction mode
  const modes: Array<'old' | 'new' | 'hybrid'> = ['hybrid'] // Start with hybrid, can add others
  
  for (const mode of modes) {
    console.log(`\n\n📊 Testing ${mode.toUpperCase()} mode...`)
    console.log('-'.repeat(80))
    
    // Test old pattern
    const oldResult = await testOldPattern(mode)
    results.push(oldResult)
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Test new pattern
    const newResult = await testNewPattern(mode)
    results.push(newResult)
    
    // Wait before next mode
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  // Print comparison table
  console.log('\n\n' + '='.repeat(80))
  console.log('COMPARISON RESULTS')
  console.log('='.repeat(80))
  console.log('\n')
  
  // Group by mode
  for (const mode of modes) {
    const modeResults = results.filter(r => r.config.includes(mode))
    const oldResult = modeResults.find(r => r.pattern === 'old')
    const newResult = modeResults.find(r => r.pattern === 'new')
    
    if (!oldResult || !newResult) continue
    
    console.log(`\n${mode.toUpperCase()} MODE:`)
    console.log('-'.repeat(80))
    console.log(`Pattern          │ Status   │ Warnings │ Time (ms) │ Has Trace │ Error`)
    console.log('-'.repeat(80))
    console.log(
      `${oldResult.config.padEnd(15)} │ ${oldResult.status.padEnd(8)} │ ${String(oldResult.warnings).padStart(8)} │ ${String(oldResult.timeMs).padStart(9)} │ ${String(oldResult.details?.hasTrace || false).padEnd(9)} │ ${oldResult.error || 'None'}`
    )
    console.log(
      `${newResult.config.padEnd(15)} │ ${newResult.status.padEnd(8)} │ ${String(newResult.warnings).padStart(8)} │ ${String(newResult.timeMs).padStart(9)} │ ${String(newResult.details?.hasTrace || false).padEnd(9)} │ ${newResult.error || 'None'}`
    )
    
    // Performance comparison
    const timeDiff = newResult.timeMs - oldResult.timeMs
    const timeDiffPercent = ((timeDiff / oldResult.timeMs) * 100).toFixed(1)
    console.log(`\n⏱️  Time Difference: ${timeDiff > 0 ? '+' : ''}${timeDiff}ms (${timeDiffPercent}%)`)
    
    // Warning count comparison
    const warningDiff = newResult.warnings - oldResult.warnings
    console.log(`📊 Warning Count Difference: ${warningDiff > 0 ? '+' : ''}${warningDiff}`)
    
    // Trace availability
    if (newResult.details?.hasTrace && !oldResult.details?.hasTrace) {
      console.log(`✅ New pattern provides trace/observability (old pattern does not)`)
    }
    
    // Status comparison
    if (oldResult.status === 'success' && newResult.status !== 'success') {
      console.log(`⚠️  Old pattern succeeded but new pattern did not`)
    } else if (newResult.status === 'success' && oldResult.status !== 'success') {
      console.log(`✅ New pattern succeeded where old pattern failed`)
    }
  }
  
  // Print detailed results
  console.log('\n' + '='.repeat(80))
  console.log('DETAILED RESULTS')
  console.log('='.repeat(80))
  
  for (const mode of modes) {
    const modeResults = results.filter(r => r.config.includes(mode))
    const oldResult = modeResults.find(r => r.pattern === 'old')
    const newResult = modeResults.find(r => r.pattern === 'new')
    
    if (!oldResult || !newResult) continue
    
    console.log(`\n${mode.toUpperCase()} MODE - OLD PATTERN:`)
    console.log('-'.repeat(80))
    if (oldResult.details?.fullResult) {
      const r = oldResult.details.fullResult
      console.log(`Book Found: ${r.book_found}`)
      console.log(`Title: ${r.book_title || 'N/A'}`)
      console.log(`Author: ${r.book_author || 'N/A'}`)
      console.log(`Description Length: ${r.book_description?.length || 0} chars`)
      console.log(`Description Preview: ${(r.book_description || '').substring(0, 200)}...`)
      console.log(`Categories: ${r.book_categories?.join(', ') || 'N/A'}`)
      console.log(`Confidence: ${r.confidence}`)
      console.log(`Reasoning: ${r.reasoning}`)
      console.log(`Warnings Count: ${r.content_warnings.length}`)
      if (r.content_warnings.length > 0) {
        console.log(`\nWarnings:`)
        r.content_warnings.forEach((w, i) => {
          console.log(`  ${i+1}. ${w.category_id}${w.subcategory_id ? '.' + w.subcategory_id : ''} (${w.severity})`)
          console.log(`     Score: ${w.score.toFixed(2)}`)
          console.log(`     Description: ${w.description}`)
          console.log(`     Reasoning: ${w.reasoning}`)
        })
      }
      if (r.raw_output) {
        console.log(`\nRaw Output Keys: ${Object.keys(r.raw_output).join(', ')}`)
      }
    }
    
    console.log(`\n${mode.toUpperCase()} MODE - NEW PATTERN:`)
    console.log('-'.repeat(80))
    if (newResult.details?.fullResult) {
      const r = newResult.details.fullResult
      console.log(`Book Found: ${r.book_found}`)
      console.log(`Title: ${r.book_title || 'N/A'}`)
      console.log(`Author: ${r.book_author || 'N/A'}`)
      console.log(`Description Length: ${r.book_description?.length || 0} chars`)
      console.log(`Description Preview: ${(r.book_description || '').substring(0, 200)}...`)
      console.log(`Categories: ${r.book_categories?.join(', ') || 'N/A'}`)
      console.log(`Confidence: ${r.confidence}`)
      console.log(`Reasoning: ${r.reasoning}`)
      console.log(`Warnings Count: ${r.content_warnings.length}`)
      if (r.content_warnings.length > 0) {
        console.log(`\nWarnings:`)
        r.content_warnings.forEach((w, i) => {
          console.log(`  ${i+1}. ${w.category_id}${w.subcategory_id ? '.' + w.subcategory_id : ''} (${w.severity})`)
          console.log(`     Score: ${w.score.toFixed(2)}`)
          console.log(`     Description: ${w.description}`)
          console.log(`     Reasoning: ${w.reasoning}`)
        })
      }
      if (r.raw_output) {
        console.log(`\nRaw Output Type: ${typeof r.raw_output}`)
        if (typeof r.raw_output === 'object') {
          console.log(`Raw Output Keys: ${Object.keys(r.raw_output).join(', ')}`)
          if (r.raw_output.finalOutput) {
            console.log(`Final Output: ${typeof r.raw_output.finalOutput}`)
            if (typeof r.raw_output.finalOutput === 'string') {
              console.log(`Final Output Preview: ${r.raw_output.finalOutput.substring(0, 200)}...`)
            }
          }
        }
      }
    }
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('SUMMARY')
  console.log('='.repeat(80))
  
  const oldResults = results.filter(r => r.pattern === 'old')
  const newResults = results.filter(r => r.pattern === 'new')
  
  const oldAvgTime = oldResults.reduce((sum, r) => sum + r.timeMs, 0) / oldResults.length
  const newAvgTime = newResults.reduce((sum, r) => sum + r.timeMs, 0) / newResults.length
  
  const oldSuccessCount = oldResults.filter(r => r.status === 'success').length
  const newSuccessCount = newResults.filter(r => r.status === 'success').length
  
  console.log(`\nOld Pattern:`)
  console.log(`  - Average Time: ${oldAvgTime.toFixed(0)}ms`)
  console.log(`  - Success Rate: ${oldSuccessCount}/${oldResults.length}`)
  console.log(`  - Has Trace: No`)
  
  console.log(`\nNew Pattern:`)
  console.log(`  - Average Time: ${newAvgTime.toFixed(0)}ms`)
  console.log(`  - Success Rate: ${newSuccessCount}/${newResults.length}`)
  console.log(`  - Has Trace: Yes`)
  
  console.log(`\n💡 Recommendation:`)
  if (newAvgTime < oldAvgTime && newSuccessCount >= oldSuccessCount) {
    console.log(`   ✅ New pattern is faster and equally/more reliable - consider migrating`)
  } else if (newSuccessCount > oldSuccessCount) {
    console.log(`   ✅ New pattern is more reliable - consider migrating`)
  } else if (newAvgTime > oldAvgTime * 1.2) {
    console.log(`   ⚠️  New pattern is significantly slower - investigate before migrating`)
  } else {
    console.log(`   ℹ️  Patterns are similar - new pattern offers better observability (traces)`)
  }
  
  console.log('\n')
}

// Run the comparison
runComparison().catch(console.error)

