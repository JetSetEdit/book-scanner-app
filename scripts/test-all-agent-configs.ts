/**
 * Test All Agent Configurations
 * 
 * Tests one ISBN through ALL agent instruction modes:
 * - Old (assumption-based)
 * - New (evidence-based)
 * - Hybrid (evidence-first, then inference)
 * - Current system (multi-model-analysis.ts)
 * 
 * Records timing and results for each configuration.
 */

import dotenv from 'dotenv'
import { readFileSync } from 'fs'

// Load environment variables
dotenv.config({ path: '.env.local' })
dotenv.config()

// Get ISBN from command line argument or use default
const TEST_ISBN = process.argv[2] || '9780593440872' // Default: "Book Lovers" by Emily Henry

interface TestResult {
  config: string
  warnings: number
  timeMs: number
  reasoning?: string
  error?: string
  status: 'success' | 'failed' | 'partial' // Real status tracking
  details?: {
    bookFound?: boolean
    descriptionLength?: number
    confidence?: string
    warnings?: any[] // Include full warnings
  }
}

async function testCurrentSystem(): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    const { analyzeBookWithMultiModel } = await import('../lib/services/multi-model-analysis')
    const { fetchCandidatesByISBN } = await import('../lib/book-api')
    
    console.log(`[Current] Fetching book metadata for ISBN: ${TEST_ISBN}...`)
    const candidates = await fetchCandidatesByISBN(TEST_ISBN)
    
    if (!candidates || candidates.length === 0) {
      return {
        config: 'Current System (multi-model-analysis.ts)',
        warnings: 0,
        timeMs: Date.now() - startTime,
        error: 'Book not found via ISBN lookup',
        details: { bookFound: false }
      }
    }
    
    const bestCandidate = candidates[0]
    console.log(`[Current] Found: "${bestCandidate.title}" by ${bestCandidate.author || 'Unknown'}`)
    
    const metadata = {
      title: bestCandidate.title,
      author: bestCandidate.author || 'Unknown',
      description: bestCandidate.description || '',
      isbn: TEST_ISBN
    }
    
    console.log(`[Current] Starting AI analysis...`)
    const result = await analyzeBookWithMultiModel(metadata, (msg) => {
      if (msg.includes('Starting') || msg.includes('Analyzing') || msg.includes('Processing')) {
        console.log(`[Current] ${msg}`)
      }
    })
    
    const timeMs = Date.now() - startTime
    
    return {
      config: 'Current System (multi-model-analysis.ts)',
      warnings: result.warnings.length,
      timeMs,
      status: 'success' as const,
      reasoning: result.noWarningsReasoning || (result.warnings.length > 0 
        ? `Generated ${result.warnings.length} warnings` 
        : 'No warnings generated'),
      details: {
        bookFound: true,
        descriptionLength: metadata.description.length
      }
    }
  } catch (error) {
    return {
      config: 'Current System (multi-model-analysis.ts)',
      warnings: 0,
      timeMs: Date.now() - startTime,
      status: 'failed' as const,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function testOldAgentConfig(): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    // Check if agent code exists
    let generateContentWarnings
    try {
      const agentModule = await import('../lib/content-warning-agent')
      generateContentWarnings = agentModule.generateContentWarnings
    } catch (error) {
      return {
        config: 'Old Agent (Assumption-Based)',
        warnings: 0,
        timeMs: Date.now() - startTime,
        error: `Agent code not found: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
    
    if (!generateContentWarnings) {
      return {
        config: 'Old Agent (Assumption-Based)',
        warnings: 0,
        timeMs: Date.now() - startTime,
        error: 'generateContentWarnings function not exported'
      }
    }
    
    // Fetch book metadata first
    const { fetchCandidatesByISBN } = await import('../lib/book-api')
    console.log(`[Old Agent] Fetching book metadata for ISBN: ${TEST_ISBN}...`)
    const candidates = await fetchCandidatesByISBN(TEST_ISBN)
    
    if (!candidates || candidates.length === 0) {
      return {
        config: 'Old Agent (Assumption-Based)',
        warnings: 0,
        timeMs: Date.now() - startTime,
        error: 'Book not found via ISBN lookup',
        details: { bookFound: false }
      }
    }
    
    const bestCandidate = candidates[0]
    console.log(`[Old Agent] Found: "${bestCandidate.title}" by ${bestCandidate.author || 'Unknown'}`)
    
    const workflow = {
      book_title: bestCandidate.title,
      book_author: bestCandidate.author || 'Unknown',
      book_description: bestCandidate.description || '',
      book_categories: bestCandidate.categories || [],
      book_cover_url: bestCandidate.coverUrl || null,
      isbn: TEST_ISBN
    }
    
    console.log(`[Old Agent] Starting analysis with assumption-based instructions...`)
    const result = await generateContentWarnings(workflow, 'gpt-4o', 'old')
    
    const timeMs = Date.now() - startTime
    
    // Log warnings for debugging
    if (result.content_warnings && result.content_warnings.length > 0) {
      console.log(`   ⚠️  Warnings found:`)
      result.content_warnings.forEach((w, i) => {
        console.log(`      ${i+1}. ${w.category_id}${w.subcategory_id ? '.' + w.subcategory_id : ''}: ${w.description}`)
        console.log(`         Score: ${w.score.toFixed(2)}, Severity: ${w.severity}`)
      })
    }
    
    const hasError = result.reasoning?.includes('Error:') || result.reasoning?.includes('429') || result.reasoning?.includes('rate limit');
    
    return {
      config: 'Old Agent (Assumption-Based)',
      warnings: result.content_warnings?.length || 0,
      timeMs,
      status: hasError ? 'failed' as const : 'success' as const,
      reasoning: result.reasoning || 'No reasoning provided',
      details: {
        bookFound: true,
        descriptionLength: workflow.book_description.length,
        confidence: result.confidence,
        warnings: result.content_warnings // Include full warnings in details
      }
    }
  } catch (error) {
    return {
      config: 'Old Agent (Assumption-Based)',
      warnings: 0,
      timeMs: Date.now() - startTime,
      status: 'failed' as const,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function testNewAgentConfig(): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    let generateContentWarnings
    try {
      const agentModule = await import('../lib/content-warning-agent')
      generateContentWarnings = agentModule.generateContentWarnings
    } catch (error) {
      return {
        config: 'New Agent (Evidence-Based Only)',
        warnings: 0,
        timeMs: Date.now() - startTime,
        error: `Agent code not found: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
    
    if (!generateContentWarnings) {
      return {
        config: 'New Agent (Evidence-Based Only)',
        warnings: 0,
        timeMs: Date.now() - startTime,
        error: 'generateContentWarnings function not exported'
      }
    }
    
    const { fetchCandidatesByISBN } = await import('../lib/book-api')
    console.log(`[New Agent] Fetching book metadata for ISBN: ${TEST_ISBN}...`)
    const candidates = await fetchCandidatesByISBN(TEST_ISBN)
    
    if (!candidates || candidates.length === 0) {
      return {
        config: 'New Agent (Evidence-Based Only)',
        warnings: 0,
        timeMs: Date.now() - startTime,
        error: 'Book not found via ISBN lookup',
        details: { bookFound: false }
      }
    }
    
    const bestCandidate = candidates[0]
    console.log(`[New Agent] Found: "${bestCandidate.title}" by ${bestCandidate.author || 'Unknown'}`)
    
    const workflow = {
      book_title: bestCandidate.title,
      book_author: bestCandidate.author || 'Unknown',
      book_description: bestCandidate.description || '',
      book_categories: bestCandidate.categories || [],
      book_cover_url: bestCandidate.coverUrl || null,
      isbn: TEST_ISBN
    }
    
    console.log(`[New Agent] Starting analysis with evidence-based instructions...`)
    const result = await generateContentWarnings(workflow, 'gpt-4o', 'new')
    
    const timeMs = Date.now() - startTime
    
    const hasError = result.reasoning?.includes('Error:') || result.reasoning?.includes('429') || result.reasoning?.includes('rate limit') || result.reasoning?.includes('workflow incomplete');
    
    return {
      config: 'New Agent (Evidence-Based Only)',
      warnings: result.content_warnings?.length || 0,
      timeMs,
      status: hasError ? 'failed' as const : 'success' as const,
      reasoning: result.reasoning || 'No reasoning provided',
      details: {
        bookFound: true,
        descriptionLength: workflow.book_description.length,
        confidence: result.confidence
      }
    }
  } catch (error) {
    return {
      config: 'New Agent (Evidence-Based Only)',
      warnings: 0,
      timeMs: Date.now() - startTime,
      status: 'failed' as const,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function testHybridAgentConfig(): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    let generateContentWarnings
    try {
      const agentModule = await import('../lib/content-warning-agent')
      generateContentWarnings = agentModule.generateContentWarnings
    } catch (error) {
      return {
        config: 'Hybrid Agent (Evidence-First, Then Inference)',
        warnings: 0,
        timeMs: Date.now() - startTime,
        error: `Agent code not found: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
    
    if (!generateContentWarnings) {
      return {
        config: 'Hybrid Agent (Evidence-First, Then Inference)',
        warnings: 0,
        timeMs: Date.now() - startTime,
        error: 'generateContentWarnings function not exported'
      }
    }
    
    const { fetchCandidatesByISBN } = await import('../lib/book-api')
    console.log(`[Hybrid Agent] Fetching book metadata for ISBN: ${TEST_ISBN}...`)
    const candidates = await fetchCandidatesByISBN(TEST_ISBN)
    
    if (!candidates || candidates.length === 0) {
      return {
        config: 'Hybrid Agent (Evidence-First, Then Inference)',
        warnings: 0,
        timeMs: Date.now() - startTime,
        error: 'Book not found via ISBN lookup',
        details: { bookFound: false }
      }
    }
    
    const bestCandidate = candidates[0]
    console.log(`[Hybrid Agent] Found: "${bestCandidate.title}" by ${bestCandidate.author || 'Unknown'}`)
    
    const workflow = {
      book_title: bestCandidate.title,
      book_author: bestCandidate.author || 'Unknown',
      book_description: bestCandidate.description || '',
      book_categories: bestCandidate.categories || [],
      book_cover_url: bestCandidate.coverUrl || null,
      isbn: TEST_ISBN
    }
    
    console.log(`[Hybrid Agent] Starting analysis with hybrid instructions...`)
    const result = await generateContentWarnings(workflow, 'gpt-4o', 'hybrid')
    
    const timeMs = Date.now() - startTime
    
    const hasError = result.reasoning?.includes('Error:') || result.reasoning?.includes('429') || result.reasoning?.includes('rate limit') || result.reasoning?.includes('workflow incomplete');
    
    return {
      config: 'Hybrid Agent (Evidence-First, Then Inference)',
      warnings: result.content_warnings?.length || 0,
      timeMs,
      status: hasError ? 'failed' as const : 'success' as const,
      reasoning: result.reasoning || 'No reasoning provided',
      details: {
        bookFound: true,
        descriptionLength: workflow.book_description.length,
        confidence: result.confidence
      }
    }
  } catch (error) {
    return {
      config: 'Hybrid Agent (Evidence-First, Then Inference)',
      warnings: 0,
      timeMs: Date.now() - startTime,
      status: 'failed' as const,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function main() {
  console.log('🧪 Testing ALL Agent Configurations')
  console.log(`📚 Test ISBN: ${TEST_ISBN}`)
  console.log('=' .repeat(60))
  console.log()
  
  const results: TestResult[] = []
  
  // Test current system
  console.log('1️⃣ Testing Current System (multi-model-analysis.ts)...')
  const currentResult = await testCurrentSystem()
  results.push(currentResult)
  console.log(`   ✅ Completed in ${currentResult.timeMs}ms`)
  console.log(`   📊 Warnings: ${currentResult.warnings}`)
  if (currentResult.reasoning) {
    console.log(`   💭 Reasoning: ${currentResult.reasoning.substring(0, 100)}...`)
  }
  if (currentResult.error) {
    console.log(`   ⚠️  Error: ${currentResult.error}`)
  }
  console.log()
  
  // Wait to avoid rate limits
  console.log('⏳ Waiting 20 seconds to avoid rate limits...')
  await new Promise(resolve => setTimeout(resolve, 20000))
  
  // Test old agent
  console.log('2️⃣ Testing Old Agent (Assumption-Based)...')
  const oldResult = await testOldAgentConfig()
  results.push(oldResult)
  console.log(`   ${oldResult.error ? '❌' : '✅'} Completed in ${oldResult.timeMs}ms`)
  console.log(`   📊 Warnings: ${oldResult.warnings}`)
  if (oldResult.reasoning) {
    console.log(`   💭 Reasoning: ${oldResult.reasoning.substring(0, 100)}...`)
  }
  if (oldResult.error) {
    console.log(`   ⚠️  Error: ${oldResult.error}`)
  }
  console.log()
  
  // Wait to avoid rate limits
  console.log('⏳ Waiting 20 seconds to avoid rate limits...')
  await new Promise(resolve => setTimeout(resolve, 20000))
  
  // Test new agent
  console.log('3️⃣ Testing New Agent (Evidence-Based Only)...')
  const newResult = await testNewAgentConfig()
  results.push(newResult)
  console.log(`   ${newResult.error ? '❌' : '✅'} Completed in ${newResult.timeMs}ms`)
  console.log(`   📊 Warnings: ${newResult.warnings}`)
  if (newResult.reasoning) {
    console.log(`   💭 Reasoning: ${newResult.reasoning.substring(0, 100)}...`)
  }
  if (newResult.error) {
    console.log(`   ⚠️  Error: ${newResult.error}`)
  }
  console.log()
  
  // Wait to avoid rate limits
  console.log('⏳ Waiting 20 seconds to avoid rate limits...')
  await new Promise(resolve => setTimeout(resolve, 20000))
  
  // Test hybrid agent
  console.log('4️⃣ Testing Hybrid Agent (Evidence-First, Then Inference)...')
  const hybridResult = await testHybridAgentConfig()
  results.push(hybridResult)
  console.log(`   ${hybridResult.error ? '❌' : '✅'} Completed in ${hybridResult.timeMs}ms`)
  console.log(`   📊 Warnings: ${hybridResult.warnings}`)
  if (hybridResult.reasoning) {
    console.log(`   💭 Reasoning: ${hybridResult.reasoning.substring(0, 100)}...`)
  }
  if (hybridResult.error) {
    console.log(`   ⚠️  Error: ${hybridResult.error}`)
  }
  console.log()
  
  // Summary
  console.log('=' .repeat(60))
  console.log('📊 SUMMARY')
  console.log('=' .repeat(60))
  console.log()
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.config}`)
    console.log(`   ⏱️  Time: ${result.timeMs}ms (${(result.timeMs / 1000).toFixed(2)}s)`)
    console.log(`   📊 Warnings: ${result.warnings}`)
    if (result.details) {
      if (result.details.descriptionLength !== undefined) {
        console.log(`   📝 Description: ${result.details.descriptionLength} chars`)
      }
      if (result.details.confidence) {
        console.log(`   🎯 Confidence: ${result.details.confidence}`)
      }
    }
    if (result.error) {
      console.log(`   ⚠️  Error: ${result.error}`)
    } else if (result.reasoning) {
      console.log(`   💭 ${result.reasoning.substring(0, 80)}...`)
    }
    console.log()
  })
  
  // Comparison table
  console.log('=' .repeat(60))
  console.log('📈 COMPARISON TABLE')
  console.log('=' .repeat(60))
  console.log()
  console.log('Config                          | Time (s) | Warnings | Status')
  console.log('-'.repeat(60))
  results.forEach(result => {
    const time = (result.timeMs / 1000).toFixed(2)
    const status = result.status === 'failed' ? '❌ Failed' : result.status === 'partial' ? '⚠️  Partial' : '✅ Success'
    const configName = result.config.padEnd(30)
    console.log(`${configName} | ${time.padStart(7)} | ${String(result.warnings).padStart(8)} | ${status}`)
  })
  console.log()
}

main().catch(console.error)

