#!/usr/bin/env tsx
/**
 * Scan Goodbooks-10k ISBNs for Training Data
 * 
 * Randomly selects ISBNs from goodbooks-10k dataset, scans them through
 * the scanner to generate content warnings, then exports as training data.
 * 
 * Usage: tsx scripts/scan-goodbooks-for-training.ts [sample_size] [output_file]
 */

import 'dotenv/config'
import * as fs from 'fs/promises'
import * as path from 'path'
import { processIsbnScan } from '../lib/services/scan-service'

interface GoodBooksRow {
  book_id: number
  isbn: string
  isbn13: string
  authors: string
  title: string
  average_rating: number
}

interface ScanResult {
  isbn: string
  success: boolean
  book?: {
    id: string
    title: string
    author: string | null
    description: string | null
  }
  warnings?: Array<{
    subcategory_id: string
    category_id: string
    severity: 'mild' | 'moderate' | 'severe'
    description: string
    context_modifiers?: string[]
  }>
  error?: string
  metadata?: {
    description_length: number
    warning_count: number
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

async function loadGoodBooksDataset(): Promise<GoodBooksRow[]> {
  const datasetPath = path.join(process.cwd(), 'data', 'datasets', 'goodbooks-10k', 'books.csv')
  
  try {
    const fileContent = await fs.readFile(datasetPath, 'utf-8')
    const lines = fileContent.split('\n').filter(l => l.trim())
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    const rows: GoodBooksRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length >= headers.length) {
        const row: any = {}
        headers.forEach((header, idx) => {
          row[header] = values[idx]?.replace(/^"|"$/g, '') || ''
        })
        
        // Only include rows with ISBN
        if (row.isbn || row.isbn13) {
          rows.push({
            book_id: parseInt(row.book_id) || 0,
            isbn: row.isbn || '',
            isbn13: row.isbn13 || '',
            authors: row.authors || '',
            title: row.title || '',
            average_rating: parseFloat(row.average_rating) || 0
          })
        }
      }
    }
    
    return rows
  } catch (error) {
    // Fallback to hardcoded popular books if dataset not available
    console.log('⚠️  Dataset not found, using sample ISBNs for testing')
    return getSampleISBNs()
  }
}

function getSampleISBNs(): GoodBooksRow[] {
  // Verified popular books with diverse content for testing
  // These are well-known books that should be findable via APIs
  return [
    { book_id: 1, isbn: '9780307588371', isbn13: '9780307588371', authors: 'Gillian Flynn', title: 'Gone Girl', average_rating: 4.0 },
    { book_id: 2, isbn: '9780062457714', isbn13: '9780062457714', authors: 'Celeste Ng', title: 'Little Fires Everywhere', average_rating: 4.2 },
    { book_id: 3, isbn: '9780525559470', isbn13: '9780525559470', authors: 'Taylor Jenkins Reid', title: 'The Seven Husbands of Evelyn Hugo', average_rating: 4.6 },
    { book_id: 4, isbn: '9780593099322', isbn13: '9780593099322', authors: 'Brandon Sanderson', title: 'The Way of Kings', average_rating: 4.6 },
    { book_id: 5, isbn: '9781250301697', isbn13: '9781250301697', authors: 'T.J. Klune', title: 'The House in the Cerulean Sea', average_rating: 4.5 },
    { book_id: 6, isbn: '9780593356159', isbn13: '9780593356159', authors: 'Rebecca Yarros', title: 'Fourth Wing', average_rating: 4.6 },
    { book_id: 7, isbn: '9781250178618', isbn13: '9781250178618', authors: 'Rebecca Roanhorse', title: 'Trail of Lightning', average_rating: 4.1 },
    { book_id: 8, isbn: '9781250301703', isbn13: '9781250301703', authors: 'T.J. Klune', title: 'Under the Whispering Door', average_rating: 4.3 },
    { book_id: 9, isbn: '9780593421048', isbn13: '9780593421048', authors: 'Rebecca Yarros', title: 'Iron Flame', average_rating: 4.7 },
    { book_id: 10, isbn: '9780385543781', isbn13: '9780385543781', authors: 'Margaret Atwood', title: 'The Testaments', average_rating: 4.3 }
  ]
}

function randomSample<T>(array: T[], size: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, size)
}

