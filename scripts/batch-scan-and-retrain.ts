#!/usr/bin/env tsx
/**
 * Batch Scan and Retrain
 * 
 * Downloads goodbooks-10k dataset (if needed), scans random batches of books,
 * and retrains the classifier model incrementally.
 * 
 * Usage: tsx scripts/batch-scan-and-retrain.ts [batch_size] [num_batches]
 */

import 'dotenv/config'
import * as fs from 'fs/promises'
import * as path from 'path'
import { processIsbnScan } from '../lib/services/scan-service'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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

async function downloadDataset(): Promise<boolean> {
  // Use the current version from GitHub (not the obsolete Kaggle version)
  const datasetPath = path.join(process.cwd(), 'data', 'datasets', 'goodbooks-10k-github', 'books.csv')
  
  // Fallback to Kaggle version if GitHub version doesn't exist
  const kagglePath = path.join(process.cwd(), 'data', 'datasets', 'goodbooks-10k', 'books.csv')

  // Check if GitHub version exists (preferred)
  try {
    await fs.access(datasetPath)
    const stats = await fs.stat(datasetPath)
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
    console.log(`✅ Dataset found (GitHub version): ${datasetPath}`)
    console.log(`   Size: ${sizeMB} MB`)
    return true
  } catch {
    // Try Kaggle version as fallback
    try {
      await fs.access(kagglePath)
      const stats = await fs.stat(kagglePath)
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
      console.log(`⚠️  Using Kaggle version (obsolete): ${kagglePath}`)
      console.log(`   Size: ${sizeMB} MB`)
      console.log(`   Note: Current version available at: https://github.com/zygmuntz/goodbooks-10k`)
      return true
    } catch {
      console.log(`\n📥 Dataset not found`)
      console.log(`\n📋 To download current version:`)
      console.log(`\n   curl -L -o data/datasets/goodbooks-10k-github/books.csv \\`)
      console.log(`     https://raw.githubusercontent.com/zygmuntz/goodbooks-10k/master/books.csv`)
      console.log(`\n   Or visit: https://github.com/zygmuntz/goodbooks-10k`)
      console.log(`\n⚠️  Please download the dataset first, then run this script again.`)
      return false
    }
  }
}

async function loadGoodBooksDataset(): Promise<GoodBooksRow[]> {
  // Try GitHub version first, fallback to Kaggle
  let datasetPath = path.join(process.cwd(), 'data', 'datasets', 'goodbooks-10k-github', 'books.csv')
  try {
    await fs.access(datasetPath)
  } catch {
    datasetPath = path.join(process.cwd(), 'data', 'datasets', 'goodbooks-10k', 'books.csv')
  }
  
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
      
      // Prefer ISBN-13, fallback to ISBN-10
      // Filter out obviously invalid ISBNs (too short, contains X at wrong position, etc.)
      const isbn = row.isbn13 || row.isbn || ''
      const isbn10 = row.isbn || ''
      
      // Only include rows with valid-looking ISBN
      // ISBN-13 should be 13 digits, ISBN-10 should be 10 chars (can end with X)
      const hasValidISBN = (isbn.length === 13 && /^\d{13}$/.test(isbn)) ||
                          (isbn10.length === 10 && /^[\dX]{10}$/.test(isbn10))
      
      if (hasValidISBN) {
        rows.push({
          book_id: parseInt(row.book_id) || 0,
          isbn: isbn10 || '',
          isbn13: isbn || '',
          authors: row.authors || '',
          title: row.title || '',
          average_rating: parseFloat(row.average_rating) || 0
        })
      }
    }
  }
  
  return rows
}

function randomSample<T>(array: T[], size: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, size)
}

async function scanISBN(isbn: string, index: number, total: number): Promise<ScanResult> {
  try {
    const result = await processIsbnScan(
      isbn,
      () => {}, // Suppress progress
      undefined,
      true // Force refresh
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
        }))
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

