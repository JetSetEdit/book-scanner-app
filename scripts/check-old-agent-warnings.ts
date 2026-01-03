import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

import { generateContentWarnings } from '../lib/content-warning-agent'
import { fetchCandidatesByISBN } from '../lib/book-api'

const TEST_ISBN = '9780593440872'

async function main() {
  console.log('🔍 Checking what warnings Old Agent found for "Book Lovers"\n')
  console.log('='.repeat(60))
  
  const candidates = await fetchCandidatesByISBN(TEST_ISBN)
  const workflow = {
    book_title: candidates[0].title,
    book_author: candidates[0].author,
    book_description: candidates[0].description || '',
    book_categories: candidates[0].categories || [],
    book_isbn: TEST_ISBN
  }
  
  console.log(`📚 Book: "${workflow.book_title}" by ${workflow.book_author}`)
  console.log(`📝 Description length: ${workflow.book_description.length} chars`)
  console.log(`🏷️  Categories: ${workflow.book_categories.join(', ')}\n`)
  
  console.log('⏳ Running Old Agent (Assumption-Based)...\n')
  const start = Date.now()
  
  const result = await generateContentWarnings(workflow, 'gpt-4o', 'old')
  
  const time = Date.now() - start
  
  console.log('='.repeat(60))
  console.log('📊 RESULTS\n')
  console.log(`⏱️  Time: ${time}ms (${(time/1000).toFixed(2)}s)`)
  console.log(`📊 Warnings Found: ${result.content_warnings?.length || 0}`)
  console.log(`🎯 Confidence: ${result.confidence}`)
  console.log(`📋 Classification Rating: ${result.classification_rating || 'N/A'}\n`)
  
  if (result.content_warnings && result.content_warnings.length > 0) {
    console.log('⚠️  WARNINGS DETAILS:\n')
    result.content_warnings.forEach((w, i) => {
      console.log(`${i+1}. ${w.category_id}${w.subcategory_id ? '.' + w.subcategory_id : ''}`)
      console.log(`   📝 Description: ${w.description}`)
      console.log(`   📊 Score: ${w.score.toFixed(2)} (Severity: ${w.severity})`)
      console.log(`   📍 Presence: ${w.presence || 'on_page'}`)
      console.log(`   📄 Detail Level: ${w.detail_level || 'N/A'}`)
      console.log(`   💭 Reasoning: ${w.reasoning || 'N/A'}`)
      if (w.is_author_verified) {
        console.log(`   ✅ Author Verified: ${w.is_author_verified}`)
      }
      if (w.source_url) {
        console.log(`   🔗 Source: ${w.source_url}`)
      }
      console.log()
    })
  } else {
    console.log('ℹ️  No warnings found')
  }
  
  console.log('='.repeat(60))
  console.log('\n💭 Overall Reasoning:')
  console.log(result.reasoning || 'No reasoning provided')
  console.log()
}

main().catch(console.error)

