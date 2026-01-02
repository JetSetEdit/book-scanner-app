#!/usr/bin/env tsx
/**
 * Dataset Calibration Test (Dry Run)
 * 
 * Tests dataset conversion with a small sample to validate:
 * - Taxonomy mapping accuracy
 * - Book-description synthesis quality
 * - Category appropriateness
 * - Edge case handling
 * 
 * Usage: tsx scripts/test-dataset-calibration.ts
 */

import 'dotenv/config'
import * as fs from 'fs/promises'
import * as path from 'path'

// Sample data that mimics what we'd get from moderation datasets
// This simulates the structure we'd see from real datasets
const SAMPLE_DATASET = [
  {
    text: "You're an idiot and should go die",
    is_toxic: true,
    severity: 'high'
  },
  {
    text: "I disagree with your opinion on this topic",
    is_toxic: false,
    severity: 'low'
  },
  {
    text: "This is complete garbage and you're a moron",
    is_toxic: true,
    severity: 'high'
  },
  {
    text: "That's a really interesting perspective, thanks for sharing",
    is_toxic: false,
    severity: 'low'
  },
  {
    text: "People like you are the problem with society",
    is_toxic: true,
    severity: 'medium'
  },
  {
    text: "I understand your point but I see it differently",
    is_toxic: false,
    severity: 'low'
  },
  {
    text: "You're a worthless piece of trash",
    is_toxic: true,
    severity: 'high'
  },
  {
    text: "This discussion has been very enlightening",
    is_toxic: false,
    severity: 'low'
  }
]

interface ConversionResult {
  original: any
  converted: {
    book_title: string
    book_author: string
    book_description: string
    expected_warnings: Array<{
      category: string
      subcategory?: string
      severity: 'mild' | 'moderate' | 'severe'
      description: string
    }>
    source_dataset: string
    original_text: string
    notes: string
  }
  issues: string[]
  quality_score: number // 0-1, how well it converts
}

function synthesizeBookDescription(text: string, isToxic: boolean): string {
  // Convert social media comment to book-like description
  // This is the key challenge - making it feel like a book, not a tweet
  
  if (!isToxic) {
    // Non-toxic comments become neutral book descriptions
    return `A book exploring themes of communication and dialogue. The narrative includes discussions about differing perspectives and respectful discourse.`
  }

  // Toxic comments need careful conversion
  // Strategy: Extract the pattern, not the specific words
  
  const lowerText = text.toLowerCase()
  
  // Pattern detection
  if (lowerText.includes('die') || lowerText.includes('kill')) {
    return `A book containing themes of violence and threats. The narrative includes language that suggests harm or death threats.`
  }
  
  if (lowerText.includes('idiot') || lowerText.includes('moron') || lowerText.includes('stupid')) {
    return `A book containing strong language and insults. The narrative includes derogatory language directed at individuals.`
  }
  
  if (lowerText.includes('worthless') || lowerText.includes('trash') || lowerText.includes('garbage')) {
    return `A book containing themes of dehumanization and strong language. The narrative includes language that demeans or devalues individuals.`
  }
  
  if (lowerText.includes('problem') && lowerText.includes('society')) {
    return `A book exploring themes of social conflict and blame. The narrative includes language that attributes societal problems to groups or individuals.`
  }
  
  // Fallback
  return `A book containing strong language and potentially offensive content. The narrative includes language that may be considered toxic or harmful.`
}

function mapToOurTaxonomy(text: string, isToxic: boolean, severity: string): ConversionResult['converted']['expected_warnings'] {
  if (!isToxic) {
    return [] // No warnings for non-toxic content
  }

  const lowerText = text.toLowerCase()
  const warnings: ConversionResult['converted']['expected_warnings'] = []

  // Map based on content patterns
  if (lowerText.includes('die') || lowerText.includes('kill') || lowerText.includes('death')) {
    warnings.push({
      category: 'violence',
      subcategory: 'threats',
      severity: severity === 'high' ? 'severe' : 'moderate',
      description: 'Strong language containing threats of violence or harm'
    })
  }

  if (lowerText.includes('idiot') || lowerText.includes('moron') || lowerText.includes('stupid') || 
      lowerText.includes('worthless') || lowerText.includes('trash')) {
    warnings.push({
      category: 'language',
      subcategory: 'strong_language',
      severity: severity === 'high' ? 'severe' : 'moderate',
      description: 'Strong language and insults'
    })
  }

  if (lowerText.includes('problem') && (lowerText.includes('society') || lowerText.includes('people'))) {
    warnings.push({
      category: 'discrimination',
      subcategory: 'other',
      severity: 'moderate',
      description: 'Themes of blame and social conflict'
    })
  }

  // If no specific pattern matched but it's toxic, default to language
  if (warnings.length === 0 && isToxic) {
    warnings.push({
      category: 'language',
      subcategory: 'strong_language',
      severity: 'moderate',
      description: 'Strong or offensive language'
    })
  }

  return warnings
}

