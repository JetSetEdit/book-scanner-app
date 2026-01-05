#!/usr/bin/env tsx
import 'dotenv/config'
import { analyzeBookWithMultiModel } from '../lib/services/multi-model-analysis'

async function testGingerbreadWithContext() {
  console.log('🧪 Testing "The Gingerbread Bakery" with enhanced context\n')
  console.log('='.repeat(60))

  // Simulate what web search might find
  const enhancedDescription = `From the international bestselling author of The Pumpkin Spice Cafe and The Cinnamon Bun Book Store, comes the highly anticipated Dream Harbor romance for 2025! 'A charming break from reality' Publishers Weekly 🍪🎄❤️

Additional context: This is a small-town Christmas romance featuring an enemies-to-lovers dynamic. The story involves relationship tension, conflict between characters who start as adversaries, and the emotional stress of navigating a romantic relationship that begins with animosity.`

  console.log('\n📄 Enhanced Description:')
  console.log(enhancedDescription)
  console.log('\n' + '='.repeat(60))
  console.log('\n🔍 Analyzing for content warnings...\n')

  const metadata = {
    title: 'The Gingerbread Bakery',
    author: 'Laurie Gilmore',
    isbn: '9780008728090',
    description: enhancedDescription
  }

  const result = await analyzeBookWithMultiModel(metadata, (msg) => {
    console.log(`  ${msg}`)
  })

  console.log('\n' + '='.repeat(60))
  console.log(`\n✅ Analysis complete: ${result.warnings.length} warning(s) found\n`)

  if (result.warnings.length === 0) {
    console.log('❌ NO WARNINGS FOUND')
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

  console.log('\n' + '='.repeat(60))
}

testGingerbreadWithContext().catch(console.error)

