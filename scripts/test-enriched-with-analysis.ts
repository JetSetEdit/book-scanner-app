#!/usr/bin/env tsx
/**
 * Test Enriched Books with Multi-Model Analysis
 * 
 * Takes enriched goodbooks-10k examples and runs them through
 * our multi-model analysis service to generate warnings.
 * 
 * This tests the full pipeline: metadata → enrichment → analysis → warnings
 * 
 * Usage: tsx scripts/test-enriched-with-analysis.ts [limit]
 *   limit: Number of books to test (default: 5)
 */

import 'dotenv/config'
import * as fs from 'fs/promises'
import * as path from 'path'
import { analyzeBookWithMultiModel } from '../lib/services/multi-model-analysis'

interface EnrichmentResult {
  book: any
  enriched: any
  converted: any
  status: string
}

async function loadEnrichmentResults(): Promise<EnrichmentResult[]> {
  const resultsPath = path.join(
    process.cwd(),
    'data',
    'datasets',
    'goodbooks-10k',
    'calibration-test',
    'enrichment_results.json'
  )

  try {
    const content = await fs.readFile(resultsPath, 'utf-8')
    const results = JSON.parse(content) as EnrichmentResult[]
    return results.filter(r => r.converted.ready_for_training === true)
  } catch (error) {
    console.error('❌ Could not load enrichment results')
    console.error(`   Expected at: ${resultsPath}`)
    console.error('   Run test-goodbooks-calibration.ts first')
    return []
  }
}