function assessQuality(original: any, converted: ConversionResult['converted']): { score: number; issues: string[] } {
  const issues: string[] = []
  let score = 1.0

  // Check 1: Does description feel like a book?
  if (converted.book_description.includes('tweet') || 
      converted.book_description.includes('comment') ||
      converted.book_description.length < 50) {
    issues.push('Description feels too social-media-like or too short')
    score -= 0.3
  }

  // Check 2: Are warnings appropriate?
  if (converted.expected_warnings.length === 0 && original.is_toxic) {
    issues.push('Toxic content produced no warnings')
    score -= 0.5
  }

  if (converted.expected_warnings.length > 2) {
    issues.push('Too many warnings for single example')
    score -= 0.2
  }

  // Check 3: Severity mapping
  const highSeverityWarnings = converted.expected_warnings.filter(w => w.severity === 'severe')
  if (original.severity === 'high' && highSeverityWarnings.length === 0) {
    issues.push('High severity content not mapped to severe warnings')
    score -= 0.2
  }

  // Check 4: Category appropriateness
  const hasViolence = converted.expected_warnings.some(w => w.category === 'violence')
  const hasThreats = original.text.toLowerCase().includes('die') || original.text.toLowerCase().includes('kill')
  if (hasThreats && !hasViolence) {
    issues.push('Threats not mapped to violence category')
    score -= 0.3
  }

  return { score: Math.max(0, score), issues }
}

