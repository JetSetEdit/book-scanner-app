#!/usr/bin/env tsx
import 'dotenv/config'
import { analyzeBookWithMultiModel } from '../lib/services/multi-model-analysis'

async function testGingerbreadRetailerDesc() {
  console.log('🧪 Testing "The Gingerbread Bakery" with retailer description\n')
  console.log('='.repeat(60))

  // Using the actual retailer description from QBD
  const retailerDescription = `From the international bestselling author of The Pumpkin Spice Cafe and The Cinnamon Bun Book Store, comes the highly anticipated Dream Harbor romance for 2025! 'A charming break from reality' Publishers Weekly 🍪🎄❤️

The Gingerbread Bakery is a cozy romantic novel with an enemies to lovers dynamic, small-town setting and a HEA guaranteed!`

  console.log('\n📄 Retailer Description (from QBD):')
  console.log(retailerDescription)
  console.log('\n' + '='.repeat(60))
  console.log('\n🔍 Analyzing for content warnings...\n')

  const metadata = {
    title: 'The Gingerbread Bakery',
    author: 'Laurie Gilmore',
    isbn: '9780008728090',
    description: retailerDescription
  }

  const result = await analyzeBookWithMultiModel(metadata, (msg) => {
    console.log(`  ${msg}`)
  })

  console.log('\n' + '='.repeat(60))
  console.log(`\n✅ Analysis complete: ${result.warnings.length} warning(s) found\n`)

  if (result.warnings.length === 0) {
    console.log('❌ NO WARNINGS FOUND - This is still a problem!')
    if (result.noWarningsReasoning) {
      console.log(`\nAI Reasoning: ${result.noWarningsReasoning}`)
    }
  } else {
    console.log('📋 Warnings:')
    result.warnings.forEach((w, i) => {
      console.log(`\n${i + 1}. ${w.subcategory_id}`)
      console.log(`   Description: ${w.description}`)
      console.log(`   Severity: ${w.severity}`)
      console.log(`   Reasoning: ${w.reasoning?.substring(0, 250)}...`)
    })
  }

  // Check specifically for enemies-to-lovers
  const hasEnemiesToLovers = result.warnings.some(w => 
    w.subcategory_id?.includes('toxic') ||
    w.subcategory_id?.includes('family') ||
    w.description?.toLowerCase().includes('enemies') ||
    w.description?.toLowerCase().includes('conflict') ||
    w.reasoning?.toLowerCase().includes('enemies')
  )

  if (hasEnemiesToLovers) {
    console.log('\n✅ SUCCESS: Found enemies-to-lovers/relationship conflict warning!')
  } else if (result.warnings.length === 0) {
    console.log('\n❌ FAILED: No warnings found despite explicit "enemies to lovers dynamic" in description')
  } else {
    console.log('\n⚠️  WARNINGS FOUND but may not specifically mention enemies-to-lovers')
  }

  console.log('\n' + '='.repeat(60))
}

testGingerbreadRetailerDesc().catch(console.error)