async function main() {
  const limit = parseInt(process.argv[2] || '5', 10)

  console.log('🧪 Testing Enriched Books with Multi-Model Analysis\n')
  console.log('─'.repeat(70))
  console.log(`\n📋 Testing ${limit} enriched books through analysis pipeline\n`)

  // Load enrichment results
  const enrichedBooks = await loadEnrichmentResults()
  
  if (enrichedBooks.length === 0) {
    console.log('⚠️  No enriched books available. Run test-goodbooks-calibration.ts first.')
    process.exit(1)
  }

  const sample = enrichedBooks.slice(0, limit)
  console.log(`✅ Loaded ${sample.length} ready-for-training examples\n`)

  const analysisResults: Array<{
    book: any
    metadata: {
      title: string
      author: string
      isbn: string
      description_length: number
      description_source: string
    }
    analysis: {
      warnings_count: number
      classification?: string
      agreement_score?: number
      warnings: any[]
    }
    status: 'success' | 'error'
    error?: string
  }> = []

  // Run analysis on each book
  for (const enriched of sample) {
    const converted = enriched.converted
    console.log(`📚 Analyzing: "${converted.book_title}" by ${converted.book_author}`)
    console.log(`   Description: ${converted.description_length} chars from ${converted.description_source}`)
    console.log(`   ⏳ Running multi-model analysis...\n`)

    try {
      const result = await analyzeBookWithMultiModel(
        {
          title: converted.book_title,
          author: converted.book_author,
          isbn: converted.book_isbn || '',
          description: converted.book_description
        },
        (message) => {
          // Suppress progress for cleaner output
        }
      )

      // Extract classification from warnings if available
      const classification = result.warnings.length > 0 
        ? determineClassification(result.warnings)
        : undefined

      analysisResults.push({
        book: converted,
        metadata: {
          title: converted.book_title,
          author: converted.book_author,
          isbn: converted.book_isbn,
          description_length: converted.description_length,
          description_source: converted.description_source
        },
        analysis: {
          warnings_count: result.warnings.length,
          classification,
          agreement_score: result.analysis.agreement_score,
          warnings: result.warnings
        },
        status: 'success'
      })

      console.log(`   ✅ Analysis complete: ${result.warnings.length} warnings found`)
      if (classification) {
        console.log(`   Classification: ${classification}`)
      }
      console.log(`   Agreement: ${(result.analysis.agreement_score * 100).toFixed(1)}%\n`)

    } catch (error) {
      console.log(`   ❌ Analysis failed: ${error}\n`)
      analysisResults.push({
        book: converted,
        metadata: {
          title: converted.book_title,
          author: converted.book_author,
          isbn: converted.book_isbn,
          description_length: converted.description_length,
          description_source: converted.description_source
        },
        analysis: {
          warnings_count: 0,
          warnings: []
        },
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  // Summary
  console.log('─'.repeat(70))
  console.log('\n📈 ANALYSIS SUMMARY\n')

  const successCount = analysisResults.filter(r => r.status === 'success').length
  const errorCount = analysisResults.filter(r => r.status === 'error').length
  const totalWarnings = analysisResults.reduce((sum, r) => sum + r.analysis.warnings_count, 0)
  const avgWarnings = successCount > 0 ? totalWarnings / successCount : 0

  console.log(`Total Books Analyzed: ${analysisResults.length}`)
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`Total Warnings Generated: ${totalWarnings}`)
  console.log(`Avg Warnings per Book: ${avgWarnings.toFixed(1)}`)

  // Classification distribution
  const classifications: Record<string, number> = {}
  analysisResults.forEach(r => {
    if (r.analysis.classification) {
      classifications[r.analysis.classification] = (classifications[r.analysis.classification] || 0) + 1
    }
  })

  if (Object.keys(classifications).length > 0) {
    console.log(`\nClassification Distribution:`)
    Object.entries(classifications).forEach(([rating, count]) => {
      console.log(`   ${rating}: ${count}`)
    })
  }

  // Category distribution
  const categoryCounts: Record<string, number> = {}
  analysisResults.forEach(r => {
    r.analysis.warnings.forEach(w => {
      const cat = w.subcategory_id?.split('.')[0] || 'other'
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    })
  })

  if (Object.keys(categoryCounts).length > 0) {
    console.log(`\nCategory Distribution:`)
    Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([cat, count]) => {
        console.log(`   ${cat}: ${count}`)
      })
  }

  // Source comparison
  const sourceStats: Record<string, { count: number; avgWarnings: number }> = {}
  analysisResults.forEach(r => {
    const source = r.metadata.description_source
    if (!sourceStats[source]) {
      sourceStats[source] = { count: 0, avgWarnings: 0 }
    }
    sourceStats[source].count++
    sourceStats[source].avgWarnings += r.analysis.warnings_count
  })

  Object.entries(sourceStats).forEach(([source, stats]) => {
    stats.avgWarnings = stats.avgWarnings / stats.count
  })

  if (Object.keys(sourceStats).length > 0) {
    console.log(`\nSource Comparison:`)
    Object.entries(sourceStats).forEach(([source, stats]) => {
      console.log(`   ${source}: ${stats.count} books, ${stats.avgWarnings.toFixed(1)} avg warnings`)
    })
  }

  // Save results
  const outputDir = path.join(process.cwd(), 'data', 'datasets', 'goodbooks-10k', 'analysis-test')
  await fs.mkdir(outputDir, { recursive: true })
  
  await fs.writeFile(
    path.join(outputDir, 'analysis_results.json'),
    JSON.stringify(analysisResults, null, 2)
  )

  console.log(`\n💾 Results saved to: ${path.join(outputDir, 'analysis_results.json')}`)

  // Recommendations
  console.log('\n' + '─'.repeat(70))
  console.log('\n💡 FINDINGS & RECOMMENDATIONS\n')

  if (avgWarnings < 1) {
    console.log('⚠️  Low warning count. Consider:')
    console.log('   - Checking if descriptions are detailed enough')
    console.log('   - Reviewing AI analysis prompts')
    console.log('   - Testing with books known to have content warnings')
  }

  if (Object.keys(sourceStats).length > 1) {
    console.log('\n📊 Source Quality Comparison:')
    console.log('   Compare avg warnings between sources to see which provides better descriptions')
  }

  console.log('\n📝 Next Steps:')
  console.log('   1. Review analysis_results.json')
  console.log('   2. Check warnings distribution across genres/ratings')
  console.log('   3. Compare source quality (Google Books vs Open Library)')
  console.log('   4. If warnings look plausible, add to training-examples.ts')

  console.log('\n✅ Analysis test complete!')
}

function determineClassification(warnings: any[]): string | undefined {
  // Simple classification based on highest severity
  const hasSevere = warnings.some(w => w.severity === 'severe')
  const hasModerate = warnings.some(w => w.severity === 'moderate')
  const hasMild = warnings.some(w => w.severity === 'mild')

  if (hasSevere) return 'MA15+'
  if (hasModerate) return 'M'
  if (hasMild) return 'PG'
  return 'G'
}

main().catch(console.error)

