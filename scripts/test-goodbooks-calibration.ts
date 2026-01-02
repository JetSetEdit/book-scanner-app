#!/usr/bin/env tsx
/**
 * Test goodbooks-10k Dataset Calibration
 * 
 * Tests how we can use goodbooks-10k metadata to create training examples
 * by combining with API-fetched descriptions.
 * 
 * Usage: tsx scripts/test-goodbooks-calibration.ts
 */

import 'dotenv/config'
import * as fs from 'fs/promises'
import * as path from 'path'
import { fetchBookByISBN } from '../lib/book-api'

interface GoodBooksRow {
  book_id: number
  goodreads_book_id: number
  best_book_id: number
  work_id: number
  books_count: number
  isbn: string
  isbn13: string
  authors: string
  original_publication_year: number
  original_title: string
  title: string
  language_code: string
  average_rating: number
  ratings_count: number
  work_ratings_count: number
  work_text_reviews_count: number
  ratings_1: number
  ratings_2: number
  ratings_3: number
  ratings_4: number
  ratings_5: number
  image_url: string
  small_image_url: string
}

async function loadGoodBooksDataset(): Promise<GoodBooksRow[]> {
  const datasetPath = path.join(process.cwd(), 'data', 'datasets', 'goodbooks-10k', 'books.csv')
  
  try {
    const fileContent = await fs.readFile(datasetPath, 'utf-8')
    const lines = fileContent.split('\n').filter(l => l.trim())
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    const rows: GoodBooksRow[] = []
    for (let i = 1; i < Math.min(lines.length, 50); i++) { // Sample 50 for testing
      const values = parseCSVLine(lines[i])
      if (values.length >= headers.length) {
        const row: any = {}
        headers.forEach((header, idx) => {
          row[header] = values[idx]?.replace(/^"|"$/g, '') || ''
        })
        rows.push(row as GoodBooksRow)
      }
    }
    
    return rows
  } catch (error) {
    console.error('❌ Dataset not found. Please download goodbooks-10k first.')
    console.error(`   Expected at: ${datasetPath}`)
    console.error('   Download from: https://www.kaggle.com/zygmunt/goodbooks-10k')
    return []
  }
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }
  values.push(current)
  return values
}

interface EnrichmentResult {
  book: GoodBooksRow
  description?: string
  source?: 'googlebooks' | 'openlibrary'
  description_length?: number
  quality?: 'good' | 'too_short' | 'too_vague' | 'marketing_ish' | 'unusable'
  error?: string
}

async function enrichWithDescription(book: GoodBooksRow): Promise<EnrichmentResult> {
  const isbn = book.isbn || book.isbn13
  if (!isbn) {
    return { book, error: 'No ISBN available' }
  }

  try {
    const bookData = await fetchBookByISBN(isbn)
    if (bookData?.description) {
      const descLength = bookData.description.length
      const source = bookData.source as 'googlebooks' | 'openlibrary' | undefined
      
      // Assess description quality
      const quality = assessDescriptionQuality(bookData.description)
      
      return {
        book,
        description: bookData.description,
        source: source || 'googlebooks', // Default assumption
        description_length: descLength,
        quality
      }
    }
    return { book, error: 'No description found via API' }
  } catch (error) {
    return { book, error: `API error: ${error}` }
  }
}

function assessDescriptionQuality(description: string): 'good' | 'too_short' | 'too_vague' | 'marketing_ish' | 'unusable' {
  const lowerDesc = description.toLowerCase()
  const length = description.length
  
  // Too short
  if (length < 100) {
    return 'too_short'
  }
  
  // Marketing language indicators
  const marketingPhrases = [
    'bestselling', 'award-winning', 'must-read', 'page-turner',
    'gripping', 'unputdownable', 'riveting', 'compelling',
    'don\'t miss', 'order now', 'available now', 'buy now'
  ]
  
  const marketingCount = marketingPhrases.filter(phrase => lowerDesc.includes(phrase)).length
  if (marketingCount >= 3) {
    return 'marketing_ish'
  }
  
  // Too vague (lots of generic phrases, little substance)
  const vaguePhrases = [
    'this book', 'this novel', 'this story', 'this tale',
    'follow', 'journey', 'adventure', 'discover'
  ]
  
  const vagueCount = vaguePhrases.filter(phrase => lowerDesc.includes(phrase)).length
  if (vagueCount >= 5 && length < 300) {
    return 'too_vague'
  }
  
  // Unusable (mostly promotional or very short)
  if (length < 150 && marketingCount >= 2) {
    return 'unusable'
  }
  
  // Good description
  if (length >= 200 && marketingCount < 2) {
    return 'good'
  }
  
  // Default to good if it passes basic checks
  return 'good'
}

