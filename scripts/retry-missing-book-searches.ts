#!/usr/bin/env tsx
/**
 * Retry missing book searches with enhanced strategies
 * Attempts to find books for pending not_found reports using:
 * - ISBN format conversion and retry
 * - Title/author search
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { fetchBookByISBNWithRetry, fetchByTitleAuthor } from '@/lib/book-api'
import { normalizeISBN } from '@/lib/isbn-validation'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function retryMissingBookSearches() {
  console.log('🔄 Retrying missing book searches with enhanced strategies')
  console.log('='.repeat(80))
  console.log('')
  
  // Check if API key is configured
  const hasApiKey = !!process.env.GOOGLE_BOOKS_API_KEY
  if (!hasApiKey) {
    console.log('⚠️  WARNING: GOOGLE_BOOKS_API_KEY not configured')
    console.log('   Without an API key, Google Books API has strict rate limits.')
    console.log('   The script will use longer delays between requests.')
    console.log('   Consider adding GOOGLE_BOOKS_API_KEY to .env.local for better rate limits.')
    console.log('')
  } else {
    console.log('✅ GOOGLE_BOOKS_API_KEY detected - using higher rate limits')
    console.log('')
  }

  // Get pending not_found reports with user-provided title/author
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

  if (!reports || reports.length === 0) {
    console.log('   ✅ No pending missing book reports found.')
    return
  }

  // Filter for user-reported (have title/author)
  const userReports = reports.filter(report => {
    const meta = report.metadata as any || {}
    return meta.source === 'user_report' || 
           meta.user_reported === true || 
           !!meta.user_provided_title
  })

  if (userReports.length === 0) {
    console.log('   ✅ No user-reported missing books found (need title/author for retry).')
    return
  }

  console.log(`   Found ${userReports.length} user-reported missing book(s) to retry\n`)

  let foundCount = 0
  let notFoundCount = 0
  let errorCount = 0

  for (const report of userReports) {
    const metadata = report.metadata as any || {}
    const isbn = normalizeISBN(report.isbn || '')
    const title = metadata.user_provided_title || ''
    const author = metadata.user_provided_author || ''

    console.log(`\n📖 ${title}${author ? ` by ${author}` : ''} (ISBN: ${isbn})`)
    console.log(`   Report ID: ${report.id}`)

    let found = false
    let searchMethod = ''
    let foundMetadata: any = null
    let rateLimited = false

    // Strategy 1: Try ISBN search with format retry
    try {
      console.log('   🔍 Trying ISBN search with format retry...')
      const isbnResult = await fetchBookByISBNWithRetry(isbn)
      if (isbnResult) {
        found = true
        searchMethod = 'isbn_with_retry'
        foundMetadata = isbnResult
        console.log(`   ✅ Found via ISBN search with retry: ${isbnResult.title}`)
      } else {
        // Check if the failure was due to rate limiting by checking console output
        // The fetchBookByISBNWithRetry function logs rate limit errors
        console.log('   ❌ ISBN search with retry failed')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      const errorStr = String(error).toLowerCase()
      if (errorMsg.includes('429') || errorMsg.includes('rate limit') || errorStr.includes('429') || errorStr.includes('rate limit')) {
        rateLimited = true
        console.log('   ⚠️  Rate limited by Google Books API - skipping remaining searches for this book')
      } else {
        console.error(`   ⚠️  Error during ISBN search:`, error)
      }
    }
    
    // Check for rate limiting in the error messages from the API calls
    // The API functions log rate limit errors, but we need to detect them
    // Since errors are logged but not always thrown, we'll check the last error state
    if (!found && !rateLimited) {
      // The fetchBookByISBNWithRetry might have hit rate limits internally
      // We'll detect this by checking if we got no results and the error logs mention 429
      // For now, we'll proceed to title/author search and catch rate limits there
    }

    // Strategy 2: Try title/author search if ISBN search failed and not rate limited
    if (!found && !rateLimited && title) {
      try {
        console.log('   🔍 Trying title/author search...')
        const titleAuthorResult = await fetchByTitleAuthor(isbn, title, author)
        if (titleAuthorResult) {
          found = true
          searchMethod = 'title_author'
          foundMetadata = titleAuthorResult
          console.log(`   ✅ Found via title/author search: ${titleAuthorResult.title}`)
        } else {
          console.log('   ❌ Title/author search failed')
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        if (errorMsg.includes('429') || errorMsg.includes('rate limit') || errorMsg.includes('rate limit exceeded')) {
          rateLimited = true
          console.log('   ⚠️  Rate limited by Google Books API')
        } else {
          console.error(`   ⚠️  Error during title/author search:`, error)
        }
      }
    }

    // Update report with findings
    if (found && foundMetadata) {
      const updateMetadata = {
        ...metadata,
        retry_attempted: true,
        retry_attempted_at: new Date().toISOString(),
        retry_found: true,
        retry_search_method: searchMethod,
        retry_found_title: foundMetadata.title,
        retry_found_author: foundMetadata.author,
        retry_found_description_length: foundMetadata.description?.length || 0,
        retry_found_has_cover: !!foundMetadata.cover_url,
      }

      const { error: updateError } = await supabase
        .from('manual_handling_scans')
        .update({
          metadata: updateMetadata,
          error_message: `Book found via ${searchMethod}. Ready for resolution. Original: ${report.error_message || 'not found'}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', report.id)

      if (updateError) {
        console.error(`   ⚠️  Failed to update report:`, updateError)
        errorCount++
      } else {
        console.log(`   ✅ Report updated - book found via ${searchMethod}`)
        foundCount++
      }
    } else if (rateLimited) {
      // Mark as rate limited - needs retry later
      const updateMetadata = {
        ...metadata,
        retry_attempted: true,
        retry_attempted_at: new Date().toISOString(),
        retry_rate_limited: true,
        retry_rate_limited_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from('manual_handling_scans')
        .update({
          metadata: updateMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', report.id)

      if (updateError) {
        console.error(`   ⚠️  Failed to update report:`, updateError)
        errorCount++
      } else {
        console.log(`   ⏸️  Rate limited - will retry later`)
        notFoundCount++ // Count as not found for this run
      }
    } else {
      // Mark as verified not found after all attempts
      const updateMetadata = {
        ...metadata,
        retry_attempted: true,
        retry_attempted_at: new Date().toISOString(),
        retry_found: false,
        retry_verified_not_found: true,
      }

      const { error: updateError } = await supabase
        .from('manual_handling_scans')
        .update({
          metadata: updateMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', report.id)

      if (updateError) {
        console.error(`   ⚠️  Failed to update report:`, updateError)
        errorCount++
      } else {
        console.log(`   ⚠️  Verified not found after all search attempts`)
        notFoundCount++
      }
    }

    // Add delay between requests to avoid rate limiting
    // Without API key: Google Books has strict limits, so we need longer delays
    // With API key: Can make more requests, but still be respectful
    const delay = process.env.GOOGLE_BOOKS_API_KEY ? 1000 : 3000 // 3s delay without key, 1s with key
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  console.log('\n')
  console.log('='.repeat(80))
  console.log('📊 Summary')
  console.log('='.repeat(80))
  console.log(`   Found: ${foundCount}`)
  console.log(`   Verified not found: ${notFoundCount}`)
  console.log(`   Errors: ${errorCount}`)
  console.log(`   Total processed: ${userReports.length}`)
  console.log('')
  
  // Check if any were rate limited
  const { data: rateLimitedReports } = await supabase
    .from('manual_handling_scans')
    .select('id')
    .eq('reason', 'not_found')
    .eq('status', 'pending')
    .contains('metadata', { retry_rate_limited: true })
  
  if (rateLimitedReports && rateLimitedReports.length > 0) {
    console.log('⚠️  Rate Limiting Detected:')
    console.log(`   ${rateLimitedReports.length} report(s) were rate limited by Google Books API`)
    console.log('   These will need to be retried later (wait at least 1 hour)')
    console.log('')
  }
  
  console.log('💡 Next steps:')
  console.log('   - Review reports marked as "found" and resolve via resolve-by-adding-book endpoint')
  console.log('   - Reports marked as "verified not found" may need manual investigation')
  if (rateLimitedReports && rateLimitedReports.length > 0) {
    console.log('   - Retry rate-limited reports later: npx tsx scripts/retry-missing-book-searches.ts')
  }
  console.log('')
}

retryMissingBookSearches().catch(console.error)
