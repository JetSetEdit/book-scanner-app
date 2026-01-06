/**
 * Backup database and delete everything except high-quality recent books
 * 
 * Keeps only books that have:
 * - Age rating (CLASSIFICATION: in categories)
 * - Content warnings
 * - Valid cover image
 * - Recent scan (within last 7 days)
 */

import 'dotenv/config'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { writeFile } from 'fs/promises'
import { join } from 'path'

async function backupAndClean() {
  console.log('💾 Starting database backup and cleanup...\n')

  // Step 1: Backup all data
  console.log('📦 Step 1: Backing up database...')
  const backupDir = join(process.cwd(), 'backups')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = join(backupDir, `backup-${timestamp}.json`)

  // Fetch all books
  const { data: allBooks, error: booksError } = await supabaseAdmin
    .from('books')
    .select('*')

  if (booksError) {
    console.error('❌ Error fetching books:', booksError)
    return
  }

  // Fetch all warnings
  const { data: allWarnings, error: warningsError } = await supabaseAdmin
    .from('content_warnings')
    .select('*')

  if (warningsError) {
    console.error('❌ Error fetching warnings:', warningsError)
    return
  }

  // Fetch all scans
  const { data: allScans, error: scansError } = await supabaseAdmin
    .from('scans')
    .select('*')

  if (scansError) {
    console.error('❌ Error fetching scans:', scansError)
    return
  }

  // Fetch all audit logs
  const { data: allAuditLogs, error: auditLogsError } = await supabaseAdmin
    .from('ai_audit_logs')
    .select('*')

  if (auditLogsError) {
    console.error('❌ Error fetching audit logs:', auditLogsError)
    return
  }

  const backup = {
    timestamp: new Date().toISOString(),
    books: allBooks || [],
    content_warnings: allWarnings || [],
    scans: allScans || [],
    ai_audit_logs: allAuditLogs || []
  }

  // Ensure backup directory exists
  const { mkdir } = await import('fs/promises')
  try {
    await mkdir(backupDir, { recursive: true })
  } catch (e) {
    // Directory might already exist
  }

  await writeFile(backupFile, JSON.stringify(backup, null, 2))
  console.log(`✅ Backup saved to: ${backupFile}`)
  console.log(`   Books: ${backup.books.length}`)
  console.log(`   Warnings: ${backup.content_warnings.length}`)
  console.log(`   Scans: ${backup.scans.length}`)
  console.log(`   Audit Logs: ${backup.ai_audit_logs.length}`)
  console.log()

  // Step 2: Identify books to keep
  console.log('🔍 Step 2: Identifying books to keep...')
  
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Count warnings per book
  const warningCounts = new Map<string, number>()
  allWarnings?.forEach(w => {
    warningCounts.set(w.book_id, (warningCounts.get(w.book_id) || 0) + 1)
  })

  const booksToKeep: typeof allBooks = []
  const booksToDelete: typeof allBooks = []

  allBooks?.forEach(book => {
    const categories = book.categories || []
    const hasAgeRating = categories.some((c: string) => c.startsWith('CLASSIFICATION:'))
    const warningCount = warningCounts.get(book.id) || 0
    const hasCover = !!book.cover_url
    const lastUpdated = book.updated_at || book.created_at
    const isRecent = lastUpdated ? new Date(lastUpdated) >= sevenDaysAgo : false

    // Keep if: has age rating, has warnings, has cover, and is recent
    if (hasAgeRating && warningCount > 0 && hasCover && isRecent) {
      booksToKeep.push(book)
    } else {
      booksToDelete.push(book)
    }
  })

  console.log(`✅ Books to keep: ${booksToKeep.length}`)
  booksToKeep.forEach(book => {
    console.log(`   - ${book.title} by ${book.author || 'Unknown'}`)
  })
  console.log()
  console.log(`❌ Books to delete: ${booksToDelete.length}`)
  console.log()

  // Step 3: Confirm deletion
  console.log('⚠️  WARNING: This will permanently delete books from the database!')
  console.log(`   ${booksToDelete.length} books will be deleted`)
  console.log(`   ${booksToKeep.length} books will be kept`)
  console.log()
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...')
  await new Promise(resolve => setTimeout(resolve, 5000))
  console.log()

  // Step 4: Delete books
  console.log('🗑️  Step 3: Deleting books...')
  
  let deleted = 0
  let errors = 0

  for (const book of booksToDelete) {
    try {
      // Delete content warnings
      await supabaseAdmin
        .from('content_warnings')
        .delete()
        .eq('book_id', book.id)

      // Delete scans
      await supabaseAdmin
        .from('scans')
        .delete()
        .eq('isbn', book.isbn)

      // Delete audit logs
      await supabaseAdmin
        .from('ai_audit_logs')
        .delete()
        .eq('book_id', book.id)

      // Delete book
      const { error: deleteError } = await supabaseAdmin
        .from('books')
        .delete()
        .eq('id', book.id)

      if (deleteError) {
        console.error(`  ❌ Failed: ${book.title} - ${deleteError.message}`)
        errors++
      } else {
        deleted++
        if (deleted % 10 === 0) {
          console.log(`  ✅ Deleted ${deleted}/${booksToDelete.length} books...`)
        }
      }
    } catch (error) {
      console.error(`  ❌ Error: ${book.title} - ${error}`)
      errors++
    }
  }

  console.log()
  console.log('='.repeat(80))
  console.log('✅ Cleanup Complete!')
  console.log(`   Backup: ${backupFile}`)
  console.log(`   Deleted: ${deleted} books`)
  console.log(`   Errors: ${errors}`)
  console.log(`   Remaining: ${booksToKeep.length} books`)
  console.log('='.repeat(80))
}

backupAndClean().catch(console.error)

