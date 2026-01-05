#!/usr/bin/env tsx
import 'dotenv/config'
import { analyzeBookWithMultiModel } from '../lib/services/multi-model-analysis'
import { BookMetadata } from '../lib/config/taxonomy-context'
import { fetchBookByISBN } from '../lib/book-api'

async function testHappyPlaceReal() {
  console.log('🧪 Testing "Happy Place" with REAL Description from API\n')
  console.log('='.repeat(60))

  // Fetch the actual description from Google Books API
  const isbn = '9780241995365'
  console.log(`\n📥 Fetching book data for ISBN: ${isbn}...`)
  const bookData = await fetchBookByISBN(isbn)

  if (!bookData || !bookData.description) {
    console.error('❌ Could not fetch book data or description')
    return
  }

  console.log(`\n📖 Source: ${bookData.source || 'unknown'}`)
  console.log(`📏 Description length: ${bookData.description.length} characters`)
  console.log('\n📄 Full Description:')
  console.log(bookData.description)
  console.log('\n' + '='.repeat(60))

  const metadata: BookMetadata = {
    isbn: bookData.isbn,
    title: bookData.title,
    author: bookData.author || 'Unknown',
    description: bookData.description,
    categories: bookData.categories || []
  }

  console.log('\n🔍 Analyzing for content warnings...\n')
  const result = await analyzeBookWithMultiModel(
    metadata,
    (message) => console.log(`  ${message}`)
  )

  console.log('\n' + '='.repeat(60))
  console.log(`\n✅ Analysis complete: ${result.warnings.length} warning(s) found\n`)

  if (result.warnings.length > 0) {
    console.log('📋 Warnings:\n')
    result.warnings.forEach((w, i) => {
      console.log(`${i + 1}. ${w.subcategory_id}`)
      console.log(`   Description: ${w.description}`)
      console.log(`   Severity: ${w.severity}`)
      console.log(`   Reasoning: ${w.reasoning?.substring(0, 200)}...`)
      console.log('')
    })

    // Check for mental health warnings
    const mentalHealthWarnings = result.warnings.filter(w => 
      w.subcategory_id?.includes('mental_health') || 
      w.description?.toLowerCase().includes('grief') ||
      w.description?.toLowerCase().includes('anxiety') ||
      w.description?.toLowerCase().includes('panic') ||
      w.description?.toLowerCase().includes('depression') ||
      w.description?.toLowerCase().includes('burnout')
    )

    if (mentalHealthWarnings.length > 0) {
      console.log('✅ SUCCESS: Mental health themes detected!')
      console.log(`   Found ${mentalHealthWarnings.length} mental health-related warning(s)`)
    } else {
      console.log('⚠️  No mental health warnings found')
      console.log('   This may indicate the description is too sanitized/vague')
    }
  } else {
    console.log('❌ NO WARNINGS FOUND')
    console.log('\nAI Reasoning:', result.noWarningsReasoning)
    console.log('\n⚠️  EXPECTED RESULT: Description is likely too sanitized/vague')
    console.log('   This confirms that prompt engineering alone cannot fix data insufficiency.')
    console.log('   Solution: Need to implement "Web Search Enrichment" step.')
  }

  console.log('\n' + '='.repeat(60))
}

testHappyPlaceReal().catch(console.error)