async function runCalibrationTest() {
  console.log('🧪 Dataset Calibration Test (Dry Run)\n')
  console.log('─'.repeat(70))
  console.log('\n📋 Testing with sample dataset (8 examples)')
  console.log('   This simulates what we\'d get from real moderation datasets\n')

  const results: ConversionResult[] = []

  for (const item of SAMPLE_DATASET) {
    const bookDescription = synthesizeBookDescription(item.text, item.is_toxic)
    const warnings = mapToOurTaxonomy(item.text, item.is_toxic, item.severity)

    const converted = {
      book_title: `[Dataset Example] Sample ${results.length + 1}`,
      book_author: 'Various',
      book_description: bookDescription,
      expected_warnings: warnings,
      source_dataset: 'surge-toxicity-sample',
      original_text: item.text,
      notes: `Converted from toxicity dataset sample. Original severity: ${item.severity}`
    }

    const { score, issues } = assessQuality(item, converted)

    results.push({
      original: item,
      converted,
      issues,
      quality_score: score
    })
  }

  // Display results
  console.log('📊 CONVERSION RESULTS\n')
  console.log('─'.repeat(70))

  results.forEach((result, idx) => {
    console.log(`\n${idx + 1}. Original: "${result.original.text}"`)
    console.log(`   Toxic: ${result.original.is_toxic}, Severity: ${result.original.severity}`)
    console.log(`\n   Converted Description:`)
    console.log(`   "${result.converted.book_description}"`)
    console.log(`\n   Warnings (${result.converted.expected_warnings.length}):`)
    result.converted.expected_warnings.forEach(w => {
      console.log(`     - ${w.category}${w.subcategory ? `.${w.subcategory}` : ''} (${w.severity})`)
      console.log(`       ${w.description}`)
    })
    console.log(`\n   Quality Score: ${(result.quality_score * 100).toFixed(0)}%`)
    if (result.issues.length > 0) {
      console.log(`   Issues:`)
      result.issues.forEach(issue => console.log(`     ⚠️  ${issue}`))
    } else {
      console.log(`   ✅ No issues detected`)
    }
  })

  // Summary
  console.log('\n' + '─'.repeat(70))
  console.log('\n📈 SUMMARY\n')
  
  const avgScore = results.reduce((sum, r) => sum + r.quality_score, 0) / results.length
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0)
  const toxicCount = results.filter(r => r.original.is_toxic).length
  const nonToxicCount = results.filter(r => !r.original.is_toxic).length

  console.log(`Average Quality Score: ${(avgScore * 100).toFixed(1)}%`)
  console.log(`Total Issues Found: ${totalIssues}`)
  console.log(`Toxic Examples: ${toxicCount}`)
  console.log(`Non-Toxic Examples: ${nonToxicCount}`)
  console.log(`Examples with Warnings: ${results.filter(r => r.converted.expected_warnings.length > 0).length}`)

  // Category distribution
  const categoryCounts: Record<string, number> = {}
  results.forEach(r => {
    r.converted.expected_warnings.forEach(w => {
      categoryCounts[w.category] = (categoryCounts[w.category] || 0) + 1
    })
  })
  
  console.log(`\nCategory Distribution:`)
  Object.entries(categoryCounts).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count}`)
  })

  // Keep/Toss/Tune Analysis
  console.log('\n' + '─'.repeat(70))
  console.log('\n🎯 KEEP/TOSS/TUNE ANALYSIS\n')

  const keep: ConversionResult[] = []
  const toss: ConversionResult[] = []
  const tune: ConversionResult[] = []

  results.forEach(r => {
    if (r.quality_score >= 0.8 && r.issues.length === 0) {
      keep.push(r)
    } else if (r.quality_score < 0.5 || r.issues.some(i => i.includes('no warnings') || i.includes('not mapped'))) {
      toss.push(r)
    } else {
      tune.push(r)
    }
  })

  console.log(`✅ KEEP (${keep.length}): High quality, ready to use`)
  keep.forEach((r, idx) => {
    console.log(`   ${idx + 1}. "${r.original.text.substring(0, 50)}..." → ${r.converted.expected_warnings.length} warning(s)`)
  })

  console.log(`\n⚠️  TUNE (${tune.length}): Needs adjustment`)
  tune.forEach((r, idx) => {
    console.log(`   ${idx + 1}. "${r.original.text.substring(0, 50)}..."`)
    console.log(`      Issues: ${r.issues.join(', ')}`)
  })

  console.log(`\n❌ TOSS (${toss.length}): Not suitable`)
  toss.forEach((r, idx) => {
    console.log(`   ${idx + 1}. "${r.original.text.substring(0, 50)}..."`)
    console.log(`      Reason: ${r.issues.join(', ')}`)
  })

  // Save results
  const outputDir = path.join(process.cwd(), 'data', 'datasets', 'calibration-test')
  await fs.mkdir(outputDir, { recursive: true })
  
  await fs.writeFile(
    path.join(outputDir, 'results.json'),
    JSON.stringify({ results, summary: { avgScore, totalIssues, keep: keep.length, tune: tune.length, toss: toss.length } }, null, 2)
  )

  console.log(`\n💾 Results saved to: ${path.join(outputDir, 'results.json')}`)

  // Recommendations
  console.log('\n' + '─'.repeat(70))
  console.log('\n💡 RECOMMENDATIONS\n')

  if (avgScore < 0.7) {
    console.log('⚠️  Average quality score is below 70%. Consider:')
    console.log('   - Improving book description synthesis')
    console.log('   - Refining taxonomy mapping')
    console.log('   - Adding more pattern detection')
  }

  if (tune.length > keep.length) {
    console.log('⚠️  More examples need tuning than are ready. Consider:')
    console.log('   - Reviewing synthesis patterns')
    console.log('   - Adjusting severity mapping')
    console.log('   - Adding context detection')
  }

  if (toss.length > 0) {
    console.log(`⚠️  ${toss.length} examples should be excluded. Reasons:`)
    const reasons = new Set<string>()
    toss.forEach(r => r.issues.forEach(i => reasons.add(i)))
    reasons.forEach(r => console.log(`   - ${r}`))
  }

  console.log('\n✅ Calibration test complete!')
  console.log('\nNext steps:')
  console.log('   1. Review keep/tune/toss classifications')
  console.log('   2. Refine synthesis and mapping functions')
  console.log('   3. Test with larger sample')
  console.log('   4. Create inclusion rubric based on findings')
}

runCalibrationTest().catch(console.error)