async function loadExistingTrainingData(): Promise<any[]> {
  const filePath = path.join(process.cwd(), 'data', 'training', 'combined_training_data.json')
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
}

async function saveTrainingData(examples: any[]): Promise<void> {
  const filePath = path.join(process.cwd(), 'data', 'training', 'combined_training_data.json')
  await fs.writeFile(filePath, JSON.stringify(examples, null, 2))
}

function convertToTrainingExample(result: ScanResult): any | null {
  if (!result.success || !result.book?.description || result.warnings?.length === 0) {
    return null
  }

  return {
    book_id: result.book.id,
    isbn: result.isbn,
    title: result.book.title,
    author: result.book.author,
    description: result.book.description,
    categories: null,
    warnings: result.warnings || [],
    metadata: {
      description_length: result.book.description.length,
      warning_count: result.warnings?.length || 0,
      has_description: true
    }
  }
}

async function retrainModel(): Promise<void> {
  const trainingFile = path.join(process.cwd(), 'data', 'training', 'combined_training_data.json')
  const modelFile = path.join(process.cwd(), 'data', 'models', 'content_warning_classifier.pkl')
  
  console.log(`\n🔄 Retraining model...`)
  console.log(`   Training data: ${trainingFile}`)
  console.log(`   Model output: ${modelFile}\n`)
  
  try {
    const { stdout, stderr } = await execAsync(
      `python3 scripts/train-classifier.py "${trainingFile}" "${modelFile}"`
    )
    console.log(stdout)
    if (stderr) {
      console.error(stderr)
    }
  } catch (error: any) {
    console.error(`❌ Training failed:`, error.message)
    if (error.stdout) console.log(error.stdout)
    if (error.stderr) console.error(error.stderr)
  }
}

