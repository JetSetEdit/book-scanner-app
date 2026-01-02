#!/usr/bin/env tsx
/**
 * Show API Response in Plain Language
 */

import 'dotenv/config'
import { analyzeBookWithMultiModel } from '../lib/services/multi-model-analysis'

const testMetadata = {
  title: "Gone Girl",
  author: "Gillian Flynn",
  isbn: "9780307588371",
  description: `On a warm summer morning in North Carthage, Missouri, it is Nick and Amy Dunne's fifth wedding anniversary. Presents are being wrapped and reservations are being made when Nick's clever and beautiful wife disappears. Husband-of-the-Year Nick isn't doing himself any favors with cringe-worthy daydreams about the slope and shape of his wife's head, but passages from Amy's diary reveal the alpha-girl perfectionist could have put anyone dangerously on edge. Under mounting pressure from the police and the media—as well as Amy's fiercely doting parents—the town golden boy parades an endless series of lies, deceits, and inappropriate behavior. Nick is oddly evasive, and he's definitely bitter—but is he really a killer?`
}

async function showResponse() {
  console.log('\n📚 Testing: "Gone Girl" by Gillian Flynn\n')
  console.log('─'.repeat(60))

  const result = await analyzeBookWithMultiModel(testMetadata, (msg) => {
    // Suppress progress messages for cleaner output
  })

  console.log('\n📋 CONTENT WARNINGS FOUND:\n')

  if (result.warnings.length === 0) {
    console.log('❌ No warnings detected')
  } else {
    result.warnings.forEach((w, i) => {
      const severityEmoji = w.severity === 'severe' ? '🔴' : w.severity === 'moderate' ? '🟡' : '🟢'
      console.log(`${i + 1}. ${severityEmoji} ${w.severity.toUpperCase()}: ${w.subcategory_id}`)
      console.log(`   ${w.description || 'No description provided'}`)
      console.log('')
    })
  }

  console.log('─'.repeat(60))
  console.log(`\nTotal: ${result.warnings.length} warning(s)`)
  console.log(`Agreement: ${(result.analysis.agreement_score * 100).toFixed(0)}%`)
  console.log(`OpenAI found: ${result.model_results.openai.length} warning(s)`)
  console.log(`Gemini found: ${result.model_results.gemini.length} warning(s)`)

  // Check specifically for kidnapping
  const kidnapping = result.warnings.find(w => 
    w.subcategory_id?.includes('kidnapping') || 
    w.subcategory_id?.includes('confinement')
  )

  if (kidnapping) {
    console.log(`\n✅ KIDNAPPING DETECTED: ${kidnapping.severity.toUpperCase()}`)
  } else {
    console.log(`\n❌ KIDNAPPING NOT FOUND in final warnings`)
    
    // Check raw warnings
    const rawKidnapping = [
      ...result.model_results.openai,
      ...result.model_results.gemini
    ].find(w => 
      w.subcategory_id?.includes('kidnapping') || 
      w.subcategory_id?.includes('confinement')
    )
    
    if (rawKidnapping) {
      console.log(`   ⚠️  But was detected in raw analysis as: ${rawKidnapping.severity}`)
      console.log(`   ⚠️  It was dropped during verification`)
    }
  }

  console.log('')
}

showResponse().catch(console.error)

