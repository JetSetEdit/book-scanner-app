/**
 * Delete books that don't meet quality criteria
 * 
 * WARNING: This will permanently delete books from the database!
 * Review bookshelf-analysis.json first.
 * 
 * Usage:
 *   npm run scripts/delete-books.ts -- --dry-run  # Preview what would be deleted
 *   npm run scripts/delete-books.ts -- --confirm  # Actually delete
 */

import 'dotenv/config'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { readFile } from 'fs/promises'

interface BookToDelete {
  isbn: string
  title: string
  author: string | null
  keep: boolean
  reason: string
}

async function deleteBooks() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run')
  const isConfirm = args.includes('--confirm')

  if (!isDryRun && !isConfirm) {
    console.log('❌ Error: Must specify --dry-run or --confirm')
    console.log()
    console.log('Usage:')
    console.log('  npm run scripts/delete-books.ts -- --dry-run   # Preview deletions')
    console.log('  npm run scripts/delete-books.ts -- --confirm  # Actually delete')
    process.exit(1)
  }

  // Load analysis
  let analysisData: any
  try {
    const fileContent = await readFile('bookshelf-analysis.json', 'utf-8')
    analysisData = JSON.parse(fileContent)
  } catch (error) {
    console.error('❌ Error: Could not read bookshelf-analysis.json')
    console.error('   Run scripts/analyze-bookshelf.ts first')
    process.exit(1)
  }

  const booksToDelete = analysisData.books.filter((b: any) => !b.keep)
  const booksToKeep = analysisData.books.filter((b: any) => b.keep)

  console.log('📚 Bookshelf Cleanup')
  console.log('='.repeat(80))
  console.log(`Total books: ${analysisData.summary.total}`)
  console.log(`✅ Will keep: ${booksToKeep.length}`)
  console.log(`❌ Will delete: ${booksToDelete.length}`)
  console.log('='.repeat(80))
  console.log()

  if (isDryRun) {
    console.log('🔍 DRY RUN - Preview of books that would be deleted:')
    console.log()
    booksToDelete.slice(0, 20).forEach((book: any, idx: number) => {
      console.log(`${idx + 1}. ${book.title} by ${book.author || 'Unknown'}`)
      console.log(`   ISBN: ${book.isbn} | Reason: ${book.reason}`)
    })
    if (booksToDelete.length > 20) {
      console.log(`   ... and ${booksToDelete.length - 20} more`)
    }
    console.log()
    console.log('💡 To actually delete, run with --confirm flag')
    return
  }

  if (isConfirm) {
    console.log('⚠️  WARNING: This will permanently delete books from the database!')
    console.log()
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    console.log()
    console.log('🗑️  Deleting books...')
    console.log()

    let deleted = 0
    let errors = 0

    for (const book of booksToDelete) {
      try {
        // Delete warnings first (foreign key constraint)
        // book_id in content_warnings is the ISBN
        const { error: warningsError } = await supabaseAdmin
          .from('content_warnings')
          .delete()
          .eq('book_id', book.isbn)

        if (warningsError) {
          console.error(`  ⚠️  Failed to delete warnings for ${book.isbn}:`, warningsError.message)
        }

        // Delete the book
        const { error: deleteError } = await supabaseAdmin
          .from('books')
          .delete()
          .eq('isbn', book.isbn)

        if (deleteError) {
          console.error(`  ❌ Failed to delete ${book.title} (${book.isbn}):`, deleteError.message)
          errors++
        } else {
          deleted++
          if (deleted % 10 === 0) {
            console.log(`  ✅ Deleted ${deleted}/${booksToDelete.length} books...`)
          }
        }
      } catch (error) {
        console.error(`  ❌ Error deleting ${book.title}:`, error)
        errors++
      }
    }

    console.log()
    console.log('='.repeat(80))
    console.log('✅ Cleanup Complete!')
    console.log(`   Deleted: ${deleted}`)
    console.log(`   Errors: ${errors}`)
    console.log(`   Remaining: ${booksToKeep.length} books`)
    console.log('='.repeat(80))
  }
}

deleteBooks().catch(console.error)