async function main() {
  const batchSize = parseInt(process.argv[2] || '20', 10)
  const numBatches = parseInt(process.argv[3] || '1', 10)

  console.log('🔄 Batch Scan and Retrain\n')
  console.log('─'.repeat(70))
  console.log(`\n📋 Configuration:`)
  console.log(`   Batch Size: ${batchSize} books per batch`)
  console.log(`   Number of Batches: ${numBatches}`)
  console.log(`   Total Books to Scan: ${batchSize * numBatches}\n`)

  // Check/download dataset
  const datasetExists = await downloadDataset()
  if (!datasetExists) {
    console.log(`\n⏸️  Please download the dataset first, then run this script again.`)
    process.exit(1)
  }

  // Load dataset
  console.log('📚 Loading goodbooks-10k dataset...')
  const allBooks = await loadGoodBooksDataset()
  console.log(`✅ Loaded ${allBooks.length} books from dataset\n`)

  // Load existing training data
  const existingExamples = await loadExistingTrainingData()
  console.log(`📊 Existing training examples: ${existingExamples.length}`)

  // Process batches
  for (let batchNum = 1; batchNum <= numBatches; batchNum++) {
    console.log('\n' + '─'.repeat(70))
    console.log(`\n📦 BATCH ${batchNum}/${numBatches}\n`)

    // Random sample
    const batch = randomSample(allBooks, batchSize)
    console.log(`🎲 Selected ${batch.length} random books\n`)

    // Scan each book with timeout and progress checks
    console.log(`🔍 Scanning ${batch.length} books...\n`)
    console.log(`⏱️  Batch timeout: 10 minutes`)
    console.log(`📊 Progress checks: Every 5 minutes\n`)
    
    const results: ScanResult[] = []
    const startTime = Date.now()
    const BATCH_TIMEOUT = 10 * 60 * 1000 // 10 minutes
    const PROGRESS_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes
    let lastProgressCheck = startTime

    for (let i = 0; i < batch.length; i++) {
      // Check for timeout
      const elapsed = Date.now() - startTime
      if (elapsed > BATCH_TIMEOUT) {
        console.log(`\n⏱️  Batch timeout reached (10 minutes). Moving to next batch.`)
        console.log(`   Processed: ${i}/${batch.length} books`)
        break
      }

      // Progress check every 5 minutes
      if (Date.now() - lastProgressCheck >= PROGRESS_CHECK_INTERVAL) {
        const elapsedMin = Math.floor(elapsed / 60000)
        const successCount = results.filter(r => r.success).length
        const failCount = results.filter(r => !r.success).length
        console.log(`\n📊 Progress Check (${elapsedMin} min elapsed):`)
        console.log(`   Processed: ${i}/${batch.length} books`)
        console.log(`   Successful: ${successCount}`)
        console.log(`   Failed: ${failCount}`)
        console.log(`   Time remaining: ${Math.floor((BATCH_TIMEOUT - elapsed) / 60000)} minutes\n`)
        lastProgressCheck = Date.now()
      }

      const book = batch[i]
      const isbn = book.isbn || book.isbn13
      
      if (!isbn) {
        console.log(`[${i + 1}/${batch.length}] ⚠️  Skipping: No ISBN`)
        continue
      }

      console.log(`[${i + 1}/${batch.length}] Scanning: "${book.title}" (${isbn})`)
      
      // Scan with individual timeout (30 seconds per book)
      const scanPromise = scanISBN(isbn, i, batch.length)
      const timeoutPromise = new Promise<ScanResult>((resolve) => {
        setTimeout(() => {
          resolve({
            isbn,
            success: false,
            error: 'Scan timeout (30s)'
          })
        }, 30000)
      })
      
      const result = await Promise.race([scanPromise, timeoutPromise])
      results.push(result)

      if (result.success) {
        console.log(`   ✅ Success: ${result.warnings?.length || 0} warnings`)
      } else {
        console.log(`   ❌ Failed: ${result.error}`)
      }

      // Delay to avoid rate limiting
      if (i < batch.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    console.log(`\n⏱️  Batch ${batchNum} completed in ${elapsed} minutes`)
    console.log(`   Successful: ${successCount}`)
    console.log(`   Failed: ${failCount}`)

    // Convert to training examples
    const newExamples = results
      .map(convertToTrainingExample)
      .filter(ex => ex !== null)

    console.log(`\n✅ Generated ${newExamples.length} new training examples`)

    // Add to existing data (deduplicate by ISBN)
    const existingISBNs = new Set(existingExamples.map((e: any) => e.isbn))
    const uniqueNew = newExamples.filter((e: any) => !existingISBNs.has(e.isbn))
    
    existingExamples.push(...uniqueNew)
    existingISBNs.clear()
    existingExamples.forEach((e: any) => existingISBNs.add(e.isbn))

    console.log(`📊 Total training examples: ${existingExamples.length}`)

    // Save training data
    await saveTrainingData(existingExamples)

    // Retrain model after each batch
    if (uniqueNew.length > 0) {
      console.log(`\n🔄 Retraining model with ${existingExamples.length} total examples...`)
      await retrainModel()
      console.log(`✅ Model retrained successfully`)
    } else {
      console.log(`\n⚠️  No new examples added, skipping retrain`)
    }

    // Brief pause before next batch
    if (batchNum < numBatches) {
      console.log(`\n⏸️  Pausing 5 seconds before next batch...`)
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }

  console.log('\n' + '─'.repeat(70))
  console.log('\n✅ BATCH SCAN COMPLETE!\n')
  console.log(`📊 Final Statistics:`)
  console.log(`   Total Training Examples: ${existingExamples.length}`)
  console.log(`   Total Warnings: ${existingExamples.reduce((sum: number, e: any) => sum + (e.warnings?.length || 0), 0)}`)
  console.log(`\n💾 Model saved to: data/models/content_warning_classifier.pkl`)
  console.log(`💾 Training data saved to: data/training/combined_training_data.json`)
}

main().catch(console.error)

