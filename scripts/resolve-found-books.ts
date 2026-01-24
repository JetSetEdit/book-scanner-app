#!/usr/bin/env tsx
/**
 * Resolve missing book reports that were found by the retry script
 * Directly creates books using the same logic as resolve-by-adding-book endpoint
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function validateCoverUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'GET', cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (!res.ok) return false
    const ct = res.headers.get('content-type') || ''
    if (!ct.startsWith('image/')) return false
    const buf = await res.arrayBuffer()
    if (buf.byteLength < 1000) return false
    return true
  } catch {
    return false
  }
}

async function resolveFoundBooks() {
  console.log('🔧 Resolving found books')
  console.log('='.repeat(80))
  console.log('')

  // Dynamically import to avoid loading admin.ts before env is ready
  const { fetchBookByISBNWithRetry, fetchByTitleAuthor } = await import('../lib/book-api')
  const { normalizeISBN, validateISBN } = await import('../lib/isbn-validation')
  const { processIsbnScan } = await import('../lib/services/scan-service')
  const { MODEL_VERSION } = await import('../lib/config/taxonomy-v2')

  // Get reports that were found by retry script
  const { data: reports, error } = await supabase
    .from('manual_handling_scans')
    .select('*')
    .eq('reason', 'not_found')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching reports:', error)
    return
  }

  // Filter for reports that were found by retry script
  const foundReports = (reports || []).filter(report => {
    const meta = report.metadata as any || {}
    return meta.retry_found === true && meta.retry_found_title
  })

  if (foundReports.length === 0) {
    console.log('   ✅ No reports found that are ready for resolution.')
    console.log('   Run the retry script first: npx tsx scripts/retry-missing-book-searches.ts')
    return
  }

  console.log(`   Found ${foundReports.length} report(s) ready for resolution\n`)

  let resolvedCount = 0
  let errorCount = 0

  for (const report of foundReports) {
    const metadata = report.metadata as any || {}
    const foundTitle = metadata.retry_found_title || report.book_title
    const foundAuthor = metadata.retry_found_author || report.book_author
    const cleanIsbn = normalizeISBN(report.isbn || '')

    console.log(`\n📖 ${foundTitle}${foundAuthor ? ` by ${foundAuthor}` : ''} (ISBN: ${cleanIsbn})`)
    console.log(`   Report ID: ${report.id}`)
    console.log(`   Found via: ${metadata.retry_search_method || 'unknown'}`)

    try {
      // Validate ISBN
      if (!cleanIsbn || !validateISBN(cleanIsbn)) {
        throw new Error('Invalid or empty ISBN')
      }

      // Check if book already exists
      const { data: existing } = await supabase
        .from('books')
        .select('id')
        .eq('isbn', cleanIsbn)
        .limit(1)

      if (existing && existing.length > 0) {
        console.log(`   ⚠️  Book already exists (ID: ${existing[0].id})`)
        // Still mark report as resolved
        const now = new Date().toISOString()
        await supabase
          .from('manual_handling_scans')
          .update({
            status: 'resolved',
            resolved_at: now,
            resolution_notes: `Book already exists in database (book_id=${existing[0].id})`,
            updated_at: now,
          })
          .eq('id', report.id)
        resolvedCount++
        continue
      }

      // Enhanced search: Try ISBN with retry, then title/author search
      let foundBookData: any = null
      let searchMethod = 'user_provided'

      // Step 1: Try ISBN search with format retry
      const isbnResult = await fetchBookByISBNWithRetry(cleanIsbn)
      if (isbnResult) {
        foundBookData = isbnResult
        searchMethod = 'isbn_with_retry'
      } else {
        // Step 2: Try title/author search
        const userTitle = metadata.user_provided_title || foundTitle
        const userAuthor = metadata.user_provided_author || foundAuthor
        if (userTitle) {
          const titleAuthorResult = await fetchByTitleAuthor(cleanIsbn, userTitle, userAuthor)
          if (titleAuthorResult) {
            foundBookData = titleAuthorResult
            searchMethod = 'title_author'
          }
        }
      }

      // Use found metadata if available, otherwise fall back to user-provided data
      const title = foundBookData?.title || foundTitle || 'Unknown'
      const author = foundBookData?.author || foundAuthor || null
      const description = foundBookData?.description || null
      const coverUrl = foundBookData?.cover_url || (await (async () => {
        const olCover = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`
        const coverOk = await validateCoverUrl(olCover)
        return coverOk ? olCover : null
      })())
      const publisher = foundBookData?.publisher || null
      const publishedDate = foundBookData?.published_date || null
      const pageCount = foundBookData?.page_count || null
      const categories = foundBookData?.categories || null

      // Create book
      const now = new Date().toISOString()
      const { data: book, error: insertErr } = await supabase
        .from('books')
        .insert({
          isbn: cleanIsbn,
          title,
          author,
          description,
          cover_url: coverUrl,
          publisher,
          published_date: publishedDate,
          page_count: pageCount,
          categories,
          created_at: now,
          updated_at: now,
        })
        .select('id')
        .single()

      if (insertErr || !book) {
        throw new Error(`Failed to create book: ${insertErr?.message || 'Unknown error'}`)
      }

      // Trigger scan
      let scanTriggered = true
      let scanError: string | undefined
      try {
        await processIsbnScan(
          cleanIsbn,
          undefined,
          undefined,
          false,
          MODEL_VERSION,
          undefined,
          'quick',
          null
        )
      } catch (e) {
        scanTriggered = false
        scanError = e instanceof Error ? e.message : String(e)
        console.warn(`   ⚠️  Scan failed: ${scanError}`)
      }

      // Mark report as resolved
      const resolutionNotes = scanTriggered
        ? `Added book from user report (found via ${searchMethod}); book_id=${book.id}. Scan triggered.`
        : `Added book from user report (found via ${searchMethod}); book_id=${book.id}. Scan failed: ${scanError}`

      await supabase
        .from('manual_handling_scans')
        .update({
          status: 'resolved',
          resolved_at: now,
          resolution_notes: resolutionNotes,
          updated_at: now,
        })
        .eq('id', report.id)

      console.log(`   ✅ Resolved successfully!`)
      console.log(`   Book ID: ${book.id}`)
      console.log(`   Scan triggered: ${scanTriggered ? 'Yes' : 'No'}`)
      if (scanError) {
        console.log(`   ⚠️  Scan error: ${scanError}`)
      }
      resolvedCount++
    } catch (error) {
      console.error(`   ❌ Failed to resolve:`, error instanceof Error ? error.message : String(error))
      errorCount++
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n')
  console.log('='.repeat(80))
  console.log('📊 Summary')
  console.log('='.repeat(80))
  console.log(`   Resolved: ${resolvedCount}`)
  console.log(`   Errors: ${errorCount}`)
  console.log(`   Total processed: ${foundReports.length}`)
  console.log('')
}

resolveFoundBooks().catch(console.error)
