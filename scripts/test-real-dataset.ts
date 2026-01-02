#!/usr/bin/env tsx
/**
 * Test with Real Dataset (Dry Run)
 * 
 * Downloads and tests with actual moderation datasets
 * 
 * Usage: 
 *   tsx scripts/test-real-dataset.ts [dataset-name]
 * 
 * Available datasets:
 *   - surge-toxicity (default): Surge AI Toxicity dataset
 *   - goodbooks-10k: goodbooks-10k metadata (CC BY-SA 4.0)
 */

import 'dotenv/config'
import * as fs from 'fs/promises'
import * as path from 'path'
import { getBestMatches } from '../lib/utils/pattern-mapping'

const DATASET_URL = 'https://raw.githubusercontent.com/surge-ai/toxicity/main/toxicity_en.csv'

interface ToxicityRow {
  text: string
  is_toxic: boolean
}

async function downloadAndParseDataset(): Promise<ToxicityRow[]> {
  console.log('📥 Downloading Surge AI Toxicity dataset...')
  
  const response = await fetch(DATASET_URL)
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`)
  }

  const csvText = await response.text()
  const lines = csvText.split('\n').filter(l => l.trim())
  
  // Skip header
  const dataLines = lines.slice(1)
  
  // Parse CSV - handle quoted fields with commas
  const rows: ToxicityRow[] = []
  for (const line of dataLines) {
    if (!line.trim()) continue
    
    // Try to parse CSV - handle quoted text
    // Format appears to be: "text",is_toxic or text,is_toxic
    const parts: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        parts.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    parts.push(current.trim()) // Last part
    
    if (parts.length >= 2) {
      const text = parts[0].replace(/^"|"$/g, '') // Remove quotes
      const label = parts[parts.length - 1].trim().toLowerCase()
      const isToxic = label === '1' || label === 'true' || label === 'toxic'
      
      if (text) {
        rows.push({
          text,
          is_toxic: isToxic
        })
      }
    }
  }

  console.log(`✅ Downloaded ${rows.length} examples`)
  return rows
}

function synthesizeBookDescription(text: string, isToxic: boolean): string {
  if (!isToxic) {
    return `A book exploring themes of communication and dialogue. The narrative includes discussions about differing perspectives and respectful discourse.`
  }

  const lowerText = text.toLowerCase()
  
  // Pattern detection for book-like synthesis
  if (lowerText.includes('die') || lowerText.includes('kill') || lowerText.includes('death')) {
    return `A book containing themes of violence and threats. The narrative includes language that suggests harm or death threats.`
  }
  
  if (lowerText.match(/\b(idiot|moron|stupid|dumb|fool)\b/)) {
    return `A book containing strong language and insults. The narrative includes derogatory language directed at individuals.`
  }
  
  if (lowerText.match(/\b(worthless|trash|garbage|useless)\b/)) {
    return `A book containing themes of dehumanization and strong language. The narrative includes language that demeans or devalues individuals.`
  }
  
  if (lowerText.includes('hate') || lowerText.includes('disgusting')) {
    return `A book containing strong language expressing hatred or disgust. The narrative includes language that may be considered offensive or harmful.`
  }
  
  // Fallback for other toxic content
  return `A book containing strong language and potentially offensive content. The narrative includes language that may be considered toxic or harmful.`
}

function mapToOurTaxonomy(text: string, isToxic: boolean): Array<{
  category: string
  subcategory: string
  severity: 'mild' | 'moderate' | 'severe'
  description: string
}> {
  if (!isToxic) return []

  // Use pattern matching for better categorization
  const matches = getBestMatches(text, 2)
  
  return matches.map(match => ({
    category: match.category,
    subcategory: match.subcategory,
    severity: match.severity,
    description: match.description
  }))
}

async function main() {
  console.log('🧪 Real Dataset Calibration Test\n')
  console.log('─'.repeat(70))
  console.log('\n📋 Testing with actual Surge AI Toxicity dataset')
  console.log('   This is a DRY RUN - no data will be committed\n')

  try {
    // Download dataset
    const allRows = await downloadAndParseDataset()
    
    // Sample for testing (first 20 toxic, first 10 non-toxic)
    const toxicSamples = allRows.filter(r => r.is_toxic).slice(0, 20)
    const nonToxicSamples = allRows.filter(r => !r.is_toxic).slice(0, 10)
    const samples = [...toxicSamples, ...nonToxicSamples]

    console.log(`\n📊 Testing with ${samples.length} samples:`)
    console.log(`   Toxic: ${toxicSamples.length}`)
    console.log(`   Non-toxic: ${nonToxicSamples.length}`)

    const results: Array<{
      original: ToxicityRow
      converted: {
        book_description: string
        warnings: Array<{ category: string; subcategory: string; severity: string; description: string }>
      }
      issues: string[]
    }> = []

    for (const row of samples) {
      const description = synthesizeBookDescription(row.text, row.is_toxic)
      const warnings = mapToOurTaxonomy(row.text, row.is_toxic)

      const issues: string[] = []
      
      // Quality checks
      if (description.length < 50) {
        issues.push('Description too short')
      }
      if (row.is_toxic && warnings.length === 0) {
        issues.push('Toxic content produced no warnings')
      }
      if (description.includes('tweet') || description.includes('comment')) {
        issues.push('Description feels too social-media-like')
      }

      results.push({
        original: row,
        converted: {
          book_description: description,
          warnings
        },
        issues
      })
    }

    // Display sample results
    console.log('\n' + '─'.repeat(70))
    console.log('\n📝 SAMPLE CONVERSIONS (First 5 toxic examples)\n')

    const toxicResults = results.filter(r => r.original.is_toxic).slice(0, 5)
    toxicResults.forEach((result, idx) => {
      console.log(`${idx + 1}. Original: "${result.original.text}"`)
      console.log(`   Description: "${result.converted.book_description}"`)
      console.log(`   Warnings: ${result.converted.warnings.length}`)
      result.converted.warnings.forEach(w => {
        console.log(`     - ${w.category}.${w.subcategory} (${w.severity}): ${w.description}`)
      })
      if (result.issues.length > 0) {
        console.log(`   ⚠️  Issues: ${result.issues.join(', ')}`)
      }
      console.log()
    })

    // Summary
    console.log('─'.repeat(70))
    console.log('\n📈 SUMMARY\n')

    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0)
    const examplesWithIssues = results.filter(r => r.issues.length > 0).length
    const avgWarningsPerToxic = toxicResults.reduce((sum, r) => sum + r.converted.warnings.length, 0) / toxicResults.length

    console.log(`Total Examples: ${results.length}`)
    console.log(`Examples with Issues: ${examplesWithIssues}`)
    console.log(`Total Issues: ${totalIssues}`)
    console.log(`Avg Warnings per Toxic Example: ${avgWarningsPerToxic.toFixed(1)}`)

    // Category distribution
    const categoryCounts: Record<string, number> = {}
    results.forEach(r => {
      r.converted.warnings.forEach(w => {
        const key = `${w.category}.${w.subcategory}`
        categoryCounts[key] = (categoryCounts[key] || 0) + 1
      })
    })

    console.log(`\nCategory Distribution:`)
    Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([cat, count]) => {
        console.log(`   ${cat}: ${count}`)
      })

    // Save results
    const outputDir = path.join(process.cwd(), 'data', 'datasets', 'real-dataset-test')
    await fs.mkdir(outputDir, { recursive: true })
    
    await fs.writeFile(
      path.join(outputDir, 'conversions.json'),
      JSON.stringify(results, null, 2)
    )

    console.log(`\n💾 Results saved to: ${path.join(outputDir, 'conversions.json')}`)

    // Recommendations
    console.log('\n' + '─'.repeat(70))
    console.log('\n💡 FINDINGS & RECOMMENDATIONS\n')

    if (examplesWithIssues > results.length * 0.2) {
      console.log('⚠️  More than 20% of examples have issues. Consider:')
      console.log('   - Improving pattern detection')
      console.log('   - Refining description synthesis')
      console.log('   - Adding more context awareness')
    }

    if (avgWarningsPerToxic < 1) {
      console.log('⚠️  Average warnings per toxic example is below 1. Consider:')
      console.log('   - More aggressive pattern matching')
      console.log('   - Broader category coverage')
    }

    if (categoryCounts['language.strong_language'] > categoryCounts['violence.threats'] * 2) {
      console.log('⚠️  Language warnings dominate. Consider:')
      console.log('   - Better violence/threat detection')
      console.log('   - More nuanced language severity')
    }

    console.log('\n✅ Dry run complete!')
    console.log('\nNext steps:')
    console.log('   1. Review conversions.json manually')
    console.log('   2. Create keep/toss/tune rubric')
    console.log('   3. Refine synthesis patterns')
    console.log('   4. Test with larger sample')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main().catch(console.error)

