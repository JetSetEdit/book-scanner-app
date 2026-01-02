#!/usr/bin/env tsx
/**
 * Export Training Data from Database
 * 
 * Exports books with their content warnings to create training data
 * for a lightweight classification model.
 * 
 * Usage: tsx scripts/export-training-data.ts [output_file]
 */

import * as dotenv from 'dotenv'
import * as fs from 'fs/promises'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local first, then .env
dotenv.config({ path: '.env.local' })
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

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

async function exportTrainingData(): Promise<TrainingExample[]> {
  console.log('📚 Exporting training data from database...\n')

  // Fetch books with descriptions and their warnings
  const { data: books, error: booksError } = await supabase
    .from('books')
    .select('id, isbn, title, author, description, categories')
    .not('description', 'is', null)
    .gte('description', '') // Non-empty description

  if (booksError) {
    console.error('❌ Error fetching books:', booksError)
    throw booksError
  }

  console.log(`✅ Found ${books.length} books with descriptions\n`)

  // Fetch warnings for each book
  const { data: warnings, error: warningsError } = await supabase
    .from('content_warnings')
    .select('book_id, subcategory_id, category_id, severity, description, context_modifiers')
    .in('book_id', books.map(b => b.id))

  if (warningsError) {
    console.error('❌ Error fetching warnings:', warningsError)
    throw warningsError
  }

  console.log(`✅ Found ${warnings.length} content warnings\n`)

  // Group warnings by book
  const warningsByBook = new Map<string, typeof warnings>()
  warnings.forEach(w => {
    if (!warningsByBook.has(w.book_id)) {
      warningsByBook.set(w.book_id, [])
    }
    warningsByBook.get(w.book_id)!.push(w)
  })

  // Build training examples
  const examples: TrainingExample[] = books
    .filter(book => {
      const bookWarnings = warningsByBook.get(book.id) || []
      return bookWarnings.length > 0 // Only books with warnings
    })
    .map(book => {
      const bookWarnings = warningsByBook.get(book.id) || []
      
      return {
        book_id: book.id,
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        description: book.description,
        categories: book.categories,
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
  const outputFile = process.argv[2] || path.join(
    process.cwd(),
    'data',
    'training',
    'exported_training_data.json'
  )

  try {
    const examples = await exportTrainingData()

    // Create output directory
    const outputDir = path.dirname(outputFile)
    await fs.mkdir(outputDir, { recursive: true })

    // Save to file
    await fs.writeFile(outputFile, JSON.stringify(examples, null, 2))

    console.log('─'.repeat(70))
    console.log('\n📊 EXPORT SUMMARY\n')
    console.log(`Total Examples: ${examples.length}`)
    console.log(`Total Warnings: ${examples.reduce((sum, e) => sum + e.warnings.length, 0)}`)
    
    // Category distribution
    const categoryCounts: Record<string, number> = {}
    examples.forEach(e => {
      e.warnings.forEach(w => {
        const cat = w.category_id || 'unknown'
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
      })
    })
    
    console.log(`\nCategory Distribution:`)
    Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([cat, count]) => {
        console.log(`   ${cat}: ${count}`)
      })

    // Severity distribution
    const severityCounts: Record<string, number> = {}
    examples.forEach(e => {
      e.warnings.forEach(w => {
        severityCounts[w.severity] = (severityCounts[w.severity] || 0) + 1
      })
    })
    
    console.log(`\nSeverity Distribution:`)
    Object.entries(severityCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([sev, count]) => {
        console.log(`   ${sev}: ${count}`)
      })

    // Description length stats
    const lengths = examples.map(e => e.metadata.description_length)
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length
    const minLength = Math.min(...lengths)
    const maxLength = Math.max(...lengths)
    
    console.log(`\nDescription Length:`)
    console.log(`   Average: ${Math.round(avgLength)} chars`)
    console.log(`   Min: ${minLength} chars`)
    console.log(`   Max: ${maxLength} chars`)

    console.log(`\n💾 Saved to: ${outputFile}`)
    console.log(`\n✅ Export complete!`)
    console.log(`\nNext step: Run training script`)
    console.log(`   python scripts/train-classifier.py ${outputFile}`)

  } catch (error) {
    console.error('❌ Export failed:', error)
    process.exit(1)
  }
}

main()

