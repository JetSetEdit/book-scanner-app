/**
 * Test Different Agent Configurations
 * 
 * Tests one ISBN through various agent instruction modes:
 * - Old (assumption-based)
 * - New (evidence-based)
 * - Hybrid (evidence-first, then inference)
 * - Current system (multi-model-analysis.ts)
 * 
 * Records timing for each configuration.
 * 
 * NOTE: Old agent configurations require @openai/agents package.
 * This script will test the current system and attempt to test old configs
 * if the package is available.
 */

import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables
dotenv.config({ path: '.env.local' })
dotenv.config()

const TEST_ISBN = '9780593440872' // "Book Lovers" by Emily Henry - good test case

interface TestResult {
  config: string
  warnings: number
  timeMs: number
  reasoning?: string
  error?: string
}

async function testCurrentSystem(): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    // Import the current multi-model analysis
    const { analyzeBookWithMultiModel } = await import('../lib/services/multi-model-analysis')
    
    // Fetch book metadata first
    const { fetchCandidatesByISBN } = await import('../lib/book-api')
    console.log(`[Current] Fetching book metadata for ISBN: ${TEST_ISBN}...`)
    const candidates = await fetchCandidatesByISBN(TEST_ISBN)
    
    if (!candidates || candidates.length === 0) {
      return {
        config: 'Current System (multi-model-analysis.ts)',
        warnings: 0,
        timeMs: Date.now() - startTime,
        error: 'Book not found via ISBN lookup'
      }
    }
    
    const bestCandidate = candidates[0]
    console.log(`[Current] Found: "${bestCandidate.title}" by ${bestCandidate.author || 'Unknown'}`)
    console.log(`[Current] Description length: ${bestCandidate.description?.length || 0} chars`)
    
    const metadata = {
      title: bestCandidate.title,
      author: bestCandidate.author || 'Unknown',
      description: bestCandidate.description || '',
      isbn: TEST_ISBN
    }
    
    console.log(`[Current] Starting AI analysis...`)
    const result = await analyzeBookWithMultiModel(metadata, (msg) => {
      // Only log key progress messages
      if (msg.includes('Starting') || msg.includes('Analyzing') || msg.includes('Processing')) {
        console.log(`[Current] ${msg}`)
      }
    })
    
    const timeMs = Date.now() - startTime
    
    return {
      config: 'Current System (multi-model-analysis.ts)',
      warnings: result.warnings.length,
      timeMs,
      reasoning: result.noWarningsReasoning || (result.warnings.length > 0 
        ? `Generated ${result.warnings.length} warnings` 
        : 'No warnings generated')
    }
  } catch (error) {
    return {
      config: 'Current System (multi-model-analysis.ts)',
      warnings: 0,
      timeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function testOldAgentConfig(): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    // Check if @openai/agents is available
    let agentsModule
    try {
      agentsModule = await import('@openai/agents')
    } catch {
      return {
        config: 'Old Agent (Assumption-Based)',
        warnings: 0,
        timeMs: Date.now() - startTime,
        error: '@openai/agents package not installed'
      }
    }
    
    // Try to load the backup agent code
    // Note: This is complex because the agent code has dependencies
    // For a real test, we'd need to restore the full agent file
    
    console.log('[Old Agent] Attempting to use assumption-based instructions...')
    console.log('[Old Agent] This would make assumptions based on genre, author reputation, etc.')
    
    // Since we can't easily restore the agent, we'll note what it would do
    const timeMs = Date.now() - startTime
    
    return {
      config: 'Old Agent (Assumption-Based)',
      warnings: 0,
      timeMs,
      error: 'Agent code restoration needed - backup file requires full dependency chain'
    }
  } catch (error) {
    return {
      config: 'Old Agent (Assumption-Based)',
      warnings: 0,
      timeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function testNewAgentConfig(): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    // Check if @openai/agents is available
    try {
      await import('@openai/agents')
    } catch {
      return {
        config: 'New Agent (Evidence-Based Only)',
        warnings: 0,
        timeMs: Date.now() - startTime,
        error: '@openai/agents package not installed'
      }
    }
    
    console.log('[New Agent] Would use evidence-based instructions only')
    console.log('[New Agent] Would return empty warnings if insufficient evidence')
    
    const timeMs = Date.now() - startTime
    
    return {
      config: 'New Agent (Evidence-Based Only)',
      warnings: 0,
      timeMs,
      error: 'Agent code restoration needed'
    }
  } catch (error) {
    return {
      config: 'New Agent (Evidence-Based Only)',
      warnings: 0,
      timeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function testHybridAgentConfig(): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    // Check if @openai/agents is available
    try {
      await import('@openai/agents')
    } catch {
      return {
        config: 'Hybrid Agent (Evidence-First, Then Inference)',
        warnings: 0,
        timeMs: Date.now() - startTime,
        error: '@openai/agents package not installed'
      }
    }
    
    console.log('[Hybrid Agent] Would use evidence-first, then inference fallback')
    console.log('[Hybrid Agent] Would mark inferred warnings with lower confidence')
    
    const timeMs = Date.now() - startTime
    
    return {
      config: 'Hybrid Agent (Evidence-First, Then Inference)',
      warnings: 0,
      timeMs,
      error: 'Agent code restoration needed'
    }
  } catch (error) {
    return {
      config: 'Hybrid Agent (Evidence-First, Then Inference)',
      warnings: 0,
      timeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function main() {
  console.log('🧪 Testing Agent Configurations')
  console.log(`📚 Test ISBN: ${TEST_ISBN}`)
  console.log('=' .repeat(60))
  console.log()
  
  const results: TestResult[] = []
  
  // Test current system (this will actually work)
  console.log('1️⃣ Testing Current System (multi-model-analysis.ts)...')
  const currentResult = await testCurrentSystem()
  results.push(currentResult)
  console.log(`   ✅ Completed in ${currentResult.timeMs}ms`)
  console.log(`   📊 Warnings: ${currentResult.warnings}`)
  if (currentResult.reasoning) {
    console.log(`   💭 Reasoning: ${currentResult.reasoning.substring(0, 100)}...`)
  }
  console.log()
  
  // Test old agent (simulated - would need package restoration)
  console.log('2️⃣ Testing Old Agent (Assumption-Based) - SIMULATED...')
  const oldResult = await testOldAgentConfig()
  results.push(oldResult)
  console.log(`   ⚠️  ${oldResult.error}`)
  console.log()
  
  // Test new agent (simulated)
  console.log('3️⃣ Testing New Agent (Evidence-Based Only) - SIMULATED...')
  const newResult = await testNewAgentConfig()
  results.push(newResult)
  console.log(`   ⚠️  ${newResult.error}`)
  console.log()
  
  // Test hybrid agent (simulated)
  console.log('4️⃣ Testing Hybrid Agent (Evidence-First, Then Inference) - SIMULATED...')
  const hybridResult = await testHybridAgentConfig()
  results.push(hybridResult)
  console.log(`   ⚠️  ${hybridResult.error}`)
  console.log()
  
  // Summary
  console.log('=' .repeat(60))
  console.log('📊 SUMMARY')
  console.log('=' .repeat(60))
  console.log()
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.config}`)
    console.log(`   Time: ${result.timeMs}ms`)
    console.log(`   Warnings: ${result.warnings}`)
    if (result.error) {
      console.log(`   ⚠️  ${result.error}`)
    }
    if (result.reasoning) {
      console.log(`   💭 ${result.reasoning.substring(0, 80)}...`)
    }
    console.log()
  })
  
  // Note about old agents
  console.log('📝 NOTE:')
  console.log('   Old agent configurations require the @openai/agents package')
  console.log('   which was removed when agents were replaced on Dec 31, 2025.')
  console.log('   To test old agents, you would need to:')
  console.log('   1. Restore @openai/agents package')
  console.log('   2. Restore agent code from backups/')
  console.log('   3. Call with instructionMode: "old" | "new" | "hybrid"')
  console.log()
}

main().catch(console.error)

