import { supabaseAdmin } from '@/lib/supabase/admin'
import { fetchBookByISBN, fetchCandidatesByISBN, BookCandidate } from '@/lib/book-api'
import { normalizeISBN } from '@/lib/isbn-validation'
import { Database } from '@/types/supabase'
import { isStale, refreshBookMetadata } from '@/lib/book-cache'

// Helper to validate cover URL is not a placeholder
async function validateCoverUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'HEAD',
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
    const contentLength = response.headers.get('content-length');
    
    // Check if it's an image
    if (contentType && !contentType.startsWith('image/')) {
      console.log(`[Cover Validation] Not an image: ${contentType}`);
      return null;
    }
    
    // Check for placeholders
    if (contentLength) {
      const size = parseInt(contentLength);
      if (size < 1000) {
        console.log(`[Cover Validation] Too small (${size} bytes) - likely placeholder`);
        return null;
      }
      if (size === 15567) {
        console.log(`[Cover Validation] Google Books placeholder detected (${size} bytes)`);
        return null;
      }
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
}) {
  try {
    const auditLog: AuditLogInsert = {
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
      pipeline_path: params.pipelinePath || null
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
  model: string = "gpt-4o"
): Promise<ScanResult> {
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
        console.log(`Found ${candidates.length} candidates for ISBN ${cleanIsbn}, returning ambiguity.`)
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

      if (candidates.length === 1) {
        bookData = candidates[0]
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
      const validatedCoverUrl = await validateCoverUrl(bookData.cover_url);
      
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
          result: 'Cover URL was rejected as placeholder, saved book without cover',
          timestamp: performance.now()
        });
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
  }

  // At this point, we have a bookId and currentBook (unless something went wrong)
  // Now generate content warnings using multi-model analysis
  onProgress?.('📖 Step 6: Fetching book description for analysis...')
  
  let contentWarningsGenerated = false
  const analysisStartTime = performance.now()
  
  try {
    // Get book metadata for analysis
    let bookForAnalysis = currentBook || existingBook
    
    if (!bookForAnalysis) {
      onProgress?.('❌ Error: No book data available for analysis')
      throw new Error('No book data available for analysis')
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
      const descriptionForAnalysis = bookForAnalysis.description && bookForAnalysis.description.length > 50
        ? bookForAnalysis.description
        : bookForAnalysis.description && bookForAnalysis.description.length > 0
        ? bookForAnalysis.description
        : `A book by ${bookForAnalysis.author || 'Unknown Author'}. ${bookForAnalysis.categories ? `Categories: ${bookForAnalysis.categories.slice(0, 3).join(', ')}.` : ''}`
      
      onProgress?.(`📄 Description for analysis: ${descriptionForAnalysis.length} characters`)
      
      // Check if description is too minimal (just title/author/categories)
      const isMinimalDescription = !bookForAnalysis.description || 
        bookForAnalysis.description.length <= 50 ||
        descriptionForAnalysis.startsWith('A book by') ||
        descriptionForAnalysis === `A book by ${bookForAnalysis.author || 'Unknown Author'}.`
      
      if (isMinimalDescription) {
        onProgress?.('⚠️ Description too minimal - skipping analysis to avoid genre-based assumptions')
        onProgress?.('💡 Tip: Try fetching a description from external APIs or provide book details manually')
        onProgress?.('📋 This scan has been logged for manual handling')
        console.log('Skipping analysis: Description is too minimal, would lead to genre-based assumptions')
        
        // Log for manual handling
        try {
          await supabaseAdmin
            .from('manual_handling_scans')
            .insert({
              isbn: cleanIsbn,
              reason: 'description_too_minimal',
              status: 'pending',
              metadata: {
                book_title: bookForAnalysis.title,
                book_author: bookForAnalysis.author,
                description_length: bookForAnalysis.description?.length || 0,
                attempted_at: new Date().toISOString(),
                source: 'scan_service'
              }
            })
        } catch (logError) {
          console.error('Failed to log manual handling scan:', logError)
        }
      } else {
        onProgress?.('🤖 Starting AI content analysis with multi-model (GPT-4o + Gemini)...')
        onProgress?.(`📖 Analyzing: "${bookForAnalysis.title}"`)
        onProgress?.(`📝 Using description: ${descriptionForAnalysis.substring(0, 100)}...`)
        
        try {
          const { analyzeBookWithMultiModel } = await import('./multi-model-analysis')
          onProgress?.('⏳ Calling analyzeBookWithMultiModel...')
          
          const analysisResult = await analyzeBookWithMultiModel(
            {
              title: bookForAnalysis.title || 'Unknown',
              author: bookForAnalysis.author || 'Unknown',
              description: descriptionForAnalysis,
              isbn: cleanIsbn
            },
            onProgress
          )
          
          onProgress?.(`✅ AI analysis complete: ${analysisResult.warnings.length} warnings generated`)
          
          timings.aiContentWarningGeneration = performance.now() - analysisStartTime
          onProgress?.(`⏱️ Analysis took ${Math.round(timings.aiContentWarningGeneration)}ms`)
          
          if (analysisResult.warnings.length > 0) {
            onProgress?.(`💾 Saving ${analysisResult.warnings.length} content warnings to database...`)
          
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
                const [categoryId, subcategoryId] = w.subcategory_id.split('.')
                
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
                
                return {
                  book_id: bookId,
                  category: legacyCategory, // Legacy field - must match DB constraint
                  category_id: categoryId,
                  subcategory_id: subcategoryId,
                  description: w.evidence[0]?.excerpt || `Content warning for ${w.subcategory_id}`,
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
                  other_note: otherNote // Will be undefined for non-other_* subcategories
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
            }
          } else {
            onProgress?.('ℹ️ No content warnings identified by AI analysis')
            console.log('Analysis returned 0 warnings for book:', bookForAnalysis.title)
          }
        } catch (analysisError) {
          console.error('Error in analyzeBookWithMultiModel:', analysisError)
          onProgress?.(`❌ AI analysis error: ${analysisError instanceof Error ? analysisError.message : 'Unknown error'}`)
          throw analysisError; // Re-throw to be caught by outer catch
        }
      }
    } else {
      onProgress?.('⚠️ Skipping analysis: Book title missing')
      console.error('Cannot run analysis: bookForAnalysis is null or missing title', { 
        hasBook: !!bookForAnalysis, 
        hasTitle: !!bookForAnalysis?.title 
      })
    }
  } catch (error) {
    console.error('Content warning analysis failed:', error)
    console.error('Error details:', error instanceof Error ? error.stack : error)
    onProgress?.(`⚠️ Warning: Content analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    timings.aiContentWarningGeneration = performance.now() - analysisStartTime
    
    // Log for manual handling
    try {
      await supabaseAdmin
        .from('manual_handling_scans')
        .insert({
          isbn: cleanIsbn,
          reason: 'analysis_failed',
          status: 'pending',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            book_id: bookId,
            book_title: currentBook?.title,
            attempted_at: new Date().toISOString(),
            source: 'scan_service',
            error_type: error instanceof Error ? error.constructor.name : 'Unknown'
          }
        })
    } catch (logError) {
      console.error('Failed to log manual handling scan:', logError)
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

  onProgress?.('Scan completed successfully.');

  // Calculate total time before returning
  timings.total = performance.now() - overallStartTime

  return {
    success: true,
    book: currentBook || { id: bookId, isbn: cleanIsbn, review_status: 'pending' },
    scan: scan,
    isNewBook: !existingBook,
    contentWarningsGenerated,
    authorContextInvestigated,
    timings,
    flags: {
      usedWebSearch,
      isThinMetadata,
      pipelinePath
    }
  }
}
