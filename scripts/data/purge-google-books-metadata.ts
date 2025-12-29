/**
 * TOS Compliance Script: Update Stale Google Books Metadata
 * 
 * NOTE: With the hybrid cache strategy (30-day expiration), this script is less critical.
 * The system now automatically refreshes stale data (>30 days old).
 * 
 * This script can still be used to:
 * - Set last_synced_at for existing records (if missing)
 * - Manually refresh all Google Books metadata
 * 
 * Usage:
 *   npx tsx scripts/purge-google-books-metadata.ts --dry-run  # Preview changes
 *   npx tsx scripts/purge-google-books-metadata.ts --execute  # Apply changes
 */

import { supabaseAdmin } from '@/lib/supabase/admin'

interface Book {
  id: string
  isbn: string
  title: string
  cover_url: string | null
  description: string | null
  publisher: string | null
  published_date: string | null
  page_count: number | null
  categories: string[] | null
}

async function identifyGoogleBooksData(): Promise<Book[]> {
  console.log('🔍 Identifying books with likely Google Books metadata...')
  
  // Fetch all books
  const { data: books, error } = await supabaseAdmin
    .from('books')
    .select('id, isbn, title, cover_url, description, publisher, published_date, page_count, categories')
  
  if (error) {
    throw new Error(`Failed to fetch books: ${error.message}`)
  }
  
  if (!books) {
    return []
  }
  
  // Identify books with Google Books indicators
  const likelyGoogleBooks = books.filter((book: Book) => {
    // Check if cover URL is from Google Books
    if (book.cover_url && book.cover_url.includes('books.google.com')) {
      return true
    }
    
    // Check if cover URL contains Google Books API indicators
    if (book.cover_url && (
      book.cover_url.includes('gbs_api') ||
      book.cover_url.includes('printsec=frontcover')
    )) {
      return true
    }
    
    return false
  })
  
  return likelyGoogleBooks as Book[]
}

async function purgeGoogleBooksMetadata(books: Book[], dryRun: boolean = true): Promise<void> {
  console.log(`\n📊 Found ${books.length} books with likely Google Books metadata`)
  
  if (books.length === 0) {
    console.log('✅ No Google Books metadata found to purge.')
    return
  }
  
  // Show preview
  console.log('\n📋 Books that will be affected:')
  books.slice(0, 10).forEach((book, idx) => {
    console.log(`  ${idx + 1}. ${book.title} (ISBN: ${book.isbn})`)
    if (book.cover_url) console.log(`     Cover: ${book.cover_url.substring(0, 80)}...`)
  })
  if (books.length > 10) {
    console.log(`  ... and ${books.length - 10} more`)
  }
  
  if (dryRun) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be made')
    console.log('   Run with --execute to apply changes')
    return
  }
  
  console.log('\n🗑️  Purging Google Books metadata...')
  
  // Update each book to remove Google Books metadata
  // Keep: ISBN, title, author (public info)
  // Remove: cover_url, description, publisher, published_date, page_count, categories
  let updated = 0
  let errors = 0
  
  for (const book of books) {
    try {
      const { error } = await supabaseAdmin
        .from('books')
        .update({
          cover_url: null,
          description: null,
          publisher: null,
          published_date: null,
          page_count: null,
          categories: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', book.id)
      
      if (error) {
        console.error(`  ❌ Failed to update ${book.isbn}: ${error.message}`)
        errors++
      } else {
        updated++
        if (updated % 10 === 0) {
          console.log(`  ✅ Updated ${updated}/${books.length} books...`)
        }
      }
    } catch (err) {
      console.error(`  ❌ Error updating ${book.isbn}:`, err)
      errors++
    }
  }
  
  console.log(`\n✅ Purge complete:`)
  console.log(`   - Updated: ${updated}`)
  console.log(`   - Errors: ${errors}`)
  console.log(`\n⚠️  Note: Books still have ISBN, title, and author for content warning linking.`)
  console.log(`   Metadata will be fetched fresh from APIs on next request (TOS-compliant).`)
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--execute')
  
  console.log('🚀 Google Books Metadata Purge Script')
  console.log('=====================================\n')
  
  if (dryRun) {
    console.log('⚠️  Running in DRY RUN mode (no changes will be made)')
    console.log('   Add --execute flag to apply changes\n')
  } else {
    console.log('⚠️  EXECUTE MODE - Changes will be applied!')
    console.log('   This will remove metadata from books identified as Google Books sources\n')
  }
  
  try {
    const googleBooks = await identifyGoogleBooksData()
    await purgeGoogleBooksMetadata(googleBooks, dryRun)
    
    console.log('\n✅ Script completed successfully')
  } catch (error) {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  }
}

main()













