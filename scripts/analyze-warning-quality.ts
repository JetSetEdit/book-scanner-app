/**
 * Analyze Warning Quality
 * 
 * Compares the quality of warnings between old and new patterns
 */

import dotenv from 'dotenv'
import { findBookAndGenerateWarnings } from '../lib/content-warning-agent'
import { findBookAndGenerateWarningsV2 } from '../lib/content-warning-agent-v2'

dotenv.config({ path: '.env.local' })
dotenv.config()

const TEST_BOOKS = [
  { title: "It Ends With Us", author: "Colleen Hoover", isbn: "9781501110375" },
  { title: "The Seven Husbands of Evelyn Hugo", author: "Taylor Jenkins Reid", isbn: "9781501139239" },
]

interface WarningQuality {
  category: string
  subcategory: string | null
  description: string
  score: number
  reasoning: string
  hasSubcategory: boolean
  hasSource: boolean
  reasoningLength: number
  descriptionLength: number
}

function analyzeWarningQuality(warnings: any[]): {
  total: number
  withSubcategory: number
  withSource: number
  avgScore: number
  avgReasoningLength: number
  avgDescriptionLength: number
  details: WarningQuality[]
} {
  const details: WarningQuality[] = warnings.map(w => ({
    category: w.category_id,
    subcategory: w.subcategory_id,
    description: w.description || '',
    score: w.score,
    reasoning: w.reasoning || '',
    hasSubcategory: !!w.subcategory_id,
    hasSource: !!w.source_url,
    reasoningLength: (w.reasoning || '').length,
    descriptionLength: (w.description || '').length,
  }))

  return {
    total: warnings.length,
    withSubcategory: details.filter(w => w.hasSubcategory).length,
    withSource: details.filter(w => w.hasSource).length,
    avgScore: details.reduce((sum, w) => sum + w.score, 0) / details.length || 0,
    avgReasoningLength: details.reduce((sum, w) => sum + w.reasoningLength, 0) / details.length || 0,
    avgDescriptionLength: details.reduce((sum, w) => sum + w.descriptionLength, 0) / details.length || 0,
    details,
  }
}

