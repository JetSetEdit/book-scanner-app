#!/usr/bin/env tsx
import 'dotenv/config'
import { analyzeBookWithMultiModel } from '../lib/services/multi-model-analysis'
import { BookMetadata } from '../lib/config/taxonomy-context'

async function testHappyPlaceMentalHealth() {
  console.log('🧪 Testing "Happy Place" for Mental Health Detection\n')
  console.log('='.repeat(60))

  // Real description from Google Books for "Happy Place"
  const description = `A couple who broke up months ago make a pact to pretend to still be together for their annual weeklong vacation with their best friends in this glittering and wise new novel from #1 New York Times bestselling author Emily Henry.

Harriet and Wyn have been the perfect couple since they met in college—they go together like salt and pepper, honey and tea, lobster and rolls. Except, now—for reasons they’re still not discussing—they don’t.

They broke up five months ago. And still haven’t told their best friends.

Which is how they find themselves sharing a bedroom at the Maine cottage that has been their friend group’s yearly getaway for the last decade. Their annual respite from the world, where for one vibrant, blue week they leave behind their daily lives; have copious amounts of cheese, wine, and seafood; and soak up the salty coastal air with the people who understand them most.

Only this year, Harriet and Wyn are lying through their teeth while trying not to notice how desperately they still want each other. Because the cottage is for sale and this is the last week they’ll all have together in this place. They can’t stand to break their friends’ hearts, and so they’ll play their parts. Harriet will be the driven surgical resident who never starts a fight, and Wyn will be the laid-back charmer who never lets the cracks show. It’s a flawless plan (if you look at it from a great distance and through a pair of sunscreen-smeared sunglasses). After years of being in love, how hard can it be to fake it for one week…in front of people who know you better than anyone?

But how can you pretend to be in love—and get away with it—in front of the people who know you best?`

  console.log('📖 Book Description:')
  console.log(description.substring(0, 300) + '...')
  console.log('\n' + '='.repeat(60))

  const metadata: BookMetadata = {
    isbn: '9780241995365',
    title: 'Happy Place',
    author: 'Emily Henry',
    description: description,
    categories: ['Romance', 'Contemporary Romance', 'Fiction']
  }

  console.log('\n🔍 Analyzing for content warnings (focus: mental health themes)...\n')
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
      w.description?.toLowerCase().includes('depression')
    )

    if (mentalHealthWarnings.length > 0) {
      console.log('✅ SUCCESS: Mental health themes detected!')
      console.log(`   Found ${mentalHealthWarnings.length} mental health-related warning(s)`)
    } else {
      console.log('⚠️  No mental health warnings found, but other warnings were detected')
    }

    // Check for relationship/deception warnings
    const relationshipWarnings = result.warnings.filter(w => 
      w.subcategory_id?.includes('deception') || 
      w.subcategory_id?.includes('family_dynamics') ||
      w.subcategory_id?.includes('emotional_abuse')
    )

    if (relationshipWarnings.length > 0) {
      console.log(`\n✅ Relationship/deception warnings: ${relationshipWarnings.length} found`)
    }
  } else {
    console.log('❌ NO WARNINGS FOUND')
    console.log('\nAI Reasoning:', result.noWarningsReasoning)
    console.log('\n❌ FAILED: Should have detected mental health or relationship content')
  }

  console.log('\n' + '='.repeat(60))
}

testHappyPlaceMentalHealth().catch(console.error)

