#!/usr/bin/env tsx

/**
 * Compare GPT-4o vs Gemini for content warning generation
 * Usage: npx tsx scripts/compare-models.ts <ISBN>
 */

import { findBookAndGenerateWarnings } from '../lib/content-warning-agent'
import { fetchCandidatesByISBN } from '../lib/book-api'
import { GoogleGenerativeAI } from '@google/generative-ai'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env.local')
  process.exit(1)
}

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in environment')
  process.exit(1)
}

// Gemini implementation
async function generateWarningsWithGemini(
  isbn: string,
  bookTitle: string,
  bookAuthor: string,
  bookDescription?: string,
  bookCategories?: string[]
): Promise<{
  content_warnings: any[]
  classification_rating?: string
  confidence: 'low' | 'medium' | 'high'
  reasoning: string
}> {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  // Get the same instructions as the hybrid mode
  const instructions = `
You are an expert content warning generator for a book database. Your goal is to analyze book metadata and generate accurate, specific content warnings based on the Australian Classification Board standards.

Book Information:
- Title: ${bookTitle}
- Author: ${bookAuthor}
${bookDescription ? `- Description: ${bookDescription}` : '- Description: NOT PROVIDED'}
${bookCategories ? `- Categories: ${bookCategories.join(', ')}` : ''}
- ISBN: ${isbn}

## HYBRID APPROACH - EVIDENCE FIRST, THEN INFERENCE

### PHASE 1: Evidence-Based Analysis (Primary)
1. Source Reliability Hierarchy (In Order of Priority):
   - Author/Publisher Authority: Official "Content Notes" or "Trigger Warnings" from the author's website or publisher page. (Gold Standard).
   - Professional Reviews: Kirkus, Publishers Weekly, Common Sense Media.
   - User Consensus: Goodreads/StoryGraph (Only if multiple reviews cite specific details).

2. Execution:
   - Base warnings on the book description provided.
   - If description is short/missing, infer conservatively based on genre.
   - Conflict Resolution: If the Author says "clean" but >70% of user reviews cite a specific graphic trigger, flag it as Verified (User Consensus).

### PHASE 2: Inference-Based Analysis (Secondary)
- Use ONLY when verified info is insufficient.
- Inference Rules:
  - Romance Genre: Do NOT infer explicit sex unless "Steamy", "Spice", or "Erotica" is indicated.
  - Thriller/Mystery: Do NOT infer graphic gore unless "Horror", "Slasher", or "Dark" is indicated.
- Set confidence score lower (0.5 - 0.69) for inferred warnings.

### PHASE 3: False Positive Checks
- Death ≠ Grief: Character death alone is not "Grief" unless the *processing* of loss is a theme.
- Action ≠ Violence: Fantasy battles/Action sequences are usually "Mild/Moderate" unless gore is described.
- Non-Fiction: Clinical discussion of sensitive topics uses the \`clinical\` detail level and lower severity than graphic fiction.

## Output Format
Return a JSON object with this exact structure:
{
  "content_warnings": [
    {
      "category_id": "mental_health" | "sexual_content" | "violence" | "emotional_abuse_or_toxic_relationships" | "bullying_or_social_cruelty" | "substance_use_or_alcohol" | "death_or_grief" | "discrimination" | "language" | "other",
      "subcategory_id": "string (optional)",
      "description": "User-facing description",
      "score": 0.0-1.0,
      "reasoning": "Technical explanation",
      "presence": "on_page" | "off_page" | "flashback" | "referenced" | "implied",
      "detail_level": "graphic" | "moderate" | "vague" | "clinical",
      "is_spoiler": boolean
    }
  ],
  "classification_rating": "G" | "PG" | "M" | "MA15+" | "R18+",
  "confidence": "low" | "medium" | "high",
  "reasoning": "Overall reasoning for the analysis"
}

If no content warnings are needed, return an empty array: {"content_warnings": [], "classification_rating": "G", "confidence": "medium", "reasoning": "..."}
`

  try {
    const result = await model.generateContent(instructions)
    const response = result.response
    const text = response.text()

    // Try to extract JSON from the response
    let jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      // If no JSON found, try to parse the whole response
      jsonMatch = [text]
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Map to expected format
    const warnings = (parsed.content_warnings || []).map((w: any) => ({
      ...w,
      severity: w.score < 0.31 ? 'mild' : w.score < 0.56 ? 'moderate' : 'severe',
      category: w.category_id,
      category_id: w.category_id || w.category
    }))

    return {
      content_warnings: warnings,
      classification_rating: parsed.classification_rating,
      confidence: parsed.confidence || 'medium',
      reasoning: parsed.reasoning || 'Gemini-generated analysis'
    }
  } catch (error) {
    console.error('Gemini error:', error)
    return {
      content_warnings: [],
      confidence: 'low',
      reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

async function compareModels(isbn: string) {
  console.log(`\n📚 Comparing Models for ISBN: ${isbn}\n`)
  console.log('=' .repeat(60))

  // Fetch book metadata first
  console.log('\n📖 Fetching book metadata...')
  const candidates = await fetchCandidatesByISBN(isbn)
  if (candidates.length === 0) {
    console.error('❌ Book not found in external APIs')
    process.exit(1)
  }

  const bookData = candidates[0]
  console.log(`✅ Found: "${bookData.title}" by ${bookData.author}`)
  console.log(`   Description length: ${bookData.description?.length || 0} chars\n`)

  // Test GPT-4o
  console.log('🤖 Testing GPT-4o...')
  const gpt4oStart = Date.now()
  let gpt4oResult
  try {
    gpt4oResult = await findBookAndGenerateWarnings(isbn, 'gpt-4o', 'hybrid')
    const gpt4oTime = Date.now() - gpt4oStart
    console.log(`✅ GPT-4o completed in ${gpt4oTime}ms`)
    console.log(`   Warnings: ${gpt4oResult.content_warnings.length}`)
    console.log(`   Confidence: ${gpt4oResult.confidence}`)
  } catch (error) {
    console.error(`❌ GPT-4o failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    gpt4oResult = null
  }

  // Test Gemini
  console.log('\n🤖 Testing Gemini 2.5 Flash...')
  const geminiStart = Date.now()
  let geminiResult
  try {
    geminiResult = await generateWarningsWithGemini(
      isbn,
      bookData.title,
      bookData.author || 'Unknown',
      bookData.description,
      bookData.categories
    )
    const geminiTime = Date.now() - geminiStart
    console.log(`✅ Gemini completed in ${geminiTime}ms`)
    console.log(`   Warnings: ${geminiResult.content_warnings.length}`)
    console.log(`   Confidence: ${geminiResult.confidence}`)
  } catch (error) {
    console.error(`❌ Gemini failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    geminiResult = null
  }

  // Comparison
  console.log('\n' + '='.repeat(60))
  console.log('📊 COMPARISON RESULTS')
  console.log('='.repeat(60))

  if (gpt4oResult && geminiResult) {
    console.log('\n📈 Warning Count:')
    console.log(`   GPT-4o: ${gpt4oResult.content_warnings.length} warnings`)
    console.log(`   Gemini: ${geminiResult.content_warnings.length} warnings`)

    console.log('\n🎯 Confidence:')
    console.log(`   GPT-4o: ${gpt4oResult.confidence}`)
    console.log(`   Gemini: ${geminiResult.confidence}`)

    console.log('\n📝 Classification Rating:')
    console.log(`   GPT-4o: ${gpt4oResult.classification_rating || 'N/A'}`)
    console.log(`   Gemini: ${geminiResult.classification_rating || 'N/A'}`)

    // Compare categories
    const gpt4oCategories = new Set(gpt4oResult.content_warnings.map((w: any) => w.category_id))
    const geminiCategories = new Set(geminiResult.content_warnings.map((w: any) => w.category_id))

    console.log('\n🏷️  Categories Found:')
    console.log(`   GPT-4o: ${Array.from(gpt4oCategories).join(', ') || 'None'}`)
    console.log(`   Gemini: ${Array.from(geminiCategories).join(', ') || 'None'}`)

    const commonCategories = Array.from(gpt4oCategories).filter(c => geminiCategories.has(c))
    const onlyGpt4o = Array.from(gpt4oCategories).filter(c => !geminiCategories.has(c))
    const onlyGemini = Array.from(geminiCategories).filter(c => !gpt4oCategories.has(c))

    console.log('\n🔍 Category Overlap:')
    console.log(`   Common: ${commonCategories.length} (${commonCategories.join(', ') || 'None'})`)
    console.log(`   Only GPT-4o: ${onlyGpt4o.length} (${onlyGpt4o.join(', ') || 'None'})`)
    console.log(`   Only Gemini: ${onlyGemini.length} (${onlyGemini.join(', ') || 'None'})`)

    console.log('\n💭 Reasoning:')
    console.log(`\n   GPT-4o:\n   ${gpt4oResult.reasoning?.substring(0, 300) || 'N/A'}...`)
    console.log(`\n   Gemini:\n   ${geminiResult.reasoning?.substring(0, 300) || 'N/A'}...`)

    console.log('\n📋 Detailed Warnings:')
    console.log('\n   GPT-4o Warnings:')
    gpt4oResult.content_warnings.forEach((w: any, i: number) => {
      console.log(`   ${i + 1}. [${w.category_id}] ${w.description} (${w.severity}, score: ${w.score?.toFixed(2) || 'N/A'})`)
    })

    console.log('\n   Gemini Warnings:')
    geminiResult.content_warnings.forEach((w: any, i: number) => {
      console.log(`   ${i + 1}. [${w.category_id}] ${w.description} (${w.severity}, score: ${w.score?.toFixed(2) || 'N/A'})`)
    })
  } else {
    console.log('\n⚠️  One or both models failed. Cannot compare.')
  }

  console.log('\n' + '='.repeat(60))
}

// Main
const isbn = process.argv[2]
if (!isbn) {
  console.error('Usage: npx tsx scripts/compare-models.ts <ISBN>')
  process.exit(1)
}

compareModels(isbn).catch(console.error)

