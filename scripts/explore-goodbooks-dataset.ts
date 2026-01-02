#!/usr/bin/env tsx
/**
 * Explore goodbooks-10k Dataset
 * 
 * Downloads and explores the goodbooks-10k dataset (CC BY-SA 4.0)
 * to understand its structure and how we can use it for training examples.
 * 
 * Usage: tsx scripts/explore-goodbooks-dataset.ts
 */

import 'dotenv/config'
import * as fs from 'fs/promises'
import * as path from 'path'

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

async function downloadDataset(): Promise<GoodBooksRow[]> {
  console.log('📥 Downloading goodbooks-10k dataset...')
  console.log('   Source: https://www.kaggle.com/zygmunt/goodbooks-10k')
  console.log('   License: CC BY-SA 4.0')
  console.log('   Note: You may need to download manually from Kaggle\n')

  // Check if dataset exists locally
  const datasetPath = path.join(process.cwd(), 'data', 'datasets', 'goodbooks-10k', 'books.csv')
  
  try {
    const fileContent = await fs.readFile(datasetPath, 'utf-8')
    console.log(`✅ Found local dataset: ${datasetPath}`)
    
    // Parse CSV
    const lines = fileContent.split('\n').filter(l => l.trim())
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    console.log(`   Headers: ${headers.slice(0, 10).join(', ')}...`)
    console.log(`   Total rows: ${lines.length - 1}\n`)
    
    const rows: GoodBooksRow[] = []
    for (let i = 1; i < Math.min(lines.length, 100); i++) { // Sample first 100
      const values = parseCSVLine(lines[i])
      if (values.length >= headers.length) {
        const row: any = {}
        headers.forEach((header, idx) => {
          row[header] = values[idx]?.replace(/^"|"$/g, '') || ''
        })
        rows.push(row as GoodBooksRow)
      }
    }
    
    console.log(`✅ Parsed ${rows.length} sample rows`)
    return rows
  } catch (error) {
    console.log(`⚠️  Dataset not found locally at: ${datasetPath}`)
    console.log(`\nTo download:`)
    console.log(`   1. Visit: https://www.kaggle.com/zygmunt/goodbooks-10k`)
    console.log(`   2. Download the dataset`)
    console.log(`   3. Extract books.csv to: ${datasetPath}`)
    console.log(`   4. Run this script again\n`)
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
  values.push(current) // Last value
  
  return values
}

function analyzeDataset(data: GoodBooksRow[]) {
  console.log('📊 Analyzing goodbooks-10k Dataset\n')
  console.log('─'.repeat(70))
  
  if (data.length === 0) {
    console.log('No data to analyze. Please download the dataset first.')
    return
  }

  // Show sample items
  console.log('\n📝 Sample Books (first 5):\n')
  data.slice(0, 5).forEach((book, idx) => {
    console.log(`${idx + 1}. ${book.title}`)
    console.log(`   Author: ${book.authors}`)
    console.log(`   ISBN: ${book.isbn || book.isbn13 || 'N/A'}`)
    console.log(`   Year: ${book.original_publication_year || 'N/A'}`)
    console.log(`   Rating: ${book.average_rating?.toFixed(2) || 'N/A'} (${book.ratings_count || 0} ratings)`)
    console.log()
  })

  // Statistics
  console.log('─'.repeat(70))
  console.log('\n📈 Dataset Statistics:\n')
  
  const withISBN = data.filter(b => b.isbn || b.isbn13).length
  const withAuthor = data.filter(b => b.authors).length
  const withYear = data.filter(b => b.original_publication_year).length
  const withRating = data.filter(b => b.average_rating).length
  
  console.log(`Total Books: ${data.length}`)
  console.log(`With ISBN: ${withISBN} (${((withISBN/data.length)*100).toFixed(1)}%)`)
  console.log(`With Author: ${withAuthor} (${((withAuthor/data.length)*100).toFixed(1)}%)`)
  console.log(`With Publication Year: ${withYear} (${((withYear/data.length)*100).toFixed(1)}%)`)
  console.log(`With Ratings: ${withRating} (${((withRating/data.length)*100).toFixed(1)}%)`)
  
  // Rating distribution
  if (withRating > 0) {
    const avgRating = data.reduce((sum, b) => sum + (b.average_rating || 0), 0) / withRating
    console.log(`Average Rating: ${avgRating.toFixed(2)}`)
  }

  // Year range
  const years = data.filter(b => b.original_publication_year).map(b => b.original_publication_year!)
  if (years.length > 0) {
    console.log(`Year Range: ${Math.min(...years)} - ${Math.max(...years)}`)
  }
}

function convertToTrainingExample(book: GoodBooksRow, index: number): any {
  // Note: This dataset doesn't have descriptions, so we can't create full training examples
  // But we can create metadata examples that could be used with our API to fetch descriptions
  
  return {
    book_title: book.title || book.original_title || `Book ${book.book_id}`,
    book_author: book.authors || 'Unknown',
    book_isbn: book.isbn || book.isbn13 || null,
    book_year: book.original_publication_year || null,
    book_rating: book.average_rating || null,
    book_ratings_count: book.ratings_count || 0,
    source_dataset: 'goodbooks-10k',
    source_id: book.book_id,
    notes: `Metadata from goodbooks-10k dataset (CC BY-SA 4.0). No description included - would need to fetch from Google Books/Open Library API.`
  }
}

async function main() {
  console.log('🔍 goodbooks-10k Dataset Explorer\n')
  console.log('─'.repeat(70))
  console.log('\n📋 Dataset Information:')
  console.log('   Name: goodbooks-10k')
  console.log('   License: CC BY-SA 4.0')
  console.log('   Source: https://www.kaggle.com/zygmunt/goodbooks-10k')
  console.log('   Attribution Required: Yes')
  console.log('\n✅ This dataset is approved for use in our project')
  console.log('   (See docs/DATA_SOURCING_POLICY.md for details)\n')

  // Download/load dataset
  const data = await downloadDataset()
  
  if (data.length === 0) {
    console.log('⚠️  No data available. Please download the dataset first.')
    process.exit(1)
  }

  // Analyze
  analyzeDataset(data)

  // Convert sample to training example format
  console.log('─'.repeat(70))
  console.log('\n🔄 Converting to Training Example Format...\n')
  
  const sample = data[0]
  const example = convertToTrainingExample(sample, 0)
  
  console.log('📋 Sample Conversion:')
  console.log(JSON.stringify(example, null, 2))

  // Save sample conversions
  const outputDir = path.join(process.cwd(), 'data', 'datasets', 'goodbooks-10k')
  await fs.mkdir(outputDir, { recursive: true })
  
  const sampleConversions = data.slice(0, 20).map((book, idx) => 
    convertToTrainingExample(book, idx)
  )
  
  await fs.writeFile(
    path.join(outputDir, 'sample_metadata.json'),
    JSON.stringify(sampleConversions, null, 2)
  )
  
  console.log(`\n💾 Saved ${sampleConversions.length} sample conversions to:`)
  console.log(`   ${path.join(outputDir, 'sample_metadata.json')}`)

  // Usage recommendations
  console.log('\n' + '─'.repeat(70))
  console.log('\n💡 Usage Recommendations\n')
  
  console.log('✅ Safe to Use:')
  console.log('   - Book metadata (titles, authors, ISBNs)')
  console.log('   - Ratings data')
  console.log('   - Book discovery')
  console.log('   - Populating database with metadata')
  
  console.log('\n⚠️  Limitations:')
  console.log('   - No descriptions included (would need to fetch from APIs)')
  console.log('   - Cannot create full training examples without descriptions')
  console.log('   - Would need to combine with Google Books/Open Library API')
  
  console.log('\n📝 Next Steps:')
  console.log('   1. Review sample_metadata.json')
  console.log('   2. Decide how to use metadata (database population, discovery, etc.)')
  console.log('   3. If using for training: fetch descriptions from APIs first')
  console.log('   4. Add attribution to README/documentation')
  console.log('   5. Document usage in DATA_SOURCING_POLICY.md')

  console.log('\n✅ Exploration complete!')
}

main().catch(console.error)

