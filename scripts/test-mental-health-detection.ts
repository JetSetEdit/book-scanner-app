#!/usr/bin/env tsx
import 'dotenv/config'
import { analyzeBookWithMultiModel } from '../lib/services/multi-model-analysis'
import { BookMetadata } from '../lib/config/taxonomy-context'

async function testMentalHealthDetection() {
  console.log('🧪 Testing Mental Health Detection with Explicit Themes\n')
  console.log('='.repeat(60))

  // Description that explicitly mentions mental health themes
  const descriptionWithMentalHealth = `A couple who broke up months ago make a pact to pretend to still be together for their annual weeklong vacation with their best friends. 

Harriet is struggling to navigate life after her father's death, prone to panic attacks, and dealing with anxiety and depression. She's been feeling overwhelmed and burned out from her surgical residency, struggling to breathe and cope with the emotional weight of her loss. The darkness and numbness she's been experiencing make it hard to function, even as she tries to maintain appearances in front of her friends.

Wyn has been her anchor, but their relationship fell apart when she couldn't communicate her grief and anxiety. Now they're both pretending everything is fine, hiding their pain from the people who know them best.`

  console.log('📖 Description with explicit mental health themes:')
  console.log(descriptionWithMentalHealth)
  console.log('\n' + '='.repeat(60))

  const metadata: BookMetadata = {
    isbn: '9780241995365',
    title: 'Happy Place',
    author: 'Emily Henry',
    description: descriptionWithMentalHealth,
    categories: ['Romance', 'Contemporary Romance']
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
      console.log(`   Found ${mentalHealthWarnings.length} mental health-related warning(s):`)
      mentalHealthWarnings.forEach(w => {
        console.log(`   - ${w.subcategory_id}: ${w.description}`)
      })
    } else {
      console.log('❌ FAILED: No mental health warnings found despite explicit mentions')
      console.log('   Expected: grief, panic attacks, anxiety, depression, burnout')
    }
  } else {
    console.log('❌ NO WARNINGS FOUND')
    console.log('\nAI Reasoning:', result.noWarningsReasoning)
    console.log('\n❌ FAILED: Should have detected mental health content')
  }

  console.log('\n' + '='.repeat(60))
}

testMentalHealthDetection().catch(console.error)

