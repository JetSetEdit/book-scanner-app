#!/usr/bin/env tsx
import 'dotenv/config'
import { analyzeBookWithMultiModel } from '../lib/services/multi-model-analysis'

async function testHappyPlace() {
  console.log('🧪 Testing "Happy Place" by Emily Henry\n')
  console.log('='.repeat(60))

  const metadata = {
    title: 'Happy Place',
    author: 'Emily Henry',
    isbn: '9780241995365',
    description: `Harriet and Wyn are the perfect couple - they go together like bread and butter, gin and tonic, Blake Lively and Ryan Reynolds. Every year, they take a holiday from their lives to drink far too much wine with their favourite people in the world. Except this year, they are lying through their teeth, because Harriet and Wyn broke up six months ago. And they still haven't told anyone. But the cottage is for sale so this is the last time they'll all be here together. They can't bear to break their best friends' hearts so they'll fake it for one more week. But how can you pretend to be in love - and get away with it - in front of the people who know you best?`
  }

  console.log('\n📖 Book Description:')
  console.log(metadata.description)
  console.log('\n' + '='.repeat(60))
  console.log('\n🔍 Analyzing for content warnings...\n')

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
    'deception',
    'lying',
    'secret',
    'breakup',
    'separation',
    'family_dynamics',
    'relationship'
  ]

  const foundPatterns = result.warnings.some(w => 
    expectedPatterns.some(pattern => 
      w.subcategory_id?.toLowerCase().includes(pattern) ||
      w.description?.toLowerCase().includes(pattern) ||
      w.reasoning?.toLowerCase().includes(pattern)
    )
  )

  if (result.warnings.length > 0 && foundPatterns) {
    console.log('\n✅ SUCCESS: Found relationship/deception warnings!')
  } else if (result.warnings.length === 0) {
    console.log('\n❌ FAILED: No warnings found despite deception/lying/breakup themes')
  } else {
    console.log('\n⚠️  WARNINGS FOUND but may not match expected patterns')
  }

  console.log('\n' + '='.repeat(60))
}

testHappyPlace().catch(console.error)

