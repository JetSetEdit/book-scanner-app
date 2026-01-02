#!/usr/bin/env tsx
/**
 * Extract Training Data from Backup Files
 * 
 * Extracts books and content warnings from backup JSON files
 * and converts them to training data format.
 * 
 * Usage: tsx scripts/extract-training-from-backup.ts [backup_path] [output_file]
 */

import 'dotenv/config'
import * as fs from 'fs/promises'
import * as path from 'path'

interface Book {
  id: string
  isbn: string
  title: string
  author: string | null
  description: string | null
  categories?: string[] | null
}

interface ContentWarning {
  id: string
  book_id: string
  subcategory_id: string | null
  category_id: string | null
  severity: 'mild' | 'moderate' | 'severe'
  description: string
  context_modifiers?: string[] | null
}

interface TrainingExample {
  book_id: string
  isbn: string
  title: string
  author: string | null
  description: string | null
  categories: string[] | null
  warnings: Array<{
    subcategory_id: string
    category_id: string
    severity: 'mild' | 'moderate' | 'severe'
    description: string
    context_modifiers?: string[]
  }>
  metadata: {
    description_length: number
    warning_count: number
    has_description: boolean
  }
}

async function loadBackupFiles(backupPath: string): Promise<{
  books: Book[]
  warnings: ContentWarning[]
}> {
  const booksPath = path.join(backupPath, 'books.json')
  const warningsPath = path.join(backupPath, 'content_warnings.json')

  console.log(`📂 Loading backup from: ${backupPath}\n`)

  // Load books
  console.log(`📚 Loading books...`)
  const booksContent = await fs.readFile(booksPath, 'utf-8')
  const books: Book[] = JSON.parse(booksContent)
  console.log(`   ✅ Loaded ${books.length} books`)

  // Load warnings
  console.log(`⚠️  Loading content warnings...`)
  const warningsContent = await fs.readFile(warningsPath, 'utf-8')
  const warnings: ContentWarning[] = JSON.parse(warningsContent)
  console.log(`   ✅ Loaded ${warnings.length} warnings\n`)

  return { books, warnings }
}

function createTrainingExamples(
  books: Book[],
  warnings: ContentWarning[]
): TrainingExample[] {
  // Group warnings by book_id
  const warningsByBook = new Map<string, ContentWarning[]>()
  warnings.forEach(w => {
    if (!warningsByBook.has(w.book_id)) {
      warningsByBook.set(w.book_id, [])
    }
    warningsByBook.get(w.book_id)!.push(w)
  })

  // Create training examples
  const examples: TrainingExample[] = books
    .filter(book => {
      // Only include books with descriptions
      if (!book.description || book.description.length < 50) {
        return false
      }
      // Only include books with warnings
      const bookWarnings = warningsByBook.get(book.id) || []
      return bookWarnings.length > 0
    })
    .map(book => {
      const bookWarnings = warningsByBook.get(book.id) || []

      return {
        book_id: book.id,
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        description: book.description,
        categories: book.categories || null,
        warnings: bookWarnings.map(w => ({
          subcategory_id: w.subcategory_id || '',
          category_id: w.category_id || '',
          severity: w.severity as 'mild' | 'moderate' | 'severe',
          description: w.description || '',
          context_modifiers: Array.isArray(w.context_modifiers)
            ? w.context_modifiers as string[]
            : []
        })),
        metadata: {
          description_length: book.description?.length || 0,
          warning_count: bookWarnings.length,
          has_description: !!book.description
        }
      }
    })

  return examples
}

async function main() {
  const backupPath = process.argv[2] || path.join(
    process.cwd(),
    'backups',
    'cleanup-20260101_204757',
    'backups',
    'backup-2025-12-30T10-46-47-503Z'
  )

  const outputFile = process.argv[3] || path.join(
    process.cwd(),
    'data',
    'training',
    'backup_training_data.json'
  )

  console.log('📦 Extracting Training Data from Backup\n')
  console.log('─'.repeat(70))
  console.log(`\n📋 Configuration:`)
  console.log(`   Backup Path: ${backupPath}`)
  console.log(`   Output File: ${outputFile}\n`)

  // Check if backup exists
  try {
    await fs.access(backupPath)
  } catch {
    console.error(`❌ Backup path not found: ${backupPath}`)
    console.error(`\nAvailable backups:`)
    console.error(`   - backups/backup-2026-01-01T09-41-36-672Z/`)
    console.error(`   - backups/cleanup-20260101_204757/backups/backup-2025-12-30T10-46-47-503Z/`)
    process.exit(1)
  }

  // Load backup files
  const { books, warnings } = await loadBackupFiles(backupPath)

  // Create training examples
  console.log('🔧 Creating training examples...')
  const examples = createTrainingExamples(books, warnings)
  console.log(`   ✅ Created ${examples.length} training examples\n`)

  // Summary
  console.log('─'.repeat(70))
  console.log('\n📊 EXTRACTION SUMMARY\n')

  const totalWarnings = examples.reduce((sum, e) => sum + e.warnings.length, 0)
  const avgWarnings = examples.length > 0 ? totalWarnings / examples.length : 0

  console.log(`Total Books: ${books.length}`)
  console.log(`Books with Descriptions: ${books.filter(b => b.description && b.description.length >= 50).length}`)
  console.log(`Books with Warnings: ${examples.length}`)
  console.log(`Total Warnings: ${totalWarnings}`)
  console.log(`Avg Warnings per Book: ${avgWarnings.toFixed(1)}`)

  // Category distribution
  const categoryCounts: Record<string, number> = {}
  examples.forEach(e => {
    e.warnings.forEach(w => {
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
  examples.forEach(e => {
    e.warnings.forEach(w => {
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

  // Description length stats
  const lengths = examples.map(e => e.metadata.description_length)
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length
  const minLength = Math.min(...lengths)
  const maxLength = Math.max(...lengths)

  console.log(`\nDescription Length:`)
  console.log(`   Average: ${Math.round(avgLength)} chars`)
  console.log(`   Min: ${minLength} chars`)
  console.log(`   Max: ${maxLength} chars`)

  // Save training data
  console.log(`\n💾 Saving training data to: ${outputFile}...`)
  const outputDir = path.dirname(outputFile)
  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(outputFile, JSON.stringify(examples, null, 2))
  console.log(`✅ Saved ${examples.length} training examples`)

  console.log('\n✅ Extraction complete!')
  console.log(`\nNext step: Train the model`)
  console.log(`   python3 scripts/train-classifier.py ${outputFile} data/models/content_warning_classifier.pkl`)
}

main().catch(console.error)