async function scanISBN(isbn: string, index: number, total: number): Promise<ScanResult> {
  console.log(`\n[${index + 1}/${total}] Scanning ISBN: ${isbn}`)
  
  try {
    const result = await processIsbnScan(
      isbn,
      (message) => {
        // Suppress verbose progress for batch processing
        if (typeof message === 'string' && message.includes('✅')) {
          process.stdout.write('.')
        }
      },
      undefined, // No selected candidate
      true // Force refresh to generate warnings
    )
    
    if (result.success && result.book) {
      const warnings = result.contentWarnings || []
      
      return {
        isbn,
        success: true,
        book: {
          id: result.book.id,
          title: result.book.title,
          author: result.book.author,
          description: result.book.description
        },
        warnings: warnings.map(w => ({
          subcategory_id: w.subcategory_id || '',
          category_id: w.category_id || '',
          severity: w.severity as 'mild' | 'moderate' | 'severe',
          description: w.description || '',
          context_modifiers: Array.isArray(w.context_modifiers) 
            ? w.context_modifiers as string[]
            : []
        })),
        metadata: {
          description_length: result.book.description?.length || 0,
          warning_count: warnings.length
        }
      }
    } else {
      return {
        isbn,
        success: false,
        error: result.error || 'Scan failed'
      }
    }
  } catch (error) {
    return {
      isbn,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

async function main() {
  const sampleSize = parseInt(process.argv[2] || '30', 10)
  const outputFile = process.argv[3] || path.join(
    process.cwd(),
    'data',
    'training',
    'scanned_training_data.json'
  )

  console.log('📚 Scanning Goodbooks-10k ISBNs for Training Data\n')
  console.log('─'.repeat(70))
  console.log(`\n📋 Configuration:`)
  console.log(`   Sample Size: ${sampleSize} books`)
  console.log(`   Output File: ${outputFile}\n`)

  // Load dataset
  console.log('📥 Loading goodbooks-10k dataset...')
  const allBooks = await loadGoodBooksDataset()
  console.log(`✅ Loaded ${allBooks.length} books from dataset\n`)

  // Random sample
  console.log(`🎲 Selecting random sample of ${sampleSize} books...`)
  const sample = randomSample(allBooks, sampleSize)
  console.log(`✅ Selected ${sample.length} books\n`)

  // Show sample
  console.log('📖 Sample books:')
  sample.slice(0, 5).forEach((book, i) => {
    const isbn = book.isbn || book.isbn13
    console.log(`   ${i + 1}. "${book.title}" by ${book.authors} (ISBN: ${isbn})`)
  })
  if (sample.length > 5) {
    console.log(`   ... and ${sample.length - 5} more\n`)
  }

  // Scan each ISBN
  console.log('─'.repeat(70))
  console.log('\n🔍 Scanning ISBNs...\n')
  console.log('   (This will take a few minutes - each book needs API calls)\n')

  const results: ScanResult[] = []
  const startTime = Date.now()

  for (let i = 0; i < sample.length; i++) {
    const book = sample[i]
    const isbn = book.isbn || book.isbn13
    
    if (!isbn) {
      console.log(`\n[${i + 1}/${sample.length}] ⚠️  Skipping: No ISBN`)
      results.push({
        isbn: '',
        success: false,
        error: 'No ISBN available'
      })
      continue
    }

    const result = await scanISBN(isbn, i, sample.length)
    results.push(result)

    if (result.success) {
      console.log(` ✅ Success: ${result.warnings?.length || 0} warnings`)
    } else {
      console.log(` ❌ Failed: ${result.error}`)
    }

    // Small delay to avoid rate limiting
    if (i < sample.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
  console.log(`\n⏱️  Total time: ${elapsed} minutes`)

  // Summary
  console.log('\n─'.repeat(70))
  console.log('\n📊 SCAN SUMMARY\n')

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  const totalWarnings = successful.reduce((sum, r) => sum + (r.warnings?.length || 0), 0)

  console.log(`Total Scanned: ${results.length}`)
  console.log(`✅ Successful: ${successful.length}`)
  console.log(`❌ Failed: ${failed.length}`)
  console.log(`Total Warnings Generated: ${totalWarnings}`)
  console.log(`Avg Warnings per Book: ${successful.length > 0 ? (totalWarnings / successful.length).toFixed(1) : 0}`)

  // Category distribution
  const categoryCounts: Record<string, number> = {}
  successful.forEach(r => {
    r.warnings?.forEach(w => {
      const cat = w.category_id || 'unknown'
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

  // Severity distribution
  const severityCounts: Record<string, number> = {}
  successful.forEach(r => {
    r.warnings?.forEach(w => {
      severityCounts[w.severity] = (severityCounts[w.severity] || 0) + 1
    })
  })

  if (Object.keys(severityCounts).length > 0) {
    console.log(`\nSeverity Distribution:`)
    Object.entries(severityCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([sev, count]) => {
        console.log(`   ${sev}: ${count}`)
      })
  }

  // Save results
  console.log(`\n💾 Saving results to: ${outputFile}...`)
  const outputDir = path.dirname(outputFile)
  await fs.mkdir(outputDir, { recursive: true })

  // Convert to training format
  const trainingData = successful.map(r => ({
    book_id: r.book?.id,
    isbn: r.isbn,
    title: r.book?.title,
    author: r.book?.author,
    description: r.book?.description,
    categories: null, // Could be added from goodbooks metadata
    warnings: r.warnings || [],
    metadata: r.metadata
  }))

  await fs.writeFile(outputFile, JSON.stringify(trainingData, null, 2))
  console.log(`✅ Saved ${trainingData.length} training examples`)

  // Also save full results (including failures)
  const fullResultsPath = outputFile.replace('.json', '_full_results.json')
  await fs.writeFile(fullResultsPath, JSON.stringify(results, null, 2))
  console.log(`✅ Saved full results (including failures) to: ${fullResultsPath}`)

  console.log('\n✅ Scan complete!')
  console.log(`\nNext step: Train the model`)
  console.log(`   python3 scripts/train-classifier.py ${outputFile} data/models/content_warning_classifier.pkl`)

  // Show failures if any
  if (failed.length > 0) {
    console.log(`\n⚠️  Failed scans (${failed.length}):`)
    failed.slice(0, 10).forEach(r => {
      console.log(`   ${r.isbn}: ${r.error}`)
    })
    if (failed.length > 10) {
      console.log(`   ... and ${failed.length - 10} more`)
    }
  }
}

main().catch(console.error)

