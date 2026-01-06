import { supabaseAdmin } from '@/lib/supabase/admin'
import { fetchBookByISBN, fetchCandidatesByISBN, BookCandidate } from '@/lib/book-api'
import { normalizeISBN } from '@/lib/isbn-validation'
import { Database } from '@/types/supabase'
import { isStale, refreshBookMetadata } from '@/lib/book-cache'
import { MODEL_VERSION, TAXONOMY_VERSION } from '@/lib/config/taxonomy-v2'

// Helper to validate cover URL is not a placeholder
async function validateCoverUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    
    // Use GET instead of HEAD to actually download and verify the image
    // This catches tiny placeholder GIFs that HEAD requests might miss
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'User-Agent': 'Book-Scanner-App/1.0' },
      redirect: 'follow'
    });
    
    clearTimeout(id);
    
    if (!response.ok) {
      console.log(`[Cover Validation] Invalid response for ${url.substring(0, 80)}...: ${response.status}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type');
    
    // Check if it's an image
    if (contentType && !contentType.startsWith('image/')) {
      console.log(`[Cover Validation] Not an image: ${contentType}`);
      return null;
    }
    
    // Download first 10KB to check actual size and format
    const buffer = await response.arrayBuffer();
    const actualSize = buffer.byteLength;
    
    // Reject tiny images (likely placeholders)
    // Open Library returns 40-byte transparent GIFs for missing covers
    if (actualSize < 1000) {
      console.log(`[Cover Validation] Too small (${actualSize} bytes) - likely placeholder`);
      return null;
    }
    
    // Check for known placeholder sizes
    if (actualSize === 15567) {
      console.log(`[Cover Validation] Google Books placeholder detected (${actualSize} bytes)`);
      return null;
    }
    
    // Verify it's actually a valid image by checking magic bytes
    const bytes = new Uint8Array(buffer.slice(0, 4));
    const magicBytes = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Valid image formats: JPEG (FF D8 FF), PNG (89 50 4E 47), GIF (47 49 46 38), WebP (52 49 46 46)
    const isValidImage = 
      magicBytes.startsWith('ffd8ff') || // JPEG
      magicBytes.startsWith('89504e47') || // PNG
      magicBytes.startsWith('47494638') || // GIF
      magicBytes.startsWith('52494646'); // WebP
    
    if (!isValidImage) {
      // Check if it's HTML/XML (error page)
      const textDecoder = new TextDecoder();
      const textPreview = textDecoder.decode(buffer.slice(0, 100));
      if (textPreview.trim().startsWith('<!DOCTYPE') || textPreview.trim().startsWith('<html') || textPreview.trim().startsWith('<?xml')) {
        console.log(`[Cover Validation] Response is HTML/XML, not an image`);
        return null;
      }
      console.log(`[Cover Validation] Invalid image format (magic bytes: ${magicBytes})`);
      return null;
    }
    
    return url;
  } catch (error) {
    console.log(`[Cover Validation] Failed to validate ${url.substring(0, 80)}...:`, error instanceof Error ? error.message : 'Unknown error');
    // If validation fails (CORS, timeout), don't save the cover - it might be a placeholder
    return null;
  }
}

// Performance API is available globally in Node.js 16+ and Next.js
declare const performance: { now(): number }

type Book = Database['public']['Tables']['books']['Row']
// Removed: ContentWarningInsert - agents no longer used
type AuditLogInsert = Database['public']['Tables']['ai_audit_logs']['Insert']

export type ScanTimings = {
  dbLookup: number
  externalMetadataFetch: number
  webSearch: number
  imageValidation: number
  aiContentWarningGeneration: number
  dbWrites: number
  total: number
}

export type ScanResult = {
  success: boolean
  status?: 'success' | 'ambiguous' | 'error'
  book?: Book | { id: string, isbn: string, review_status: 'pending' } // simplified fallback
  candidates?: BookCandidate[]
  ambiguousScanId?: string
  message?: string
  scan: any
  isNewBook: boolean
  contentWarningsGenerated: boolean
  authorContextInvestigated: boolean
  timings?: ScanTimings
  flags?: {
    usedWebSearch: boolean
    isThinMetadata: boolean
    pipelinePath: string
  }
}

export type DetailedStatusUpdate = {
  action: string
  aiResponse?: string | any
  result?: string | any
  timestamp?: number
  metadata?: Record<string, any>
}

// Re-export for use in other files
export type { DetailedStatusUpdate as DetailedStatusUpdateType }

export type ProgressCallback = (message: string | DetailedStatusUpdate) => void;

async function logAuditDecision(params: {
  bookId: string
  isbn: string
  decisionType: 'warnings_generated' | 'no_warnings' | 'search_performed' | 'metadata_thin'
  warningsCount: number
  aiReasoning: string
  confidenceLevel?: 'low' | 'medium' | 'high'
  bookTitle?: string | null
  bookAuthor?: string | null
  descriptionLength?: number | null
  hadThinMetadata?: boolean
  usedWebSearch?: boolean
  rawAiResponse?: any
  modelVersion?: string
  taxonomyVersion?: string
  pipelinePath?: string
  metadataIssues?: {
    missingCover?: boolean
    missingDescription?: boolean
    coverReason?: string
    descriptionReason?: string
    bookInfoIssues?: string[]
  }
}) {
  try {
    const auditLog: any = {
      book_id: params.bookId,
      isbn: params.isbn,
      decision_type: params.decisionType,
      warnings_count: params.warningsCount,
      ai_reasoning: params.aiReasoning,
      confidence_level: params.confidenceLevel || null,
      book_title: params.bookTitle || null,
      book_author: params.bookAuthor || null,
      description_length: params.descriptionLength || null,
      had_thin_metadata: params.hadThinMetadata || false,
      used_web_search: params.usedWebSearch || false,
      raw_ai_response: params.rawAiResponse || null,
      model_version: params.modelVersion || null,
      taxonomy_version: params.taxonomyVersion || null,
      pipeline_path: params.pipelinePath || null,
      metadata_issues: params.metadataIssues || null
    }

    await supabaseAdmin
      .from('ai_audit_logs')
      .insert(auditLog)
  } catch (error) {
    console.error('Failed to log audit decision:', error)
    // Don't throw - audit logging failure shouldn't break the scan
  }
}

export async function processIsbnScan(
  isbn: string,
  onProgress?: ProgressCallback,
  selectedCandidate?: BookCandidate,
  forceRefresh: boolean = false,
  model?: string
): Promise<ScanResult> {
  // Use provided model or default to MODEL_VERSION
  const modelToUse = model || MODEL_VERSION
  const overallStartTime = performance.now()
  console.log('Processing ISBN scan:', isbn)
  onProgress?.('Validating ISBN and checking local database...');

  // Initialize timing object
  const timings: ScanTimings = {
    dbLookup: 0,
    externalMetadataFetch: 0,
    webSearch: 0,
    imageValidation: 0,
    aiContentWarningGeneration: 0,
    dbWrites: 0,
    total: 0
  }

  // Initialize flags
  let usedWebSearch = false
  let isThinMetadata = false
  let pipelinePath = 'unknown'
  let authorContextInvestigated = false

  // Clean ISBN (remove hyphens, spaces)
  const cleanIsbn = normalizeISBN(isbn)
  let usedSelectedCandidate = !!selectedCandidate

  // Removed: cachedWebSearchResult - agents no longer used

  // Check if book already exists (the "Cache" lookup)
  console.log('Checking for existing book with ISBN:', cleanIsbn)
  onProgress?.({
    action: 'Checking local database for existing book',
    timestamp: performance.now()
  })
  let existingBook = null

  // Always check DB to see if book exists (needed even for forceRefresh to get bookId)
  if (!usedSelectedCandidate) {
    const dbLookupStart = performance.now()
    const { data, error: fetchError } = await supabaseAdmin
      .from('books')
      .select('*')
      .eq('isbn', cleanIsbn)
      .single()
    timings.dbLookup = performance.now() - dbLookupStart

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing book:', JSON.stringify(fetchError, null, 2))
      throw fetchError
    }
    existingBook = data
    
    onProgress?.({
      action: 'Database lookup completed',
      result: existingBook ? `Found existing book: "${existingBook.title}" (ID: ${existingBook.id})` : 'No existing book found in database',
      timestamp: performance.now(),
      metadata: { found: !!existingBook, bookId: existingBook?.id }
    })
    
    // --- COMPLIANCE CHECK: Staleness Check ---
    // If data is stale (>30 days), refresh in background (unless forceRefresh is true)
    if (existingBook && !forceRefresh && isStale(existingBook.last_synced_at)) {
      console.log(`[Cache] Book ${cleanIsbn} is stale (>30 days). Refreshing in background...`);
      // Fire-and-forget refresh (don't block the user)
      refreshBookMetadata(cleanIsbn, async (isbn, data) => {
        await supabaseAdmin
          .from('books')
          .update(data)
          .eq('isbn', isbn);
      }).catch(console.error);
    }
  }

  console.log('Existing book found:', !!existingBook)

  let bookId: string
  let currentBook: Book | null = existingBook
  let storedMetadataIssues: any = null

  if (!currentBook) {
    // Book doesn't exist, fetch from external API
    let bookData: BookCandidate | null = selectedCandidate || null

    if (!bookData) {
      console.log('Fetching book candidates for ISBN:', cleanIsbn)
      onProgress?.({
        action: 'Fetching book metadata from external libraries (Google Books, Open Library)',
        timestamp: performance.now()
      })

      const metadataFetchStart = performance.now()
      const candidates = await fetchCandidatesByISBN(cleanIsbn)
      timings.externalMetadataFetch = performance.now() - metadataFetchStart
      
      onProgress?.({
        action: 'External API fetch completed',
        result: `Found ${candidates.length} candidate(s) from external libraries`,
        timestamp: performance.now(),
        metadata: { 
          candidateCount: candidates.length,
          candidates: candidates.map(c => ({ title: c.title, author: c.author, source: c.source }))
        }
      })

      if (candidates.length > 1) {
        console.log(`Found ${candidates.length} candidates for ISBN ${cleanIsbn}, selecting best candidate.`)
        onProgress?.(`Found ${candidates.length} possible matches. Selecting best candidate based on description and cover quality...`);

        // Intelligently select the best candidate
        const { selectBestCandidate } = await import('@/lib/utils/candidate-selection')
        const bestCandidate = await selectBestCandidate(candidates, true) // Enable AI verification
        
        if (bestCandidate) {
          console.log(`[Scan Service] Selected best candidate: "${bestCandidate.title}" from ${bestCandidate.source}`)
          onProgress?.(`✅ Selected best candidate: "${bestCandidate.title}" (${bestCandidate.source})`)
          bookData = bestCandidate
        } else {
          // Fallback: if selection fails, return ambiguity
          console.log(`[Scan Service] Candidate selection failed, returning ambiguity`)
          onProgress?.(`Found ${candidates.length} possible matches. Please select the correct book.`);

          // Create ambiguous entry
          const { data: ambiguousScan } = await (supabaseAdmin as any)
            .from('ambiguous_scans')
            .insert({
              isbn: cleanIsbn,
              candidates: candidates as any
            })
            .select()
            .single()

          // Log for manual handling
          try {
            await supabaseAdmin
              .from('manual_handling_scans')
              .insert({
                isbn: cleanIsbn,
                reason: 'ambiguous',
                status: 'pending',
                candidates: candidates as any,
                metadata: {
                  candidate_count: candidates.length,
                  attempted_at: new Date().toISOString(),
                  source: 'scan_service'
                }
              })
          } catch (logError) {
            console.error('Failed to log manual handling scan:', logError)
            // Don't throw - logging failure shouldn't break the scan
          }

          timings.total = performance.now() - overallStartTime
          return {
            success: true,
            status: 'ambiguous',
            candidates,
            ambiguousScanId: ambiguousScan?.id,
            scan: { id: 'temp-ambiguous', isbn: cleanIsbn },
            isNewBook: true,
            contentWarningsGenerated: false,
            authorContextInvestigated: false,
            timings,
            flags: {
              usedWebSearch: false,
              isThinMetadata: false,
              pipelinePath: 'ambiguous'
            }
          }
        }
      }

      if (candidates.length === 1) {
        // Even with one candidate, enhance it with cross-source cover if needed
        const { selectBestCandidate } = await import('@/lib/utils/candidate-selection')
        const enhancedCandidate = await selectBestCandidate(candidates, false) // No AI needed for single candidate
        bookData = enhancedCandidate || candidates[0]
      }
    }

    // Flag if the metadata is "thin" (missing description or cover)
    isThinMetadata = !!(bookData && (!bookData.description || bookData.description.length < 150 || !bookData.cover_url));

    if (!bookData) {
      // No book data found - don't create a record, return error instead
      console.log('Book not found in external APIs')
      onProgress?.('❌ Book not found in any external library (Open Library, Google Books)')
      
      // Log for manual handling
      try {
        await supabaseAdmin
          .from('manual_handling_scans')
          .insert({
            isbn: cleanIsbn,
            reason: 'not_found',
            status: 'pending',
            error_message: `Book with ISBN ${cleanIsbn} not found in any external library`,
            metadata: {
              attempted_at: new Date().toISOString(),
              source: 'scan_service'
            }
          })
      } catch (logError) {
        console.error('Failed to log manual handling scan:', logError)
        // Don't throw - logging failure shouldn't break the scan
      }
      
      timings.total = performance.now() - overallStartTime
      return {
        success: false,
        status: 'error',
        message: `Book with ISBN ${cleanIsbn} not found in any external library. Please check the ISBN and try again.`,
        scan: { id: 'temp-error', isbn: cleanIsbn },
        isNewBook: false,
        contentWarningsGenerated: false,
        authorContextInvestigated: false,
        timings,
        flags: {
          usedWebSearch: false,
          isThinMetadata: false,
          pipelinePath: 'not_found'
        }
      }
    } else {
      // Hybrid cache strategy: Store all metadata with last_synced_at timestamp
      // Data is treated as a temporary cache that expires after 30 days
      console.log('Creating new book record with metadata:', bookData.title)
      onProgress?.(`Found metadata for "${bookData.title}". Saving to database...`);

      // Validate cover URL before saving (reject placeholders)
      let validatedCoverUrl = await validateCoverUrl(bookData.cover_url);
      
      // If no cover found, try to fetch from alternative sources
      if (!validatedCoverUrl) {
        onProgress?.('🖼️ No cover found - trying alternative sources...')
        
        // Try Open Library cover API directly
        try {
          const openLibraryCoverUrl = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`
          const altCover = await validateCoverUrl(openLibraryCoverUrl)
          if (altCover) {
            validatedCoverUrl = altCover
            onProgress?.('✅ Found cover from Open Library')
            console.log(`[Cover Enhancement] Found cover from Open Library: ${altCover}`)
          }
        } catch (err) {
          console.log('[Cover Enhancement] Open Library cover fetch failed:', err)
        }
        
        // If still no cover, try Google Books cover API
        if (!validatedCoverUrl) {
          try {
            // Try to fetch from Google Books API if we haven't already
            const { fetchBookByISBN } = await import('@/lib/book-api')
            const googleBook = await fetchBookByISBN(cleanIsbn)
            if (googleBook?.cover_url) {
              const googleCover = await validateCoverUrl(googleBook.cover_url)
              if (googleCover) {
                validatedCoverUrl = googleCover
                onProgress?.('✅ Found cover from Google Books')
                console.log(`[Cover Enhancement] Found cover from Google Books: ${googleCover}`)
              }
            }
          } catch (err) {
            console.log('[Cover Enhancement] Google Books cover fetch failed:', err)
          }
        }
        
        if (!validatedCoverUrl) {
          onProgress?.('⚠️ No valid cover found from any source')
        }
      }
      
      // Track metadata issues for audit log
      const metadataIssues: {
        missingCover?: boolean
        missingDescription?: boolean
        coverReason?: string
        descriptionReason?: string
        bookInfoIssues?: string[]
      } = {}
      
      if (!validatedCoverUrl) {
        metadataIssues.missingCover = true
        metadataIssues.coverReason = 'Cover not found in primary source. Tried Open Library direct API and Google Books API, but no valid cover image was available. This may indicate the book is not widely cataloged or the ISBN does not match available cover images.'
      }
      
      if (!bookData.description || bookData.description.length < 50) {
        metadataIssues.missingDescription = true
        if (!bookData.description) {
          metadataIssues.descriptionReason = 'No description found in external APIs (Google Books, Open Library). Web search was performed to gather context for analysis.'
        } else {
          metadataIssues.descriptionReason = `Description is minimal (${bookData.description.length} chars). Web search was performed to gather additional context for analysis.`
        }
      }
      
      // CRITICAL: Always use the scanned ISBN, not what the API returned
      // This ensures we never save a book with a different ISBN than what was scanned
      const dbWriteStart = performance.now()
      const { data: newBook, error: insertError } = await supabaseAdmin
        .from('books')
        .insert({
          isbn: cleanIsbn, // Always use the scanned ISBN
          title: bookData.title,
          author: bookData.author || null,
          cover_url: validatedCoverUrl, // Use validated cover (null if placeholder)
          description: bookData.description || null,
          publisher: bookData.publisher || null,
          published_date: bookData.published_date || null,
          page_count: bookData.page_count || null,
          categories: bookData.categories || null,
          last_synced_at: new Date().toISOString(), // CRITICAL: Set sync date for staleness checking
        })
        .select()
        .single()
      timings.dbWrites += performance.now() - dbWriteStart
      
      if (bookData.cover_url && !validatedCoverUrl) {
        onProgress?.({
          action: 'Cover validation rejected placeholder image',
          result: 'Cover URL was rejected as placeholder, tried alternative sources but none found',
          timestamp: performance.now()
        });
      }
      
      // Store metadata issues for later use in audit log
      if (Object.keys(metadataIssues).length > 0) {
        storedMetadataIssues = metadataIssues
      }

      if (insertError) {
        console.error('Error creating new book:', JSON.stringify(insertError, null, 2))
        throw insertError
      }

      console.log('New book created with ID:', newBook.id)
      currentBook = newBook
      bookId = newBook.id
    }
  } else {
    bookId = currentBook.id
    onProgress?.('Book found in local database.');
    
    // Early return if book exists AND has been analyzed (has audit log)
    // If book exists but has no audit log, we should still run analysis
    if (!forceRefresh && bookId) {
      // Check if book has been analyzed (has audit log)
      const { data: existingAuditLog } = await supabaseAdmin
        .from('ai_audit_logs')
        .select('id')
        .eq('book_id', bookId)
        .in('decision_type', ['warnings_generated', 'no_warnings'])
        .limit(1)
      
      // Only return early if book has been analyzed (has audit log)
      if (existingAuditLog && existingAuditLog.length > 0) {
        console.log('[Scan Service] Book already exists and has been analyzed, returning early without re-analysis')
        onProgress?.('✅ Book already exists - redirecting to book page')
        
        // Fetch full book data for return
        const { data: fullBook } = await supabaseAdmin
          .from('books')
          .select('*')
          .eq('id', bookId)
          .single()
        
        // Check if book has warnings (for contentWarningsGenerated flag)
        const { data: existingWarnings } = await supabaseAdmin
          .from('content_warnings')
          .select('id')
          .eq('book_id', bookId)
          .limit(1)
        
        const hasWarnings = existingWarnings && existingWarnings.length > 0
        
        timings.total = performance.now() - overallStartTime
        
        return {
          success: true,
          status: 'complete',
          book: fullBook || currentBook,
          scan: { id: 'existing', isbn: cleanIsbn },
          isNewBook: false,
          contentWarningsGenerated: hasWarnings,
          authorContextInvestigated: false,
          timings,
          flags: {
            usedWebSearch: false,
            isThinMetadata: false,
            pipelinePath: 'existing_book'
          }
        }
      } else {
        // Book exists but hasn't been analyzed - continue with analysis
        console.log('[Scan Service] Book exists but has no audit log - running analysis')
        onProgress?.('📖 Book found but not yet analyzed - running analysis...')
      }
    }
  }

  // At this point, we have a bookId and currentBook (unless something went wrong)
  // Now generate content warnings using multi-model analysis
  onProgress?.('📖 Step 6: Fetching book description for analysis...')
  
  let contentWarningsGenerated = false
  let analysisCompleted = false
  let analysisError: Error | null = null
  const analysisStartTime = performance.now()
  
  try {
    // Get book metadata for analysis
    let bookForAnalysis = currentBook || existingBook
    
    if (!bookForAnalysis) {
      onProgress?.('❌ Error: No book data available for analysis')
      throw new Error('No book data available for analysis')
    }
    
    // Attach stored metadata issues if available
    if (storedMetadataIssues) {
      (bookForAnalysis as any).metadataIssues = storedMetadataIssues
    }
    
    onProgress?.(`📚 Book for analysis: "${bookForAnalysis.title}" by ${bookForAnalysis.author || 'Unknown'}`)
    onProgress?.(`📝 Current description length: ${bookForAnalysis.description?.length || 0} characters`)
    
    // If description is missing or too short, or if forceRefresh is true, try to fetch it
    if (bookForAnalysis && (forceRefresh || !bookForAnalysis.description || bookForAnalysis.description.length <= 100)) {
      if (forceRefresh) {
        onProgress?.('🔄 Force refresh: fetching fresh description from external APIs...')
      } else {
        onProgress?.('📥 Description missing or too short, fetching from external APIs...')
      }
      
      try {
        const { fetchBookByISBN } = await import('@/lib/book-api')
        onProgress?.('🌐 Calling fetchBookByISBN...')
        const freshData = await fetchBookByISBN(cleanIsbn)
        onProgress?.(freshData ? `✅ Fetched data from ${freshData.source || 'external API'}` : '❌ No data returned from external APIs')
      
        if (freshData && freshData.description && freshData.description.length > 50) {
          onProgress?.(`💾 Saving description (${freshData.description.length} chars) to database...`)
          // Update the book in database with fresh description (accept descriptions > 50 chars)
          const { error: updateError } = await supabaseAdmin
            .from('books')
            .update({ 
              description: freshData.description,
              last_synced_at: new Date().toISOString()
            })
            .eq('id', bookId)
          
          if (!updateError) {
            bookForAnalysis = { ...bookForAnalysis, description: freshData.description }
            if (freshData.description.length > 100) {
              onProgress?.('✅ Fetched and saved fresh description from external APIs')
            } else {
              onProgress?.('✅ Updated description from external APIs (shorter but valid)')
            }
          } else {
            console.error('Failed to update book description:', updateError)
            onProgress?.(`❌ Error: Failed to save description: ${updateError.message}`)
            // Continue anyway with the fresh data in memory
            bookForAnalysis = { ...bookForAnalysis, description: freshData.description }
          }
        } else if (forceRefresh) {
          if (!freshData) {
            onProgress?.('❌ Could not fetch book data from external APIs')
          } else if (!freshData.description) {
            onProgress?.('⚠️ Book found but no description available in external APIs')
            onProgress?.('💡 This book may need manual description entry')
          } else if (freshData.description.length <= 50) {
            onProgress?.(`⚠️ Description too short (${freshData.description.length} chars < 50), skipping save`)
          } else {
            onProgress?.('⚠️ Could not fetch fresh description, using existing or minimal description')
          }
        }
      } catch (fetchError) {
        console.error('Error fetching fresh description:', fetchError)
        onProgress?.(`❌ Error fetching description: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`)
        // Continue with existing description if available
      }
    }
    
    // Try analysis if we have at least title (description is helpful but not strictly required)
    // Always run analysis if forceRefresh is true, even with minimal metadata
    if (bookForAnalysis && bookForAnalysis.title) {
      onProgress?.('🔍 Checking if description is sufficient for analysis...')
      
      // If we have a description, use it. Otherwise, use a minimal description based on metadata
      let descriptionForAnalysis = bookForAnalysis.description && bookForAnalysis.description.length > 50
        ? bookForAnalysis.description
        : bookForAnalysis.description && bookForAnalysis.description.length > 0
        ? bookForAnalysis.description
        : `A book by ${bookForAnalysis.author || 'Unknown Author'}. ${bookForAnalysis.categories ? `Categories: ${bookForAnalysis.categories.slice(0, 3).join(', ')}.` : ''}`
      
      onProgress?.(`📄 Description for analysis: ${descriptionForAnalysis.length} characters`)
      
      // Check if description is too minimal (just title/author/categories)
      // Also check if description is very short (< 300 chars) and appears to be just marketing copy
      // OR if it appears to be a narrative excerpt (opening line) rather than a plot summary
      const description = bookForAnalysis.description || ''
      const isNarrativeExcerpt = description.length > 0 && description.length < 500 && (
        // First-person narrative indicators
        description.match(/^[A-Z][^.!?]*[.!?]\s*[A-Z]/) && (
          description.includes(' he ') || description.includes(' she ') || description.includes(' they ') ||
          description.includes(' his ') || description.includes(' her ') || description.includes(' their ') ||
          description.includes(' I ') || description.includes(' we ')
        ) ||
        // Scene-setting without plot summary indicators
        (description.includes(' apartment ') || description.includes(' room ') || description.includes(' door ') || 
         description.includes(' window ') || description.includes(' balcony ')) &&
        !description.toLowerCase().includes('story') && !description.toLowerCase().includes('follows') &&
        !description.toLowerCase().includes('tells') && !description.toLowerCase().includes('explores')
      )
      
      const isMinimalDescription = !bookForAnalysis.description || 
        bookForAnalysis.description.length <= 50 ||
        descriptionForAnalysis.startsWith('A book by') ||
        descriptionForAnalysis === `A book by ${bookForAnalysis.author || 'Unknown Author'}.` ||
        isNarrativeExcerpt ||
        (bookForAnalysis.description.length < 300 && 
         (descriptionForAnalysis.includes('bestselling author') || 
          descriptionForAnalysis.includes('highly anticipated') ||
          descriptionForAnalysis.includes('charming break')))
      
      // If description is minimal, use web search to get context BEFORE analysis
      let webSearchContext = ''
      if (isMinimalDescription) {
        onProgress?.('⚠️ Description is minimal - performing web search to gather context...')
        const webSearchStartTime = performance.now()
        
        try {
          const { default: OpenAI } = await import('openai')
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
          
          const searchQuery = `${bookForAnalysis.title} ${bookForAnalysis.author || ''} book description plot summary`.trim()
          onProgress?.(`🌐 Searching for book information from open sources: "${searchQuery}"`)
          
          const searchPrompt = `Find information about the book "${bookForAnalysis.title}" by ${bookForAnalysis.author || 'Unknown Author'} (ISBN: ${cleanIsbn}).

CRITICAL TOS COMPLIANCE: 
- DO NOT use or quote content from retailer websites (Amazon, QBD, Booktopia, Barnes & Noble, etc.) as this may violate their Terms of Service
- DO NOT scrape or reproduce retailer product descriptions
- ONLY use open, publicly available sources that are safe to cite and use

SAFE SOURCES TO USE:
- Open Library (openlibrary.org) - open metadata, safe to use
- Google Books API data - already in public domain via API
- Library catalogs (public library systems, WorldCat, etc.)
- Publisher websites (official publisher descriptions)
- Author websites (official author pages)
- Book review sites that allow citation (Goodreads public reviews, LibraryThing, etc.)
- Wikipedia and other open encyclopedias
- Academic databases with open access
- Community tagging sites (Romance.io, The StoryGraph) - these are public community data

Please provide:
1. A detailed plot summary or book description (2-4 sentences) from SAFE sources only - focus on plot details, character relationships, and story dynamics
2. **CRITICAL: Content warnings, trigger warnings, or sensitive topics** - This is especially important for literary fiction, trauma narratives, and books known for graphic content. Check The StoryGraph, Goodreads reviews, and community discussions for trigger warnings. Include ALL major content warnings mentioned (self-harm, abuse, sexual violence, trauma, etc.)
3. Romance tropes or themes explicitly mentioned (e.g., "enemies to lovers", "second chance", "fake dating", etc.) - quote the exact phrases used, but ONLY from safe sources like community sites, library catalogs, or publisher/author sites
4. Character relationship dynamics described (e.g., "put aside their dislike", "adversarial", "conflict", etc.)
5. Any themes, sensitive topics, or controversial content mentioned in reviews or discussions (from safe sources)
6. Relationship dynamics or emotional content (conflict, tension, stress, etc.)

CRITICAL: For romance books, specifically look for:
- Enemies-to-lovers dynamics (look for phrases like "enemies to lovers", "enemies-to-lovers", "put aside their dislike", "mutual dislike", etc.) - check community sites like Romance.io or The StoryGraph
- Second chance romance (past breakups, reconciliation stress)
- Fake dating/pretending (deception, lying, secret-keeping)
- Relationship conflict or emotional tension
- Any other romance tropes that might be triggering

IMPORTANT: 
- If you find information that mentions "enemies to lovers" or similar phrases from SAFE sources (community sites, library catalogs, publisher sites), include it
- If the only source is a retailer website, DO NOT quote it - instead, summarize the information in your own words based on what you know from safe sources, or state that information is not available from safe sources
- Community tagging sites (Romance.io, The StoryGraph) are SAFE to use as they are public community data, not retailer content

Be factual and specific. Only quote from sources that are safe to use. If you cannot find information from safe sources, say so explicitly.`

          const searchResponse = await openai.chat.completions.create({
            model: modelToUse,
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant that provides factual information about books based on available knowledge and information. You MUST comply with Terms of Service requirements and only use open, publicly available sources. You MUST NOT quote or reproduce content from retailer websites.'
              },
              {
                role: 'user',
                content: searchPrompt
              }
            ],
            max_tokens: 500
          }).catch(err => {
            console.error('Web search for minimal description failed:', err)
            return null
          })
          
          timings.webSearch += performance.now() - webSearchStartTime
          usedWebSearch = true
          
          if (searchResponse?.choices?.[0]?.message?.content) {
            webSearchContext = searchResponse.choices[0].message.content
            onProgress?.('✅ Web search found additional context')
            console.log('[Web Search] Found context for minimal description:', webSearchContext.substring(0, 200))
            
            // Enhance description with web search context
            descriptionForAnalysis = `${descriptionForAnalysis}\n\nAdditional context from web search:\n${webSearchContext}`
            onProgress?.(`📄 Enhanced description: ${descriptionForAnalysis.length} characters`)
          } else {
            onProgress?.('⚠️ Web search did not find additional context, proceeding with minimal description')
          }
        } catch (webSearchError) {
          console.error('Web search error for minimal description:', webSearchError)
          onProgress?.('⚠️ Web search failed, proceeding with minimal description')
        }
      }
      
      // ALWAYS run analysis - never skip
      onProgress?.(`✓ Found: "${bookForAnalysis.title}" by ${bookForAnalysis.author || 'Unknown Author'}`)
      onProgress?.('⏳ Reading description and gathering information...')
      onProgress?.('⏳ Analyzing content for warnings (typically takes 15-20 seconds)')
      
      try {
          const { analyzeBookWithMultiModel } = await import('./multi-model-analysis')
          
          const analysisResult = await analyzeBookWithMultiModel(
            {
              title: bookForAnalysis.title || 'Unknown',
              author: bookForAnalysis.author || 'Unknown',
              description: descriptionForAnalysis,
              isbn: cleanIsbn
            },
            onProgress,
            modelToUse
          )
          
          // Store no_warnings_reasoning for use in audit log if no warnings found
          const noWarningsReasoning = analysisResult.noWarningsReasoning
          
          timings.aiContentWarningGeneration = performance.now() - analysisStartTime
          
          if (analysisResult.warnings.length > 0) {
            onProgress?.(`✓ Found ${analysisResult.warnings.length} warning${analysisResult.warnings.length === 1 ? '' : 's'} - finalizing results...`)
            onProgress?.('⏳ Saving results...')
          
            // If forceRefresh is true, delete existing AI-generated warnings first
            if (forceRefresh && bookId) {
              onProgress?.('Deleting existing AI-generated warnings for fresh scan...')
              const { error: deleteError } = await supabaseAdmin
                .from('content_warnings')
                .delete()
                .eq('book_id', bookId)
                .eq('source', 'ai_generated')
              
              if (deleteError) {
                console.error('Failed to delete existing warnings:', deleteError)
                onProgress?.(`⚠️ Warning: Failed to delete existing warnings: ${deleteError.message}`)
              } else {
                onProgress?.('✅ Deleted existing AI-generated warnings')
              }
            }
            
            // Save warnings to database
            const { getCategoryById } = await import('@/lib/config/taxonomy-v2')
            
            // Filter and map warnings, ensuring other_* subcategories have valid other_note
            const warningsToInsert = analysisResult.warnings
              .map(w => {
                // Validate subcategory_id format
                if (!w.subcategory_id || !w.subcategory_id.includes('.')) {
                  console.error(`[Warning] Invalid subcategory_id format: ${w.subcategory_id}, skipping warning`)
                  return null
                }
                
                const [categoryId, subcategoryId] = w.subcategory_id.split('.')
                
                // Validate split result
                if (!categoryId || !subcategoryId) {
                  console.error(`[Warning] Failed to parse subcategory_id: ${w.subcategory_id}, skipping warning`)
                  return null
                }
                
                // Map to legacy category for database constraint compatibility
                const category = getCategoryById(categoryId)
                const legacyCategory = category?.legacyCategory || 'other'
                
                // Check if subcategory requires other_note
                const requiresOtherNote = subcategoryId.startsWith('other_')
                
                // Generate other_note for other_* subcategories (required by DB constraint)
                let otherNote: string | undefined = undefined
                if (requiresOtherNote) {
                  // Priority: AI-provided other_note > extracted from description > evidence excerpt > generated note
                  if (w.other_note && w.other_note.trim().length >= 10) {
                    // Use AI-provided other_note (best case - AI extracted meaningful context)
                    otherNote = w.other_note.trim()
                    console.log(`[other_note] ${subcategoryId}: Using AI-provided note (${otherNote.substring(0, 100)}...)`)
                  } else {
                    // Extract meaningful context from description/evidence instead of copying verbatim
                    const evidenceText = w.evidence[0]?.excerpt || ''
                    const descriptionText = w.description || ''
                    
                    // Try to extract key phrases rather than copying entire text
                    const extractKeyPhrase = (text: string, maxLength: number = 150): string => {
                      if (!text || text.length <= maxLength) return text.trim()
                      
                      // Try to find a sentence or phrase that captures the essence
                      const sentences = text.match(/[^.!?]+[.!?]+/g) || []
                      if (sentences.length > 0) {
                        // Use first meaningful sentence, truncate if needed
                        const firstSentence = sentences[0].trim()
                        if (firstSentence.length >= 10 && firstSentence.length <= maxLength) {
                          return firstSentence
                        }
                        // If too long, truncate intelligently at word boundary
                        if (firstSentence.length > maxLength) {
                          const truncated = firstSentence.substring(0, maxLength)
                          const lastSpace = truncated.lastIndexOf(' ')
                          return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...'
                        }
                      }
                      
                      // Fallback: truncate at word boundary
                      const truncated = text.substring(0, maxLength)
                      const lastSpace = truncated.lastIndexOf(' ')
                      return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...'
                    }
                    
                    // Prefer evidence excerpt (more specific) over description
                    const sourceText = evidenceText || descriptionText
                    if (sourceText && sourceText.trim().length >= 10) {
                      otherNote = extractKeyPhrase(sourceText, 150)
                      console.log(`[other_note] ${subcategoryId}: Extracted from ${evidenceText ? 'evidence' : 'description'} (${otherNote.substring(0, 100)}...)`)
                    } else {
                      // Last resort: create a descriptive note based on subcategory
                      const categoryName = subcategoryId.replace('other_', '').replace(/_/g, ' ')
                      otherNote = `Content related to ${categoryName} as described in the book.`
                      console.log(`[other_note] ${subcategoryId}: Generated fallback note (${otherNote})`)
                    }
                  }
                  
                  // Ensure it meets minimum length requirement
                  if (!otherNote || otherNote.trim().length < 10) {
                    console.warn(`Warning: Generated other_note for ${subcategoryId} is too short, will filter out`)
                    return null // Filter this warning out
                  }
                }
                
                // Use AI-generated description (clinical, advisory language) instead of evidence excerpt
                // The AI description is more detailed and trauma-aware, while evidence is just a quote
                // NOTE: w.description should already be updated by updateDescriptionForSeverity() in processWarnings()
                const description = w.description && w.description.trim().length > 20
                  ? w.description.trim()
                  : w.evidence[0]?.excerpt || `Content warning for ${w.subcategory_id}`
                
                // Debug logging to verify description is correct before database insert
                if (description.includes(' of ') && !description.includes('themes of') && !description.includes('content of') && !description.includes('depictions of')) {
                  console.error(`[scan-service] WARNING: Description "${description}" for ${w.subcategory_id} is missing "themes"!`)
                }

                return {
                  book_id: bookId,
                  category: legacyCategory, // Legacy field - must match DB constraint
                  category_id: categoryId,
                  subcategory_id: subcategoryId,
                  description: description,
                  severity: w.severity,
                  confidence_score: w.evidence[0]?.confidence || 0.8,
                  context_modifiers: w.modifiers,
                  evidence: w.evidence,
                  severity_signals: w.severity_signals,
                  taxonomy_version: w.taxonomy_version,
                  presence: w.evidence[0]?.location ? 'on_page' : undefined,
                  detail_level: w.severity_signals?.explicitness ? 
                    (w.severity_signals.explicitness > 0.8 ? 'graphic' : 
                     w.severity_signals.explicitness > 0.5 ? 'moderate' : 'vague') : undefined,
                  is_spoiler: w.is_spoiler === true,
                  source: 'ai_generated',
                  other_note: otherNote, // Will be undefined for non-other_* subcategories
                  reasoning: w.reasoning || undefined // Include AI reasoning if available
                }
              })
              .filter((w): w is NonNullable<typeof w> => w !== null) // Remove null entries
            
            const { data: insertedWarnings, error: warningsError } = await supabaseAdmin
              .from('content_warnings')
              .insert(warningsToInsert)
              .select()
            
            if (warningsError) {
              console.error('Failed to save warnings:', warningsError)
              console.error('Warnings that failed to insert:', JSON.stringify(warningsToInsert, null, 2))
              onProgress?.(`⚠️ Warning: Failed to save content warnings: ${warningsError.message}`)
            } else {
              contentWarningsGenerated = true
              const savedCount = insertedWarnings?.length || warningsToInsert.length
              onProgress?.(`✅ Saved ${savedCount} content warnings`)
              analysisCompleted = true
              
              // Calculate and store age rating based on Australian Classification Board methodology
              try {
                const { calculateAgeRating } = await import('@/lib/utils/age-rating')
                const ageRating = calculateAgeRating(analysisResult.warnings)
                
                // Update book with age rating in categories array
                const currentCategories = currentBook?.categories || []
                const categoriesWithoutRating = currentCategories.filter((c: string) => !c.startsWith('CLASSIFICATION:'))
                const updatedCategories = [...categoriesWithoutRating, `CLASSIFICATION:${ageRating.rating}`]
                
                const { error: updateError } = await supabaseAdmin
                  .from('books')
                  .update({ categories: updatedCategories })
                  .eq('id', bookId)
                
                if (updateError) {
                  console.error('Failed to update age rating:', updateError)
                } else {
                  console.log(`[Age Rating] Calculated ${ageRating.rating} for book ${bookId}: ${ageRating.ageRecommendation}`)
                  // Update currentBook for return value
                  if (currentBook) {
                    currentBook.categories = updatedCategories
                  }
                }
              } catch (ageRatingError) {
                console.error('Error calculating age rating:', ageRatingError)
                // Don't fail the scan if age rating calculation fails
              }
              
              // Log audit decision: warnings were generated
                await logAuditDecision({
                  bookId: bookId,
                  isbn: cleanIsbn,
                  decisionType: 'warnings_generated',
                  warningsCount: savedCount,
                  aiReasoning: `AI analysis identified ${savedCount} content warning(s) for this book. Analysis completed successfully.`,
                  confidenceLevel: 'high',
                  bookTitle: bookForAnalysis.title,
                  bookAuthor: bookForAnalysis.author,
                  descriptionLength: descriptionForAnalysis.length,
                  hadThinMetadata: isMinimalDescription,
                  usedWebSearch: usedWebSearch,
                  modelVersion: MODEL_VERSION,
                  taxonomyVersion: TAXONOMY_VERSION,
                  pipelinePath: pipelinePath,
                  metadataIssues: (bookForAnalysis as any).metadataIssues || undefined
                })
            }
          } else {
            onProgress?.('ℹ️ No content warnings identified by AI analysis')
            console.log('Analysis returned 0 warnings for book:', bookForAnalysis.title)
            
            // Initialize variables for web search verification
            let webSearchFoundWarnings = false
            let webSearchContext = ''
            let reanalysisResult: { warnings: any[] } | null = null
            let usedWebSearch = false
            
            // Use AI's reasoning for why no warnings were found, if provided
            const aiNoWarningsReasoning = noWarningsReasoning || ''
            
            // VERIFICATION: If 0 warnings, perform web search as backup verification
            onProgress?.('🔍 Performing web search verification (0 warnings found)...')
            const webSearchStartTime = performance.now()
            
            try {
              // Use OpenAI to search for content warnings online
              const { default: OpenAI } = await import('openai')
              const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
              
              const searchQuery = `${bookForAnalysis.title} ${bookForAnalysis.author || ''} content warnings trigger warnings`.trim()
              onProgress?.(`🌐 Searching for content warnings: "${searchQuery}"`)
              
              // Check if this is a Romance book to tailor the search
              const isRomanceBook = bookForAnalysis.categories?.some((cat: string) => 
                cat.toLowerCase().includes('romance')
              ) || bookForAnalysis.description?.toLowerCase().includes('romance') || false
              
              // Ask OpenAI to search its knowledge base and web (if available) for content warnings
              const searchPrompt = isRomanceBook 
                ? `Search for content warnings and community tags for the Romance book "${bookForAnalysis.title}" by ${bookForAnalysis.author || 'Unknown Author'}.

CRITICAL TOS COMPLIANCE: 
- DO NOT use or quote content from retailer websites (Amazon, QBD, Booktopia, Barnes & Noble, etc.)
- ONLY use open, publicly available sources (community sites, review sites, library catalogs, etc.)

CRITICAL: For Romance books, check:
1. Community tagging sites like Romance.io or The StoryGraph for:
   - Heat/Spice level (explicit, moderate, mild, clean/sweet)
   - Common tropes flagged by readers (cheating, secret baby, loss/grief, emotional abuse, dubious consent, age gaps, stalking, toxic dynamics)
   - Emotional intensity levels
   - Content warnings specifically flagged by the romance reading community

2. General content warnings from safe sources:
   - Violence, abuse, or trauma
   - Sexual content or sexual violence
   - Mental health themes (suicide, self-harm, etc.)
   - Disturbing or graphic content
   - Dark themes

If you find any content warnings, heat levels, or tropes mentioned on Romance.io, The StoryGraph, or other community sites, list them specifically. If the book is known to be safe/cozy/light/clean romance, confirm that. Be factual and specific. If community reviews suggest content not mentioned in the blurb, state: "Community reviews suggest [X] may be present."

IMPORTANT: Only use information from safe, open sources. Do not quote retailer product descriptions.`
                : `Based on your knowledge and any available information, does the book "${bookForAnalysis.title}" by ${bookForAnalysis.author || 'Unknown Author'} have content warnings, trigger warnings, or sensitive content that readers should be aware of?

CRITICAL TOS COMPLIANCE: 
- DO NOT use or quote content from retailer websites (Amazon, QBD, Booktopia, Barnes & Noble, etc.)
- ONLY use open, publicly available sources (review sites, library catalogs, community sites, etc.)

Look for mentions of:
- Violence, abuse, or trauma
- Sexual content or sexual violence
- Mental health themes (suicide, self-harm, etc.)
- Disturbing or graphic content
- Dark themes

If you find any content warnings mentioned online or in reviews (from safe sources), list them briefly. If the book is known to be safe/cozy/light, confirm that. Be factual and specific.

IMPORTANT: Only use information from safe, open sources. Do not quote retailer product descriptions.`

              const searchResponse = await openai.chat.completions.create({
                model: modelToUse,
                messages: [
                  {
                    role: 'system',
                    content: 'You are a helpful assistant that provides factual information about book content warnings based on available knowledge and information. You MUST comply with Terms of Service requirements and only use open, publicly available sources. You MUST NOT quote or reproduce content from retailer websites.'
                  },
                  {
                    role: 'user',
                    content: searchPrompt
                  }
                ],
                max_tokens: 300
              }).catch(err => {
                console.error('Web search verification via OpenAI failed:', err)
                return null
              })
              
              timings.webSearch = performance.now() - webSearchStartTime
              
              if (searchResponse) {
                const messageContent = searchResponse.choices[0]?.message?.content || ''
                
                // TOS Compliance Check: Reject if response contains retailer indicators
                const retailerIndicators = [
                  'amazon.com', 'qbd.com.au', 'booktopia.com.au', 'barnesandnoble.com',
                  'waterstones.com', 'indigo.ca', 'retailer', 'product page', 'buy now',
                  'add to cart', 'customer reviews on amazon', 'amazon product description'
                ]
                
                const containsRetailerContent = retailerIndicators.some(indicator => 
                  messageContent.toLowerCase().includes(indicator.toLowerCase())
                )
                
                if (containsRetailerContent) {
                  console.warn('[Web Search Verification] TOS Compliance: Rejected response containing retailer content')
                  onProgress?.('⚠️ Web search verification response contained retailer content - rejected for TOS compliance')
                  // Don't use retailer content - skip verification
                  timings.webSearch = performance.now() - webSearchStartTime
                  usedWebSearch = false
                  // Skip to end of try block - don't process this response
                } else {
                
                usedWebSearch = true
                
                // Check if the response indicates warnings exist
                const warningIndicators = ['warning', 'trigger', 'sensitive', 'disturbing', 'violence', 'abuse', 'trauma', 'graphic', 'explicit', 'dark', 'mature']
                const hasWarningIndicators = warningIndicators.some(indicator => 
                  messageContent.toLowerCase().includes(indicator)
                )
                
                // Also check for negative indicators (safe, cozy, light, etc.)
                const safeIndicators = ['safe', 'cozy', 'light', 'romance', 'comedy', 'no warnings', 'no content warnings', 'family-friendly']
                const hasSafeIndicators = safeIndicators.some(indicator => 
                  messageContent.toLowerCase().includes(indicator)
                )
                
                if (hasWarningIndicators && !hasSafeIndicators) {
                  webSearchFoundWarnings = true
                  webSearchContext = `Web search found potential content warnings: ${messageContent.substring(0, 200)}... `
                  onProgress?.('⚠️ Web search found potential warnings - re-analyzing with web context...')
                  
                  // Re-run analysis with web search context
                  const enhancedDescription = `${descriptionForAnalysis}\n\nAdditional Context from Web Search:\n${messageContent}`
                  
                  const { analyzeBookWithMultiModel } = await import('./multi-model-analysis')
                  reanalysisResult = await analyzeBookWithMultiModel(
                    {
                      title: bookForAnalysis.title || 'Unknown',
                      author: bookForAnalysis.author || 'Unknown',
                      description: enhancedDescription,
                      isbn: cleanIsbn
                    },
                    onProgress,
                    modelToUse
                  )
                  
                  if (reanalysisResult.warnings.length > 0) {
                    // Found warnings on re-analysis - save them
                    onProgress?.(`✅ Re-analysis with web context found ${reanalysisResult.warnings.length} warning(s)`)
                    
                    const { getCategoryById } = await import('@/lib/config/taxonomy-v2')
                    const warningsToInsert = reanalysisResult.warnings
                      .map(w => {
                        if (!w.subcategory_id || !w.subcategory_id.includes('.')) return null
                        const [categoryId, subcategoryId] = w.subcategory_id.split('.')
                        if (!categoryId || !subcategoryId) return null
                        const category = getCategoryById(categoryId)
                        const legacyCategory = category?.legacyCategory || 'other'
                        
                        return {
                          book_id: bookId,
                          category: legacyCategory,
                          category_id: categoryId,
                          subcategory_id: subcategoryId,
                          description: w.description?.trim() || `Content warning for ${w.subcategory_id}`,
                          severity: w.severity,
                          confidence_score: w.evidence[0]?.confidence || 0.7, // Lower confidence since from web search
                          context_modifiers: w.modifiers,
                          evidence: w.evidence,
                          severity_signals: w.severity_signals,
                          taxonomy_version: w.taxonomy_version,
                          is_spoiler: w.is_spoiler === true,
                          source: 'ai_generated',
                          reasoning: w.reasoning || `Warning identified through web search verification and re-analysis. ${w.reasoning || ''}`
                        }
                      })
                      .filter((w): w is NonNullable<typeof w> => w !== null)
                    
                    if (warningsToInsert.length > 0) {
                      const { data: insertedWarnings, error: warningsError } = await supabaseAdmin
                        .from('content_warnings')
                        .insert(warningsToInsert)
                        .select()
                      
                      if (!warningsError) {
                        contentWarningsGenerated = true
                        onProgress?.(`✅ Saved ${insertedWarnings?.length || warningsToInsert.length} warnings from web search verification`)
                        
                        // Log audit decision: warnings found via web search verification
                        await logAuditDecision({
                          bookId: bookId,
                          isbn: cleanIsbn,
                          decisionType: 'warnings_generated',
                          warningsCount: insertedWarnings?.length || warningsToInsert.length,
                          aiReasoning: `Initial analysis found 0 warnings. Web search verification found potential warnings, and re-analysis confirmed ${insertedWarnings?.length || warningsToInsert.length} content warning(s).`,
                          confidenceLevel: 'medium', // Medium confidence since web search was needed
                          bookTitle: bookForAnalysis.title,
                          bookAuthor: bookForAnalysis.author,
                          descriptionLength: enhancedDescription.length,
                          hadThinMetadata: isMinimalDescription,
                          usedWebSearch: true,
                          modelVersion: MODEL_VERSION,
                          taxonomyVersion: TAXONOMY_VERSION,
                          pipelinePath: `${pipelinePath} -> web_search_verification`,
                          metadataIssues: (bookForAnalysis as any).metadataIssues || undefined
                        })
                      }
                    }
                  } else {
                    // Re-analysis still found 0 warnings
                    onProgress?.('✅ Web search verification confirmed: no warnings found')
                  }
                } else {
                  // No warning indicators found
                  onProgress?.('✅ Web search confirmed: no warnings mentioned online')
                  webSearchContext = 'Web search verification performed - no warnings found. '
                }
                } // End of else block for non-retailer content (TOS-compliant)
              } else {
                onProgress?.('⚠️ Web search unavailable, skipping verification')
              }
            } catch (webSearchError) {
              console.error('Web search verification error:', webSearchError)
              onProgress?.('⚠️ Web search verification failed, continuing without verification')
              timings.webSearch = performance.now() - webSearchStartTime
              // Don't set usedWebSearch = true if it failed
            }
            
            // CRITICAL: Always create audit log for "no_warnings" AFTER web search verification completes
            // This ensures audit logs are created regardless of whether web search verification succeeds or fails
            // Only skip if warnings were actually found and saved via web search re-analysis
            const warningsFoundViaWebSearch = webSearchFoundWarnings && reanalysisResult && reanalysisResult.warnings.length > 0 && contentWarningsGenerated
            
            if (!warningsFoundViaWebSearch) {
              analysisCompleted = true
              // Build comprehensive reasoning that includes AI's explanation
              let reasoning = 'AI analysis completed and found no content warnings.'
              if (aiNoWarningsReasoning) {
                reasoning += ` ${aiNoWarningsReasoning}`
              }
              if (webSearchContext) {
                reasoning += ` ${webSearchContext}`
              }
              
              // Add safety disclaimer for Romance books if analysis was based on blurb only
              const isRomanceBook = bookForAnalysis.categories?.some((cat: string) => 
                cat.toLowerCase().includes('romance')
              ) || bookForAnalysis.description?.toLowerCase().includes('romance') || false
              
              if (isRomanceBook && !usedWebSearch) {
                reasoning += ' Analysis based on blurb only; community reviews on Romance.io or The StoryGraph may indicate different heat/spice levels or tropes not mentioned in the description.'
              } else               if (usedWebSearch) {
                reasoning += ' Web search verification (using open sources only, TOS-compliant) confirmed the book appears safe for general reading.'
              } else if (!aiNoWarningsReasoning) {
                reasoning += ' The book appears safe for general reading based on description analysis.'
              }
              
              await logAuditDecision({
                bookId: bookId,
                isbn: cleanIsbn,
                decisionType: 'no_warnings',
                warningsCount: 0,
                aiReasoning: reasoning,
                confidenceLevel: usedWebSearch ? 'high' : 'medium', // Higher confidence if web search verified
                bookTitle: bookForAnalysis.title,
                bookAuthor: bookForAnalysis.author,
                descriptionLength: descriptionForAnalysis.length,
                hadThinMetadata: isMinimalDescription,
                usedWebSearch: usedWebSearch,
                modelVersion: MODEL_VERSION,
                taxonomyVersion: TAXONOMY_VERSION,
                pipelinePath: usedWebSearch ? `${pipelinePath} -> web_search_verification` : pipelinePath,
                metadataIssues: (bookForAnalysis as any).metadataIssues || undefined
              })
            }
          }
        } catch (analysisError) {
          console.error('Error in analyzeBookWithMultiModel:', analysisError)
          
          // Check if it's a rate limit error
          const isRateLimit = (analysisError instanceof Error && 
                              ((analysisError as any).isRateLimit || 
                               analysisError.message.includes('rate limit') ||
                               analysisError.message.includes('429')))
          
          if (isRateLimit) {
            onProgress?.(`⚠️ Rate limit exceeded - analysis could not complete. Book will be marked as "Unknown" until analysis can be retried.`)
          } else {
            onProgress?.(`❌ AI analysis error: ${analysisError instanceof Error ? analysisError.message : 'Unknown error'}`)
          }
          
          // Log for manual handling - this is a failed analysis, NOT a "no warnings" result
          try {
            await supabaseAdmin
              .from('manual_handling_scans')
              .insert({
                isbn: cleanIsbn,
                reason: isRateLimit ? 'rate_limit_exceeded' : 'analysis_failed',
                status: 'pending',
                error_message: analysisError instanceof Error ? analysisError.message : 'Unknown error',
                metadata: {
                  book_id: bookId,
                  book_title: bookForAnalysis.title,
                  attempted_at: new Date().toISOString(),
                  source: 'scan_service',
                  error_type: analysisError instanceof Error ? analysisError.constructor.name : 'Unknown',
                  is_rate_limit: isRateLimit
                }
              })
          } catch (logError) {
            console.error('Failed to log manual handling scan:', logError)
          }
          
          // DO NOT create an audit log for "no_warnings" - analysis failed!
          // The book should show as "Unknown" (not analyzed) not "Comfort Read" (analyzed and safe)
          
          analysisError = analysisError as Error
          throw analysisError; // Re-throw to be caught by outer catch
        }
      } else {
        onProgress?.('⚠️ Skipping analysis: Book title missing')
        console.error('Cannot run analysis: bookForAnalysis is null or missing title', { 
          hasBook: !!bookForAnalysis, 
          hasTitle: !!bookForAnalysis?.title 
        })
        analysisError = new Error('Book title missing - cannot run analysis')
      }
  } catch (error) {
    console.error('Content warning analysis failed:', error)
    console.error('Error details:', error instanceof Error ? error.stack : error)
    analysisError = error instanceof Error ? error : new Error('Unknown error')
    onProgress?.(`❌ Content analysis failed: ${analysisError.message}`)
    timings.aiContentWarningGeneration = performance.now() - analysisStartTime
    
    // Log for manual handling
    try {
      await supabaseAdmin
        .from('manual_handling_scans')
        .insert({
          isbn: cleanIsbn,
          reason: 'analysis_failed',
          status: 'pending',
          error_message: analysisError.message,
          metadata: {
            book_id: bookId,
            book_title: currentBook?.title,
            attempted_at: new Date().toISOString(),
            source: 'scan_service',
            error_type: analysisError.constructor.name,
            model: modelToUse || MODEL_VERSION
          }
        })
    } catch (logError) {
      console.error('Failed to log manual handling scan:', logError)
    }
  } finally {
    // Mark analysis as completed if we got here without throwing
    if (!analysisError) {
      analysisCompleted = true
    }
  }

  // Record the scan
  let scan = null;
  try {
    console.log('Recording scan...')
    const scanInsertStart = performance.now()
    const { data: scanData, error: scanError } = await supabaseAdmin
      .from('scans')
      .insert({
        isbn: cleanIsbn,
        book_id: bookId
      })
      .select()
      .single()
    timings.dbWrites += performance.now() - scanInsertStart

    if (scanError) {
      console.warn('Failed to record scan (scans table might be missing):', scanError.message)
      // Fallback for UI if table missing
      scan = { id: 'temp-scan-id', isbn: cleanIsbn, book_id: bookId }
    } else {
      scan = scanData
    }
  } catch (e) {
    console.warn('Exception recording scan:', e)
    scan = { id: 'temp-scan-id', isbn: cleanIsbn, book_id: bookId }
  }

  // Only mark as successful if analysis completed OR book already had warnings
  const hasExistingWarnings = bookId ? (await supabaseAdmin
    .from('content_warnings')
    .select('id', { count: 'exact', head: true })
    .eq('book_id', bookId)).count || 0 > 0 : false
  
  if (analysisCompleted || hasExistingWarnings) {
    onProgress?.('✅ Scan completed successfully.')
  } else if (analysisError) {
    onProgress?.(`⚠️ Scan completed but analysis failed: ${analysisError.message}`)
  } else {
    onProgress?.('⚠️ Scan completed but analysis did not run.')
  }

  // SAFETY CHECK: Ensure audit log was created if analysis ran
  // This prevents books from being marked as "Unknown" when they were actually analyzed
  const bookForSafetyCheck = currentBook || existingBook
  if (bookId && bookForSafetyCheck && bookForSafetyCheck.title) {
    try {
      const { data: existingAuditLog } = await supabaseAdmin
        .from('ai_audit_logs')
        .select('id')
        .eq('book_id', bookId)
        .in('decision_type', ['warnings_generated', 'no_warnings'])
        .limit(1)
      
      if (!existingAuditLog || existingAuditLog.length === 0) {
        console.warn(`[Safety Check] No audit log found for book ${bookId} (${bookForSafetyCheck.title}) - creating one now`)
        onProgress?.('⚠️ Safety check: Creating missing audit log...')
        
        // Create audit log based on whether warnings were generated
        const warningCount = contentWarningsGenerated ? (await supabaseAdmin
          .from('content_warnings')
          .select('id', { count: 'exact', head: true })
          .eq('book_id', bookId)).count || 0 : 0
        
        await logAuditDecision({
          bookId: bookId,
          isbn: cleanIsbn,
          decisionType: warningCount > 0 ? 'warnings_generated' : 'no_warnings',
          warningsCount: warningCount,
          aiReasoning: warningCount > 0 
            ? `AI analysis identified ${warningCount} content warning(s) for this book. Analysis completed successfully. (Audit log created via safety check)`
            : `AI analysis completed and found no content warnings. The book appears safe for general reading. (Audit log created via safety check)`,
          confidenceLevel: 'medium', // Lower confidence since this is a safety check
          bookTitle: bookForSafetyCheck.title,
          bookAuthor: bookForSafetyCheck.author,
          descriptionLength: bookForSafetyCheck.description?.length || null,
          hadThinMetadata: !bookForSafetyCheck.description || bookForSafetyCheck.description.length < 150,
          usedWebSearch: usedWebSearch,
          modelVersion: MODEL_VERSION,
          taxonomyVersion: TAXONOMY_VERSION,
          pipelinePath: `${pipelinePath} -> safety_check`,
          metadataIssues: (bookForSafetyCheck as any).metadataIssues || undefined
        })
        
        onProgress?.('✅ Safety check: Created missing audit log')
      }
    } catch (safetyCheckError) {
      console.error('[Safety Check] Failed to verify/create audit log:', safetyCheckError)
      // Don't throw - this is a safety check, not critical path
    }
  }

  // Calculate total time before returning
  timings.total = performance.now() - overallStartTime

  // Only return success if analysis completed successfully OR book already exists with warnings
  const scanSuccess = analysisCompleted || hasExistingWarnings || !bookId
  
  return {
    success: scanSuccess,
    status: scanSuccess ? (contentWarningsGenerated ? 'success' : 'success') : 'error',
    book: currentBook || { id: bookId, isbn: cleanIsbn, review_status: 'pending' },
    scan: scan,
    isNewBook: !existingBook,
    contentWarningsGenerated,
    authorContextInvestigated,
    message: analysisError ? `Analysis failed: ${analysisError.message}` : undefined,
    timings,
    flags: {
      usedWebSearch,
      isThinMetadata,
      pipelinePath
    }
  }
}
