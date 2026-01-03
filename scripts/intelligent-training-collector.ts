#!/usr/bin/env tsx
/**
 * Intelligent Training Data Collector
 * 
 * Scans books, investigates why some return no warnings,
 * validates with web search/AI, and builds training data.
 * Tracks token usage to stay within budget.
 * 
 * Usage: tsx scripts/intelligent-training-collector.ts [--budget 5] [--max-books 20]
 */

// Load environment variables FIRST before any imports
import * as dotenv from 'dotenv'
const result1 = dotenv.config({ path: '.env.local' })
const result2 = dotenv.config()

// Verify critical env vars
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables!')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌')
  console.error('\n💡 Make sure .env.local exists and contains these variables')
  process.exit(1)
}

import * as fs from 'fs/promises'
import * as path from 'path'
import { processIsbnScan } from '../lib/services/scan-service'
import { fetchCandidatesByISBN } from '../lib/book-api'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface BookResult {
  isbn: string
  title: string
  author: string | null
  description: string | null
  warnings: number
  hasWarnings: boolean
  investigation?: {
    webSearchFound: boolean
    shouldHaveWarnings: boolean
    reason: string
    evidence?: string
  }
  trainingExample?: any
}

interface TokenUsage {
  inputTokens: number
  outputTokens: number
  estimatedCost: number // in USD
}

// Token costs (approximate, as of 2024)
const TOKEN_COSTS = {
  'gpt-4o': {
    input: 0.0025 / 1000,  // $2.50 per 1M tokens
    output: 0.010 / 1000   // $10.00 per 1M tokens
  },
  'gpt-4': {
    input: 0.03 / 1000,
    output: 0.06 / 1000
  }
}

let tokenUsage: TokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  estimatedCost: 0
}

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const costs = TOKEN_COSTS[model as keyof typeof TOKEN_COSTS] || TOKEN_COSTS['gpt-4o']
  return (inputTokens * costs.input) + (outputTokens * costs.output)
}

