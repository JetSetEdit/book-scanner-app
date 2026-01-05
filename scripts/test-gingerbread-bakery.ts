#!/usr/bin/env tsx
import 'dotenv/config'
import { analyzeBookWithMultiModel } from '../lib/services/multi-model-analysis'
import { fetchBookByISBN } from '../lib/book-api'

async function testGingerbreadBakery() {
  console.log('🧪 Testing "The Gingerbread Bakery" by Laurie Gilmore\n')
  console.log('='.repeat(60))

  const isbn = '9780008728090'
  
  // Fetch full description
  console.log('\n📖 Fetching book data from Google Books...')
  const bookData = await fetchBookByISBN(isbn)
  
  if (!bookData) {
    console.error('❌ Could not fetch book data')
    return
  }

  console.log(`\n📖 Book: ${bookData.title} by ${bookData.author}`)
  console.log(`📝 Description length: ${bookData.description?.length || 0} chars`)
  console.log(`\n📄 Full Description:`)
  console.log(bookData.description || 'No description available')
  console.log('\n' + '='.repeat(60))
  console.log('\n🔍 Analyzing for content warnings...\n')

  const metadata = {
    title: bookData.title || 'The Gingerbread Bakery',
    author: bookData.author || 'Laurie Gilmore',
    isbn: isbn,
    description: bookData.description || ''
  }

  const result = await analyzeBookWithMultiModel(metadata, (msg) => {
    console.log(`  ${msg}`)
  })

  console.log('\n' + '='.repeat(60))
  console.log(`\n✅ Analysis complete: ${result.warnings.length} warning(s) found\n`)

  if (result.warnings.length === 0) {
    console.log('❌ NO WARNINGS FOUND - This is the problem!')
    if (result.noWarningsReasoning) {
      console.log(`\nAI Reasoning: ${result.noWarningsReasoning}`)
    }
  } else {
    console.log('📋 Warnings:')
    result.warnings.forEach((w, i) => {
      console.log(`\n${i + 1}. ${w.subcategory_id}`)
      console.log(`   Description: ${w.description}`)
      console.log(`   Severity: ${w.severity}`)
      console.log(`   Reasoning: ${w.reasoning?.substring(0, 200)}...`)
    })
  }

  // Check for expected warnings
  const expectedPatterns = [
    'enemies',
    'tension',
    'relationship',
    'emotional',
    'family_dynamics',
    'deception',
    'romance'
  ]

  const foundPatterns = result.warnings.some(w => 
    expectedPatterns.some(pattern => 
      w.subcategory_id?.toLowerCase().includes(pattern) ||
      w.description?.toLowerCase().includes(pattern) ||
      w.reasoning?.toLowerCase().includes(pattern)
    )
  )

  if (result.warnings.length > 0 && foundPatterns) {
    console.log('\n✅ SUCCESS: Found relationship/emotional warnings!')
  } else if (result.warnings.length === 0) {
    console.log('\n❌ FAILED: No warnings found despite enemies-to-lovers/relationship tension themes')
  } else {
    console.log('\n⚠️  WARNINGS FOUND but may not match expected patterns')
  }

  console.log('\n' + '='.repeat(60))
}

testGingerbreadBakery().catch(console.error)