async function compareQuality(isbn: string, title: string) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`Quality Analysis: ${title}`)
  console.log('='.repeat(80))

  // Suppress console logs during execution
  const originalLog = console.log
  const logs: string[] = []
  console.log = (...args: any[]) => {
    const msg = args.join(' ')
    if (msg.includes('Quality Analysis') || msg.includes('OLD PATTERN') || msg.includes('NEW PATTERN') || msg.includes('QUALITY COMPARISON') || msg.includes('Overall Quality')) {
      originalLog(...args)
    }
    // Capture other logs but don't print
    logs.push(msg)
  }

  // Get results from both patterns
  const oldResult = await findBookAndGenerateWarnings(isbn, 'gpt-4o', 'hybrid')
  await new Promise(resolve => setTimeout(resolve, 2000))
  const newResult = await findBookAndGenerateWarningsV2(isbn, 'gpt-4o', 'hybrid')
  
  // Restore console.log
  console.log = originalLog

  const oldQuality = analyzeWarningQuality(oldResult.content_warnings)
  const newQuality = analyzeWarningQuality(newResult.content_warnings)

  console.log('\n📊 OLD PATTERN WARNINGS:')
  console.log('-'.repeat(80))
  console.log(`Total: ${oldQuality.total}`)
  console.log(`With Subcategory: ${oldQuality.withSubcategory}/${oldQuality.total} (${((oldQuality.withSubcategory/oldQuality.total)*100).toFixed(0)}%)`)
  console.log(`With Source URL: ${oldQuality.withSource}/${oldQuality.total} (${((oldQuality.withSource/oldQuality.total)*100).toFixed(0)}%)`)
  console.log(`Average Score: ${oldQuality.avgScore.toFixed(2)}`)
  console.log(`Avg Reasoning Length: ${oldQuality.avgReasoningLength.toFixed(0)} chars`)
  console.log(`Avg Description Length: ${oldQuality.avgDescriptionLength.toFixed(0)} chars`)
  
  console.log('\n📋 Warning Details:')
  oldQuality.details.forEach((w, i) => {
    console.log(`\n  ${i+1}. ${w.category}${w.subcategory ? '.' + w.subcategory : ''} (score: ${w.score.toFixed(2)})`)
    console.log(`     Description: ${w.description}`)
    console.log(`     Reasoning: ${w.reasoning.substring(0, 150)}${w.reasoning.length > 150 ? '...' : ''}`)
    console.log(`     Has Subcategory: ${w.hasSubcategory ? '✅' : '❌'}`)
    console.log(`     Has Source: ${w.hasSource ? '✅' : '❌'}`)
  })

  console.log('\n📊 NEW PATTERN WARNINGS:')
  console.log('-'.repeat(80))
  console.log(`Total: ${newQuality.total}`)
  console.log(`With Subcategory: ${newQuality.withSubcategory}/${newQuality.total} (${((newQuality.withSubcategory/newQuality.total)*100).toFixed(0)}%)`)
  console.log(`With Source URL: ${newQuality.withSource}/${newQuality.total} (${((newQuality.withSource/newQuality.total)*100).toFixed(0)}%)`)
  console.log(`Average Score: ${newQuality.avgScore.toFixed(2)}`)
  console.log(`Avg Reasoning Length: ${newQuality.avgReasoningLength.toFixed(0)} chars`)
  console.log(`Avg Description Length: ${newQuality.avgDescriptionLength.toFixed(0)} chars`)
  
  console.log('\n📋 Warning Details:')
  newQuality.details.forEach((w, i) => {
    console.log(`\n  ${i+1}. ${w.category}${w.subcategory ? '.' + w.subcategory : ''} (score: ${w.score.toFixed(2)})`)
    console.log(`     Description: ${w.description}`)
    console.log(`     Reasoning: ${w.reasoning.substring(0, 150)}${w.reasoning.length > 150 ? '...' : ''}`)
    console.log(`     Has Subcategory: ${w.hasSubcategory ? '✅' : '❌'}`)
    console.log(`     Has Source: ${w.hasSource ? '✅' : '❌'}`)
  })

  // Comparison
  console.log('\n🔍 QUALITY COMPARISON:')
  console.log('-'.repeat(80))
  console.log(`Subcategory Usage: Old ${oldQuality.withSubcategory}/${oldQuality.total} vs New ${newQuality.withSubcategory}/${newQuality.total}`)
  console.log(`Source URLs: Old ${oldQuality.withSource}/${oldQuality.total} vs New ${newQuality.withSource}/${newQuality.total}`)
  console.log(`Avg Score: Old ${oldQuality.avgScore.toFixed(2)} vs New ${newQuality.avgScore.toFixed(2)}`)
  console.log(`Reasoning Detail: Old ${oldQuality.avgReasoningLength.toFixed(0)} chars vs New ${newQuality.avgReasoningLength.toFixed(0)} chars`)
  console.log(`Description Detail: Old ${oldQuality.avgDescriptionLength.toFixed(0)} chars vs New ${newQuality.avgDescriptionLength.toFixed(0)} chars`)

  // Quality score (simple metric)
  const oldQualityScore = (
    (oldQuality.withSubcategory / oldQuality.total) * 0.3 +
    (oldQuality.withSource / oldQuality.total) * 0.2 +
    (oldQuality.avgReasoningLength / 200) * 0.3 +
    (oldQuality.avgDescriptionLength / 100) * 0.2
  ) * 100

  const newQualityScore = (
    (newQuality.withSubcategory / newQuality.total) * 0.3 +
    (newQuality.withSource / newQuality.total) * 0.2 +
    (newQuality.avgReasoningLength / 200) * 0.3 +
    (newQuality.avgDescriptionLength / 100) * 0.2
  ) * 100

  console.log(`\n📈 Overall Quality Score (0-100):`)
  console.log(`   Old Pattern: ${oldQualityScore.toFixed(1)}`)
  console.log(`   New Pattern: ${newQualityScore.toFixed(1)}`)
  console.log(`   Difference: ${(newQualityScore - oldQualityScore).toFixed(1)} ${newQualityScore > oldQualityScore ? '✅' : '❌'}`)
}

async function run() {
  for (const book of TEST_BOOKS) {
    await compareQuality(book.isbn, book.title)
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
}

run().catch(console.error)