async function webSearchForContentWarnings(title: string, author: string | null): Promise<{
  found: boolean
  evidence: string
  shouldHaveWarnings: boolean
}> {
  const query = `${title} ${author || ''} content warnings trigger warnings`
  
  try {
    // Use DuckDuckGo API for free web search
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`
    )
    const data = await response.json()
    
    let evidence = ''
    let found = false
    
    if (data.AbstractText) {
      evidence += `Summary: ${data.AbstractText}\n`
      found = true
    }
    
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, 3)) {
        if (topic.Text) {
          evidence += `Related: ${topic.Text}\n`
          found = true
        }
      }
    }
    
    // Check if evidence mentions content warnings
    const lowerEvidence = evidence.toLowerCase()
    const hasWarningKeywords = 
      lowerEvidence.includes('content warning') ||
      lowerEvidence.includes('trigger warning') ||
      lowerEvidence.includes('mature content') ||
      lowerEvidence.includes('sensitive') ||
      lowerEvidence.includes('violence') ||
      lowerEvidence.includes('sexual') ||
      lowerEvidence.includes('abuse') ||
      lowerEvidence.includes('trauma')
    
    return {
      found,
      evidence: evidence || 'No evidence found',
      shouldHaveWarnings: hasWarningKeywords
    }
  } catch (error) {
    return {
      found: false,
      evidence: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      shouldHaveWarnings: false
    }
  }
}

async function investigateNoWarnings(
  isbn: string,
  title: string,
  author: string | null,
  description: string | null
): Promise<BookResult['investigation']> {
  console.log(`   🔍 Investigating why no warnings were found...`)
  
  // Web search for content warnings
  const webResult = await webSearchForContentWarnings(title, author || '')
  
  // Analyze description for potential warnings
  let descriptionAnalysis = false
  if (description) {
    const descLower = description.toLowerCase()
    descriptionAnalysis = 
      descLower.includes('violence') ||
      descLower.includes('sexual') ||
      descLower.includes('abuse') ||
      descLower.includes('trauma') ||
      descLower.includes('death') ||
      descLower.includes('mental health') ||
      descLower.includes('dark') ||
      descLower.includes('mature')
  }
  
  const shouldHaveWarnings = webResult.shouldHaveWarnings || descriptionAnalysis
  
  return {
    webSearchFound: webResult.found,
    shouldHaveWarnings,
    reason: shouldHaveWarnings 
      ? 'Web search or description suggests content warnings may be appropriate'
      : 'No evidence found that content warnings are needed',
    evidence: webResult.evidence
  }
}

async function scanBook(isbn: string, index: number, total: number, budget: number): Promise<BookResult | null> {
  console.log(`\n[${index + 1}/${total}] 📚 Scanning: ${isbn}`)
  
  try {
    // Get book metadata
    const candidates = await fetchCandidatesByISBN(isbn)
    if (!candidates || candidates.length === 0) {
      console.log(`   ❌ Book not found in APIs`)
      return null // Return null to indicate we should try another ISBN
    }
    
    const candidate = candidates[0]
    console.log(`   📖 "${candidate.title}" by ${candidate.author || 'Unknown'}`)
    
    if (!candidate.description || candidate.description.length < 50) {
      console.log(`   ⚠️  Description too short (${candidate.description?.length || 0} chars) - skipping`)
      return null
    }
    
    // Estimate cost before scanning (rough estimate: ~2000 input tokens, ~500 output tokens per book)
    const estimatedCost = estimateCost('gpt-4o', 2000, 500)
    if (tokenUsage.estimatedCost + estimatedCost > budget) {
      console.log(`   ⚠️  Skipping - would exceed budget (current: $${tokenUsage.estimatedCost.toFixed(4)})`)
      return {
        isbn,
        title: candidate.title,
        author: candidate.author,
        description: candidate.description || null,
        warnings: 0,
        hasWarnings: false
      }
    }
    
    // Scan for warnings (forceRefresh=true will regenerate warnings even if book exists)
    console.log(`   🔍 Analyzing content...`)
    let result
    try {
      result = await processIsbnScan(
        isbn,
        () => {}, // Silent progress
        candidate,
        true // Force refresh - will use existing book if found, but regenerate warnings
      )
    } catch (error: any) {
      // Handle duplicate key error - book already exists, try without force refresh
      if (error?.code === '23505' || error?.message?.includes('duplicate key')) {
        console.log(`   ℹ️  Book already exists, using existing record...`)
        result = await processIsbnScan(
          isbn,
          () => {},
          candidate,
          false // Don't force refresh if it already exists
        )
      } else {
        throw error
      }
    }
    
    // Track estimated token usage (rough estimate)
    // Multi-model analysis uses both OpenAI and Gemini, but we'll estimate OpenAI only
    const inputTokens = Math.ceil((candidate.description?.length || 0 + 2000) / 4)
    const outputTokens = Math.ceil(((result.contentWarnings?.length || 0) * 200 + 500) / 4)
    const cost = estimateCost('gpt-4o', inputTokens, outputTokens)
    
    tokenUsage.inputTokens += inputTokens
    tokenUsage.outputTokens += outputTokens
    tokenUsage.estimatedCost += cost
    
    if (!result.success) {
      console.log(`   ❌ Scan failed: ${result.message || 'Unknown error'}`)
      return {
        isbn,
        title: candidate.title,
        author: candidate.author,
        description: candidate.description || null,
        warnings: 0,
        hasWarnings: false
      }
    }
    
    const warnings = result.contentWarnings || []
    const hasWarnings = warnings.length > 0
    
    console.log(`   ${hasWarnings ? '⚠️' : '✅'} Found ${warnings.length} warnings`)
    
    // If no warnings, investigate
    let investigation: BookResult['investigation'] | undefined
    if (!hasWarnings && candidate.description && candidate.description.length > 100) {
      investigation = await investigateNoWarnings(
        isbn,
        candidate.title,
        candidate.author,
        candidate.description
      )
      
      if (investigation.shouldHaveWarnings) {
        console.log(`   ⚠️  Investigation suggests warnings may be needed`)
        console.log(`   📝 Reason: ${investigation.reason}`)
      } else {
        console.log(`   ✅ Investigation confirms: No warnings needed`)
      }
    }
    
    // Create training example
    const trainingExample = {
      book_id: result.book?.id || `isbn_${isbn}`,
      isbn,
      title: candidate.title,
      author: candidate.author,
      description: candidate.description || null,
      categories: candidate.categories || [],
      warnings: warnings.map((w: any) => ({
        subcategory_id: w.subcategory_id || '',
        category_id: w.category_id || '',
        severity: w.severity || 'mild',
        description: w.description || '',
        context_modifiers: w.context_modifiers || []
      })),
      metadata: {
        description_length: candidate.description?.length || 0,
        warning_count: warnings.length,
        has_description: !!candidate.description,
        investigated: !!investigation,
        investigation_result: investigation
      }
    }
    
    return {
      isbn,
      title: candidate.title,
      author: candidate.author,
      description: candidate.description || null,
      warnings: warnings.length,
      hasWarnings,
      investigation,
      trainingExample
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return {
      isbn,
      title: 'Error',
      author: null,
      description: null,
      warnings: 0,
      hasWarnings: false
    }
  }
}

async function loadRandomISBNs(count: number): Promise<string[]> {
  const datasetPath = path.join(process.cwd(), 'data', 'datasets', 'goodbooks-10k-github', 'books.csv')
  
  try {
    const fileContent = await fs.readFile(datasetPath, 'utf-8')
    const lines = fileContent.split('\n').filter(l => l.trim())
    
    if (lines.length < 2) {
      throw new Error('CSV file is empty')
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const isbn13Index = headers.indexOf('isbn13')
    
    if (isbn13Index === -1) {
      throw new Error('isbn13 column not found')
    }
    
    const validISBNs: string[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',')
      if (values.length > isbn13Index) {
        let isbn13 = values[isbn13Index]?.replace(/"/g, '').trim()
        if (isbn13.includes('e+') || isbn13.includes('E+')) {
          isbn13 = parseFloat(isbn13).toString()
        }
        if (isbn13 && /^\d{13}$/.test(isbn13)) {
          validISBNs.push(isbn13)
        }
      }
    }
    
    // Shuffle and return
    const shuffled = [...validISBNs].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(count, shuffled.length))
  } catch (error) {
    console.error('Error loading ISBNs:', error)
    return []
  }
}

async function saveTrainingData(results: BookResult[]): Promise<void> {
  const trainingFile = path.join(process.cwd(), 'data', 'training', 'intelligent_training_data.json')
  
  // Load existing if any
  let existing: any[] = []
  try {
    const existingContent = await fs.readFile(trainingFile, 'utf-8')
    existing = JSON.parse(existingContent)
  } catch {
    // File doesn't exist, start fresh
  }
  
  // Add new examples
  const newExamples = results
    .filter(r => r.trainingExample)
    .map(r => r.trainingExample)
  
  const allExamples = [...existing, ...newExamples]
  
  // Deduplicate by ISBN
  const seen = new Set<string>()
  const unique = allExamples.filter(ex => {
    const key = ex.isbn
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  
  await fs.writeFile(trainingFile, JSON.stringify(unique, null, 2))
  
  console.log(`\n💾 Saved ${unique.length} training examples (${newExamples.length} new)`)
  console.log(`   File: ${trainingFile}`)
}

async function combineAndRetrain(): Promise<void> {
  console.log('\n🔄 Combining all training data and retraining model...')
  
  try {
    // Combine
    await execAsync('npx tsx scripts/combine-training-data.ts')
    
    // Retrain
    const trainingFile = path.join(process.cwd(), 'data', 'training', 'combined_training_data.json')
    const modelFile = path.join(process.cwd(), 'data', 'models', 'content_warning_classifier.pkl')
    
    await execAsync(`python3 scripts/train-classifier.py "${trainingFile}" "${modelFile}"`)
    
    console.log('✅ Model retrained successfully')
  } catch (error: any) {
    console.error('⚠️  Retraining failed:', error.message)
  }
}

function parseArgs(): { budget: number; maxBooks: number } {
  const args = process.argv.slice(2)
  let budget = 5.0
  let maxBooks = 20
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--budget' && i + 1 < args.length) {
      budget = parseFloat(args[i + 1]) || 5.0
      i++
    } else if (args[i] === '--max-books' && i + 1 < args.length) {
      maxBooks = parseInt(args[i + 1], 10) || 20
      i++
    }
  }
  
  return { budget, maxBooks }
}

async function main() {
  const { budget, maxBooks } = parseArgs()
  
  console.log('🧠 Intelligent Training Data Collector\n')
  console.log('═'.repeat(70))
  console.log(`💰 Budget: $${budget.toFixed(2)}`)
  console.log(`📚 Max Books: ${maxBooks}`)
  console.log('═'.repeat(70))
  
  // Load random ISBNs
  console.log('\n📥 Loading random ISBNs from dataset...')
  const isbns = await loadRandomISBNs(maxBooks)
  console.log(`✅ Loaded ${isbns.length} ISBNs\n`)
  
  if (isbns.length === 0) {
    console.error('❌ No ISBNs found. Check dataset file.')
    process.exit(1)
  }
  
  // Scan books - keep trying until we get valid results or hit budget
  console.log('🔍 Scanning books and investigating results...\n')
  const results: BookResult[] = []
  let attempts = 0
  const maxAttempts = isbns.length * 2 // Try up to 2x the ISBN list
  
  while (results.length < maxBooks && attempts < maxAttempts && tokenUsage.estimatedCost < budget) {
    const isbn = isbns[attempts % isbns.length]
    attempts++
    
    const result = await scanBook(isbn, results.length, maxBooks, budget)
    
    if (result === null) {
      // Book not found or invalid - try next
      continue
    }
    
    results.push(result)
    
    // Show current cost
    console.log(`   💰 Current cost: $${tokenUsage.estimatedCost.toFixed(4)} / $${budget.toFixed(2)}`)
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check budget
    if (tokenUsage.estimatedCost >= budget * 0.95) {
      console.log(`\n⚠️  Approaching budget limit ($${tokenUsage.estimatedCost.toFixed(2)})`)
      console.log(`   Stopping early to stay within budget`)
      break
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(70))
  console.log('📊 SUMMARY')
  console.log('═'.repeat(70))
  
  const withWarnings = results.filter(r => r.hasWarnings).length
  const withoutWarnings = results.filter(r => !r.hasWarnings).length
  const investigated = results.filter(r => r.investigation).length
  const shouldHaveWarnings = results.filter(r => r.investigation?.shouldHaveWarnings).length
  
  console.log(`\n📚 Books Scanned: ${results.length}`)
  console.log(`   ✅ With Warnings: ${withWarnings}`)
  console.log(`   ❌ Without Warnings: ${withoutWarnings}`)
  console.log(`   🔍 Investigated: ${investigated}`)
  console.log(`   ⚠️  Should Have Warnings: ${shouldHaveWarnings}`)
  console.log(`\n💰 Estimated Token Cost: $${tokenUsage.estimatedCost.toFixed(4)}`)
  console.log(`   Input Tokens: ${tokenUsage.inputTokens.toLocaleString()}`)
  console.log(`   Output Tokens: ${tokenUsage.outputTokens.toLocaleString()}`)
  
  // Save training data
  console.log('\n💾 Saving training data...')
  await saveTrainingData(results)
  
  // Retrain if we have new data
  if (results.some(r => r.trainingExample)) {
    const shouldRetrain = await new Promise<boolean>((resolve) => {
      // Auto-retrain if we have enough new examples
      const newExamples = results.filter(r => r.trainingExample).length
      resolve(newExamples >= 5)
    })
    
    if (shouldRetrain) {
      await combineAndRetrain()
    } else {
      console.log('\n💡 Tip: Run combine-and-retrain manually when ready:')
      console.log('   npx tsx scripts/combine-training-data.ts')
      console.log('   python3 scripts/train-classifier.py data/training/combined_training_data.json')
    }
  }
  
  console.log('\n✅ Collection complete!')
}

main().catch(error => {
  console.error('\n❌ Error:', error)
  process.exit(1)
})

