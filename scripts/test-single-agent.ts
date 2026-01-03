import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

import { generateContentWarnings } from '../lib/content-warning-agent'
import { fetchCandidatesByISBN } from '../lib/book-api'

const TEST_ISBN = '9780593440872'

async function testAgent(mode: 'old' | 'new' | 'hybrid') {
  console.log(`\n🧪 Testing ${mode.toUpperCase()} Agent\n`)
  
  const candidates = await fetchCandidatesByISBN(TEST_ISBN)
  const workflow = {
    book_title: candidates[0].title,
    book_author: candidates[0].author,
    book_description: candidates[0].description || '',
    book_categories: candidates[0].categories || [],
    book_isbn: TEST_ISBN
  }
  
  const start = Date.now()
  const result = await generateContentWarnings(workflow, 'gpt-4o', mode)
  const time = Date.now() - start
  
  console.log(`⏱️  Time: ${time}ms (${(time/1000).toFixed(2)}s)`)
  console.log(`📊 Warnings: ${result.content_warnings?.length || 0}`)
  console.log(`🎯 Confidence: ${result.confidence}`)
  console.log(`\n💭 Reasoning:\n${result.reasoning}\n`)
  
  if (result.content_warnings && result.content_warnings.length > 0) {
    console.log('📋 Warnings Found:')
    result.content_warnings.forEach((w, i) => {
      console.log(`\n${i+1}. ${w.category_id}${w.subcategory_id ? '.' + w.subcategory_id : ''}`)
      console.log(`   Description: ${w.description}`)
      console.log(`   Score: ${w.score.toFixed(2)} | Severity: ${w.severity}`)
      console.log(`   Reasoning: ${w.reasoning?.substring(0, 150)}...`)
    })
  }
  
  return result
}

async function main() {
  console.log('='.repeat(60))
  console.log('Testing Agents for "Book Lovers" by Emily Henry')
  console.log('='.repeat(60))
  
  await testAgent('old')
  
  console.log('\n' + '='.repeat(60))
  console.log('Waiting 30 seconds before next test...')
  await new Promise(r => setTimeout(r, 30000))
  
  await testAgent('new')
}

main().catch(console.error)

