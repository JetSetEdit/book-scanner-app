/**
 * Delete books without cover images from the database
 * 
 * This removes books that don't have cover_url set, which look bad
 * in the "Recently Scanned" section.
 * 
 * Usage:
 *   npx tsx scripts/delete-books-without-covers.ts -- --dry-run  # Preview
 *   npx tsx scripts/delete-books-without-covers.ts -- --confirm  # Actually delete
 */

import 'dotenv/config'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function deleteBooksWithoutCovers() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run')
  const isConfirm = args.includes('--confirm')

  if (!isDryRun && !isConfirm) {
    console.log('❌ Error: Must specify --dry-run or --confirm')
    console.log()
    console.log('Usage:')
    console.log('  npx tsx scripts/delete-books-without-covers.ts -- --dry-run   # Preview deletions')
    console.log('  npx tsx scripts/delete-books-without-covers.ts -- --confirm  # Actually delete')
    process.exit(1)
  }

  console.log('🔍 Finding books without covers...\n')

  // Find all books without cover_url
  const { data: books, error: booksError } = await supabaseAdmin
    .from('books')
    .select('id, isbn, title, author, cover_url')
    .or('cover_url.is.null,cover_url.eq.')

  if (booksError) {
    console.error('❌ Error fetching books:', booksError)
    process.exit(1)
  }

  // Filter to only books with null or empty cover_url
  const booksWithoutCovers = (books || []).filter(
    book => !book.cover_url || book.cover_url.trim() === ''
  )

  if (booksWithoutCovers.length === 0) {
    console.log('✅ No books without covers found!')
    return
  }

  console.log('='.repeat(80))
  console.log(`Found ${booksWithoutCovers.length} books without covers`)
  console.log('='.repeat(80))
  console.log()

  if (isDryRun) {
    console.log('🔍 DRY RUN - Books that would be deleted:')
    console.log()
    booksWithoutCovers.forEach((book, idx) => {
      console.log(`${idx + 1}. ${book.title || 'Untitled'}`)
      console.log(`   ISBN: ${book.isbn} | Author: ${book.author || 'Unknown'}`)
      console.log()
    })
    console.log('💡 To actually delete, run with --confirm flag')
    return
  }

  if (isConfirm) {
    console.log('⚠️  WARNING: This will permanently delete books and their associated data!')
    console.log()
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    console.log()
    console.log('🗑️  Deleting books without covers...')
    console.log()

    let deleted = 0
    let errors = 0

    for (const book of booksWithoutCovers) {
      try {
        // Delete content warnings first (foreign key constraint)
        // book_id in content_warnings is the book's UUID (id), not ISBN
        const { error: warningsError } = await supabaseAdmin
          .from('content_warnings')
          .delete()
          .eq('book_id', book.id)

        if (warningsError) {
          console.error(`  ⚠️  Failed to delete warnings for ${book.isbn}:`, warningsError.message)
        }

        // Delete scans
        const { error: scansError } = await supabaseAdmin
          .from('scans')
          .delete()
          .eq('isbn', book.isbn)

        if (scansError) {
          console.error(`  ⚠️  Failed to delete scans for ${book.isbn}:`, scansError.message)
        }

        // Delete the book
        const { error: deleteError } = await supabaseAdmin
          .from('books')
          .delete()
          .eq('id', book.id)

        if (deleteError) {
          console.error(`  ❌ Failed to delete ${book.title} (${book.isbn}):`, deleteError.message)
          errors++
        } else {
          deleted++
          if (deleted % 10 === 0) {
            console.log(`  ✅ Deleted ${deleted}/${booksWithoutCovers.length} books...`)
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
    console.log(`   Deleted: ${deleted} books`)
    console.log(`   Errors: ${errors}`)
    console.log('='.repeat(80))
  }
}

deleteBooksWithoutCovers().catch(console.error)

