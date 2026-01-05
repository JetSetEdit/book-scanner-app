#!/usr/bin/env tsx
import 'dotenv/config'
import { analyzeBookWithMultiModel } from '../lib/services/multi-model-analysis'
import { BookMetadata } from '../lib/config/taxonomy-context'

async function testGingerbreadAnalysis() {
  console.log('🧪 Testing AI Analysis of "The Gingerbread Bakery" Description\n')
  console.log('='.repeat(60))

  // The description currently in the database
  const description = `From the international bestselling author of The Pumpkin Spice Cafe and The Cinnamon Bun Book Store, comes the highly anticipated Dream Harbor romance for 2025! 'A charming break from reality' Publishers Weekly 🍪🎄❤️

The Gingerbread Bakery is a cozy romantic novel with an enemies to lovers dynamic, small-town setting and a HEA guaranteed!`

  console.log('📖 Description being analyzed:')
  console.log(description)
  console.log('\n' + '='.repeat(60))

  const metadata: BookMetadata = {
    isbn: '9780008728090',
    title: 'The Gingerbread Bakery',
    author: 'Laurie Gilmore',
    description: description,
    categories: ['Romance', 'Christmas', 'Small Town']
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
      console.log(`   Reasoning: ${w.reasoning?.substring(0, 150)}...`)
      console.log('')
    })
  } else {
    console.log('❌ NO WARNINGS FOUND')
    console.log('\nAI Reasoning:', result.noWarningsReasoning)
  }

  // Now test with just the short description (without "enemies to lovers")
  console.log('\n' + '='.repeat(60))
  console.log('\n🧪 Testing with SHORT description (Google Books version):\n')
  console.log('='.repeat(60))

  const shortDescription = `From the international bestselling author of The Pumpkin Spice Cafe and The Cinnamon Bun Book Store, comes the highly anticipated Dream Harbor romance for 2025! 'A charming break from reality' Publishers Weekly 🍪🎄❤️`

  console.log('📖 Short description:')
  console.log(shortDescription)
  console.log('\n' + '='.repeat(60))

  const shortMetadata: BookMetadata = {
    isbn: '9780008728090',
    title: 'The Gingerbread Bakery',
    author: 'Laurie Gilmore',
    description: shortDescription,
    categories: ['Romance', 'Christmas', 'Small Town']
  }

  console.log('\n🔍 Analyzing short description...\n')
  const shortResult = await analyzeBookWithMultiModel(
    shortMetadata,
    (message) => console.log(`  ${message}`)
  )

  console.log('\n' + '='.repeat(60))
  console.log(`\n✅ Analysis complete: ${shortResult.warnings.length} warning(s) found\n`)

  if (shortResult.warnings.length > 0) {
    console.log('📋 Warnings from short description:\n')
    shortResult.warnings.forEach((w, i) => {
      console.log(`${i + 1}. ${w.subcategory_id}`)
      console.log(`   Description: ${w.description}`)
      console.log(`   Severity: ${w.severity}`)
      console.log(`   Reasoning: ${w.reasoning?.substring(0, 150)}...`)
      console.log('')
    })
  } else {
    console.log('❌ NO WARNINGS FOUND from short description')
    console.log('\nAI Reasoning:', shortResult.noWarningsReasoning)
  }
}

testGingerbreadAnalysis().catch(console.error)