async function convertToTrainingExample(
  enriched: EnrichmentResult
): Promise<any> {
  if (!enriched.description) {
    return {
      book_title: enriched.book.title,
      book_author: enriched.book.authors,
      book_isbn: enriched.book.isbn || enriched.book.isbn13,
      status: 'incomplete',
      error: enriched.error || 'No description available',
      notes: 'Cannot create training example without description. Would need to fetch from API or use different source.'
    }
  }

  // Filter by quality - only include good descriptions for training
  const includeForTraining = enriched.quality === 'good'

  return {
    book_title: enriched.book.title || enriched.book.original_title,
    book_author: enriched.book.authors || 'Unknown',
    book_description: enriched.description,
    book_isbn: enriched.book.isbn || enriched.book.isbn13,
    book_year: enriched.book.original_publication_year || null,
    book_rating: enriched.book.average_rating || null,
    book_ratings_count: enriched.book.ratings_count || null,
    source_dataset: 'goodbooks-10k',
    source_id: enriched.book.book_id,
    description_source: enriched.source,
    description_length: enriched.description_length,
    description_quality: enriched.quality,
    ready_for_training: includeForTraining,
    expected_warnings: [], // Would be generated by AI analysis
    notes: `Metadata from goodbooks-10k (CC BY-SA 4.0), description from ${enriched.source} API. ${includeForTraining ? 'Ready for AI analysis.' : `Quality: ${enriched.quality} - may need review.`}`
  }
}

async function main() {
  console.log('🧪 goodbooks-10k Dataset Calibration Test\n')
  console.log('─'.repeat(70))
  console.log('\n📋 Testing goodbooks-10k dataset integration')
  console.log('   License: CC BY-SA 4.0')
  console.log('   This is a DRY RUN - testing enrichment process\n')

  // Load dataset
  console.log('📥 Loading goodbooks-10k dataset...')
  const books = await loadGoodBooksDataset()
  
  if (books.length === 0) {
    console.log('⚠️  No data available. Please download the dataset first.')
    process.exit(1)
  }

  console.log(`✅ Loaded ${books.length} books\n`)

  // Test enrichment process with genre stratification
  console.log('─'.repeat(70))
  console.log('\n🔄 Testing Description Enrichment\n')
  console.log('   Testing with stratified sample (by rating/author diversity)...\n')

  // Stratify sample: mix of high-rated, mid-rated, and diverse authors
  const booksWithISBN = books.filter(b => b.isbn || b.isbn13)
  
  // Sample strategy: Get mix of ratings
  const highRated = booksWithISBN
    .filter(b => b.average_rating && b.average_rating >= 4.0)
    .slice(0, 3)
  const midRated = booksWithISBN
    .filter(b => b.average_rating && b.average_rating >= 3.0 && b.average_rating < 4.0)
    .slice(0, 3)
  const diverse = booksWithISBN
    .filter(b => !highRated.includes(b) && !midRated.includes(b))
    .slice(0, 4)
  
  const sampleBooks = [...highRated, ...midRated, ...diverse].slice(0, 10)
  
  console.log(`   Sample size: ${sampleBooks.length} books`)
  console.log(`   High-rated (4.0+): ${highRated.length}`)
  console.log(`   Mid-rated (3.0-4.0): ${midRated.length}`)
  console.log(`   Diverse: ${diverse.length}\n`)
  
  const results: Array<{
    original: GoodBooksRow
    enriched: EnrichmentResult
    converted: any
    status: 'success' | 'no_description' | 'error' | 'low_quality'
  }> = []

  for (const book of booksWithISBN) {
    console.log(`📚 Processing: "${book.title}" by ${book.authors}`)
    console.log(`   ISBN: ${book.isbn || book.isbn13}`)
    
    const enriched = await enrichWithDescription(book)
    const converted = await convertToTrainingExample(enriched)
    
    let status: 'success' | 'no_description' | 'error' | 'low_quality' = 'success'
    if (enriched.error) {
      status = enriched.error.includes('No description') ? 'no_description' : 'error'
    } else if (!enriched.description) {
      status = 'no_description'
    } else if (enriched.quality && enriched.quality !== 'good') {
      status = 'low_quality'
    }

    results.push({
      original: book,
      enriched,
      converted,
      status
    })

    if (enriched.description) {
      const qualityEmoji = enriched.quality === 'good' ? '✅' : 
                          enriched.quality === 'too_short' ? '⚠️' :
                          enriched.quality === 'too_vague' ? '⚠️' :
                          enriched.quality === 'marketing_ish' ? '⚠️' : '❌'
      console.log(`   ${qualityEmoji} Description found (${enriched.description.length} chars) from ${enriched.source}`)
      console.log(`      Quality: ${enriched.quality}`)
      if (enriched.quality !== 'good') {
        console.log(`      ⚠️  May need review before training`)
      }
    } else {
      console.log(`   ⚠️  ${enriched.error || 'No description available'}`)
    }
    console.log()
  }

  // Summary
  console.log('─'.repeat(70))
  console.log('\n📈 SUMMARY\n')

  const successCount = results.filter(r => r.status === 'success').length
  const lowQualityCount = results.filter(r => r.status === 'low_quality').length
  const noDescCount = results.filter(r => r.status === 'no_description').length
  const errorCount = results.filter(r => r.status === 'error').length

  console.log(`Total Books Tested: ${results.length}`)
  console.log(`✅ Success (good quality): ${successCount}`)
  console.log(`⚠️  Low Quality: ${lowQualityCount}`)
  console.log(`⚠️  No Description: ${noDescCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`Success Rate: ${((successCount / results.length) * 100).toFixed(1)}%`)
  
  // Quality breakdown
  const qualityBreakdown: Record<string, number> = {}
  results.forEach(r => {
    if (r.enriched.quality) {
      qualityBreakdown[r.enriched.quality] = (qualityBreakdown[r.enriched.quality] || 0) + 1
    }
  })
  
  if (Object.keys(qualityBreakdown).length > 0) {
    console.log(`\nDescription Quality Breakdown:`)
    Object.entries(qualityBreakdown).forEach(([quality, count]) => {
      console.log(`   ${quality}: ${count}`)
    })
  }
  
  // Source breakdown
  const sourceBreakdown: Record<string, number> = {}
  results.forEach(r => {
    if (r.enriched.source) {
      sourceBreakdown[r.enriched.source] = (sourceBreakdown[r.enriched.source] || 0) + 1
    }
  })
  
  if (Object.keys(sourceBreakdown).length > 0) {
    console.log(`\nDescription Source Breakdown:`)
    Object.entries(sourceBreakdown).forEach(([source, count]) => {
      console.log(`   ${source}: ${count}`)
    })
  }

  // Show sample conversions
  console.log('\n' + '─'.repeat(70))
  console.log('\n📝 SAMPLE CONVERSIONS\n')

  results.forEach((result, idx) => {
    console.log(`${idx + 1}. ${result.original.title}`)
    console.log(`   Author: ${result.original.authors}`)
    console.log(`   Rating: ${result.original.average_rating?.toFixed(2) || 'N/A'}`)
    
    if (result.status === 'success') {
      console.log(`   ✅ Ready for training example`)
      console.log(`   Description: ${result.enriched.description?.substring(0, 100)}...`)
      console.log(`   Source: ${result.enriched.source}, Length: ${result.enriched.description_length} chars`)
      console.log(`   Quality: ${result.enriched.quality}`)
    } else if (result.status === 'low_quality') {
      console.log(`   ⚠️  Low quality description`)
      console.log(`   Quality: ${result.enriched.quality}`)
      console.log(`   Description: ${result.enriched.description?.substring(0, 100)}...`)
      console.log(`   Source: ${result.enriched.source}, Length: ${result.enriched.description_length} chars`)
      console.log(`   Note: May need manual review`)
    } else {
      console.log(`   ⚠️  ${result.status === 'no_description' ? 'No description available' : 'Error occurred'}`)
      console.log(`   Issue: ${result.enriched.error}`)
    }
    console.log()
  })
  
  // Show ready-for-training count
  const readyForTraining = results.filter(r => r.converted.ready_for_training === true).length
  console.log(`\n📊 Training Readiness:`)
  console.log(`   Ready for training: ${readyForTraining}/${results.length}`)
  console.log(`   Need review: ${results.length - readyForTraining}`)

  // Save results
  const outputDir = path.join(process.cwd(), 'data', 'datasets', 'goodbooks-10k', 'calibration-test')
  await fs.mkdir(outputDir, { recursive: true })
  
  await fs.writeFile(
    path.join(outputDir, 'enrichment_results.json'),
    JSON.stringify(results, null, 2)
  )

  console.log(`💾 Results saved to: ${path.join(outputDir, 'enrichment_results.json')}`)

  // Recommendations
  console.log('\n' + '─'.repeat(70))
  console.log('\n💡 FINDINGS & RECOMMENDATIONS\n')

  if (successCount > 0) {
    console.log('✅ Enrichment Process Works:')
    console.log('   - Can combine goodbooks-10k metadata with API descriptions')
    console.log('   - Creates complete training examples')
    console.log('   - Ready for AI analysis')
  }

  if (noDescCount > 0) {
    console.log('\n⚠️  Some books lack descriptions:')
    console.log('   - Not all books have descriptions in APIs')
    console.log('   - May need to skip or use alternative sources')
    console.log('   - Consider using books with known descriptions first')
  }

  console.log('\n📝 Next Steps:')
  console.log('   1. Review enrichment_results.json manually')
  console.log('   2. Label each as: "good blurb" / "too vague" / "unusable"')
  console.log('   3. Update quality filters based on manual review')
  console.log('   4. For good examples: Run multi-model analysis to generate warnings')
  console.log('   5. Check warnings distribution across genres/ratings')
  console.log('   6. Add to training-examples.ts (with attribution)')
  console.log('   7. Document usage in DATA_SOURCING_POLICY.md')
  
  // Add recommendation for manual review
  if (lowQualityCount > 0) {
    console.log(`\n💡 Recommendation:`)
    console.log(`   ${lowQualityCount} examples have low-quality descriptions.`)
    console.log(`   Manually review these to refine quality filters.`)
  }

  console.log('\n✅ Calibration test complete!')
}

main().catch(console.error)

