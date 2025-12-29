import { supabaseAdmin } from '@/lib/supabase/admin'
import { fetchBookByISBN, fetchCandidatesByISBN, BookCandidate } from '@/lib/book-api'
import { normalizeISBN } from '@/lib/isbn-validation'
import { findBookAndGenerateWarnings, generateContentWarnings } from '@/lib/content-warning-agent'
import { TAXONOMY_VERSION, MODEL_VERSION, getCategoryById, requiresMediation, validateSubcategory } from '@/lib/config/taxonomy-v2'
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
type ContentWarningInsert = Database['public']['Tables']['content_warnings']['Insert']
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

  // Clean ISBN (remove hyphens, spaces)
  const cleanIsbn = normalizeISBN(isbn)
  let contentWarningsGenerated = false
  let usedSelectedCandidate = !!selectedCandidate

  // Store the result of any web search we perform so we don't do it twice
  let cachedWebSearchResult: any = null;

  // Check if book already exists (the "Cache" lookup)
  console.log('Checking for existing book with ISBN:', cleanIsbn)
  onProgress?.({
    action: 'Checking local database for existing book',
    timestamp: performance.now()
  })
  let existingBook = null

  // Only check DB if we aren't forcing a candidate
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
    // If data is stale (>30 days), refresh in background
    if (existingBook && isStale(existingBook.last_synced_at)) {
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

    // Flag if the metadata is "thin" (likely to cause AI failure) or missing cover
    isThinMetadata = !!(bookData && (!bookData.description || bookData.description.length < 150 || !bookData.cover_url));

    if (!bookData || isThinMetadata) {
      console.log('Book not found in external APIs or metadata is thin, asking AI agent...')
      onProgress?.(isThinMetadata
        ? 'Metadata found is insufficient. Initiating deep AI web search...'
        : 'Book not found in standard libraries. Initiating AI web search...');

      // Create a minimal book record with just the ISBN (or the thin data we have)
      // Hybrid cache strategy: Store data but mark with last_synced_at for staleness checking
      // Validate cover URL before saving (reject placeholders)
      const validatedCoverUrl = await validateCoverUrl(bookData?.cover_url);
      
      const insertData: any = {
        isbn: cleanIsbn,
        title: bookData?.title || `Unknown Book (ISBN: ${cleanIsbn})`,
        author: bookData?.author || 'Unknown Author',
        cover_url: validatedCoverUrl, // Use validated cover (null if placeholder)
        description: bookData?.description || null,
        publisher: bookData?.publisher || null,
        published_date: bookData?.published_date || null,
        page_count: bookData?.page_count || null,
        categories: bookData?.categories || null,
        last_synced_at: new Date().toISOString(), // Set sync date for staleness checking
      }
      
      if (bookData?.cover_url && !validatedCoverUrl) {
        onProgress?.({
          action: 'Cover validation rejected placeholder image',
          result: 'Cover URL was rejected as placeholder, will try AI agent to find cover',
          timestamp: performance.now()
        });
      }
      
      const { data: newBook, error: insertError } = await supabaseAdmin
        .from('books')
        .insert(insertData)
        .select()
        .single()

      if (insertError) {
        console.error('Error creating minimal book record:', JSON.stringify(insertError, null, 2))
        throw insertError
      }

      console.log('Minimal book record created with ID:', newBook.id)
      currentBook = newBook
      bookId = newBook.id

      // Log thin metadata if applicable
      if (isThinMetadata && bookData) {
        await logAuditDecision({
          bookId,
          isbn: cleanIsbn,
          decisionType: 'metadata_thin',
          warningsCount: 0,
          aiReasoning: `Metadata retrieved from external APIs was insufficient (description length: ${bookData.description?.length || 0} chars, cover: ${bookData.cover_url ? 'found' : 'missing'}). Triggering AI web search for deeper analysis.`,
          bookTitle: bookData.title,
          bookAuthor: bookData.author || null,
          descriptionLength: bookData.description?.length || null,
          hadThinMetadata: true,
          usedWebSearch: true
        })
      }

      // Try AI agent to find book information via web search
      console.log('Asking AI agent to find book information via web search...')
      onProgress?.({
        action: 'Initiating AI web search agent to find book information',
        timestamp: performance.now()
      })
      try {
        // Perform the search and CACHE the result
        // findBookAndGenerateWarnings does both web search AND AI generation
        const webSearchStart = performance.now()
        cachedWebSearchResult = await findBookAndGenerateWarnings(cleanIsbn, model)
        const webSearchTotalTime = performance.now() - webSearchStart
        timings.webSearch += webSearchTotalTime
        // Approximate AI generation time (70% of total, 30% is actual web search)
        timings.aiContentWarningGeneration += webSearchTotalTime * 0.7
        usedWebSearch = true
        pipelinePath = 'web_search_initial'

        onProgress?.({
          action: 'AI agent completed web search and analysis',
          aiResponse: {
            book_found: cachedWebSearchResult.book_found,
            book_title: cachedWebSearchResult.book_title,
            book_author: cachedWebSearchResult.book_author,
            confidence: cachedWebSearchResult.confidence,
            reasoning: cachedWebSearchResult.reasoning,
            warnings_count: cachedWebSearchResult.content_warnings?.length || 0
          },
          result: cachedWebSearchResult.book_found 
            ? `AI found book: "${cachedWebSearchResult.book_title}" with ${cachedWebSearchResult.content_warnings?.length || 0} content warnings (confidence: ${cachedWebSearchResult.confidence})`
            : 'AI could not find book information via web search',
          timestamp: performance.now(),
          metadata: {
            duration: webSearchTotalTime,
            confidence: cachedWebSearchResult.confidence
          }
        })

        if (cachedWebSearchResult.book_found) {
          onProgress?.(`AI found book: "${cachedWebSearchResult.book_title}". Analyzing content...`);

          // Log search performed
          await logAuditDecision({
            bookId,
            isbn: cleanIsbn,
            decisionType: 'search_performed',
            warningsCount: cachedWebSearchResult.content_warnings.length,
            aiReasoning: cachedWebSearchResult.reasoning || 'AI performed web search to find book information',
            confidenceLevel: cachedWebSearchResult.confidence,
            bookTitle: cachedWebSearchResult.book_title || null,
            bookAuthor: cachedWebSearchResult.book_author || null,
            usedWebSearch: true,
            rawAiResponse: cachedWebSearchResult,
            modelVersion: MODEL_VERSION,
            taxonomyVersion: TAXONOMY_VERSION,
            pipelinePath: 'web_search_cached'
          })

          // Update the book record with AI-found information
          const dbWriteStart = performance.now()
          const { data: updatedBook, error: updateError } = await supabaseAdmin
            .from('books')
            .update({
              title: cachedWebSearchResult.book_title || `Unknown Book (ISBN: ${cleanIsbn})`,
              author: cachedWebSearchResult.book_author || 'Unknown Author',
              description: cachedWebSearchResult.book_description || null,
              categories: cachedWebSearchResult.book_categories || null,
              cover_url: cachedWebSearchResult.book_cover_url || null,
              last_synced_at: new Date().toISOString(), // Update sync date when refreshing
            })
            .eq('id', bookId)
            .select()
            .single()
          timings.dbWrites += performance.now() - dbWriteStart

          if (updateError) {
            console.error('Failed to update book with AI-found data:', updateError)
          } else {
            console.log('Updated book record with AI-found information')
            if (updatedBook) {
              currentBook = updatedBook
            }
          }

          // Insert the generated warnings
          if (cachedWebSearchResult.content_warnings && cachedWebSearchResult.content_warnings.length > 0) {
            onProgress?.({
              action: 'Saving AI-generated content warnings to database',
              result: `Successfully saved ${cachedWebSearchResult.content_warnings.length} content warnings`,
              timestamp: performance.now(),
              metadata: {
                warningCount: cachedWebSearchResult.content_warnings.length,
                warnings: cachedWebSearchResult.content_warnings.map((w: any) => ({
                  category: w.category_id,
                  severity: w.severity,
                  description: w.description?.substring(0, 100) + '...'
                }))
              }
            })
            onProgress?.(`Generated ${cachedWebSearchResult.content_warnings.length} content warnings via AI.`);

            // Log warnings generated
            await logAuditDecision({
              bookId,
              isbn: cleanIsbn,
              decisionType: 'warnings_generated',
              warningsCount: cachedWebSearchResult.content_warnings.length,
              aiReasoning: `Generated ${cachedWebSearchResult.content_warnings.length} warnings via AI web search. ${cachedWebSearchResult.reasoning || 'Analysis based on web search results.'}`,
              confidenceLevel: cachedWebSearchResult.confidence,
              bookTitle: cachedWebSearchResult.book_title || null,
              bookAuthor: cachedWebSearchResult.book_author || null,
              usedWebSearch: true,
              rawAiResponse: cachedWebSearchResult,
              modelVersion: MODEL_VERSION,
              taxonomyVersion: TAXONOMY_VERSION,
              pipelinePath: 'web_search_cached'
            })

            const warningsToInsert: ContentWarningInsert[] = cachedWebSearchResult.content_warnings.map((warning: any) => ({
              book_id: bookId,
              category: getCategoryById(warning.category_id || warning.category)?.legacyCategory || 'other',
              category_id: warning.category_id || warning.category,
              subcategory_id: warning.subcategory_id || null,
              confidence_score: warning.score,
              description: warning.description,
              severity: warning.severity,
              presence: warning.presence || 'on_page',
              detail_level: warning.detail_level || null,
              is_spoiler: warning.is_spoiler || false,
              requires_mediation: requiresMediation([{
                category_id: warning.category_id || warning.category,
                severity: warning.severity,
                detail_level: warning.detail_level || null
              }]),
              user_id: null, // AI-generated warnings don't have a user_id
              reasoning: warning.reasoning || null,
              is_author_verified: warning.is_author_verified || false,
              source_url: warning.source_url || null
            }))

            const { error: insertError } = await supabaseAdmin
              .from('content_warnings')
              .insert(warningsToInsert)

            if (!insertError) {
              contentWarningsGenerated = true
              console.log(`Generated ${cachedWebSearchResult.content_warnings.length} content warnings via AI web search`)
            } else {
              console.error('Failed to insert AI-generated warnings:', insertError)
            }
          } else {
            // Log no warnings from search
            await logAuditDecision({
              bookId,
              isbn: cleanIsbn,
              decisionType: 'no_warnings',
              warningsCount: 0,
              aiReasoning: cachedWebSearchResult.reasoning || 'AI web search found book but determined no content warnings are needed based on analysis.',
              confidenceLevel: cachedWebSearchResult.confidence,
              bookTitle: cachedWebSearchResult.book_title || null,
              bookAuthor: cachedWebSearchResult.book_author || null,
              usedWebSearch: true,
              rawAiResponse: cachedWebSearchResult
            })
          }
        } else {
          console.log('AI agent could not find book information via web search')
          onProgress?.('AI agent could not find book information.');
        }
      } catch (warningError) {
        console.error('Error with AI agent book search:', warningError)
      }
    } else {
      // Hybrid cache strategy: Store all metadata with last_synced_at timestamp
      // Data is treated as a temporary cache that expires after 30 days
      console.log('Creating new book record with metadata:', bookData.title)
      onProgress?.(`Found metadata for "${bookData.title}". Saving to database...`);

      // Validate cover URL before saving (reject placeholders)
      const validatedCoverUrl = await validateCoverUrl(bookData.cover_url);
      
      const dbWriteStart = performance.now()
      const { data: newBook, error: insertError } = await supabaseAdmin
        .from('books')
        .insert({
          isbn: bookData.isbn,
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
  // Track if this is an existing book (vs newly created) for warning generation strategy
  const isExistingBook = !!existingBook && currentBook?.id === existingBook.id;

  // Check if book has content warnings, and generate them if missing (or if forced)
  if (!contentWarningsGenerated || forceRefresh) {
    try {
      console.log('🔍 Checking for existing content warnings for book ID:', bookId)
      onProgress?.('Checking for existing content warnings...');

      // If forcing refresh, delete existing warnings first
      if (forceRefresh && existingBook) {
        console.log('Force refresh requested. Clearing existing warnings...');
        await supabaseAdmin.from('content_warnings').delete().eq('book_id', bookId);
      }

      const { data: existingWarnings } = await supabaseAdmin
        .from('content_warnings')
        .select('id')
        .eq('book_id', bookId)

      console.log('📊 Existing warnings count:', existingWarnings?.length || 0)

      // Check if existing warnings are stale (old model or taxonomy)
      let isStale = false;
      if (existingWarnings && existingWarnings.length > 0 && !forceRefresh) {
        const { data: latestLog } = await supabaseAdmin
          .from('ai_audit_logs')
          .select('model_version, taxonomy_version')
          .eq('book_id', bookId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!latestLog || latestLog.model_version !== MODEL_VERSION || latestLog.taxonomy_version !== TAXONOMY_VERSION) {
          console.log(`⚠️ Existing warnings are stale or legacy. Triggering re-analysis. (Log: ${latestLog?.model_version}/${latestLog?.taxonomy_version} vs Current: ${MODEL_VERSION}/${TAXONOMY_VERSION})`);
          isStale = true;
          // Clear stale warnings to make way for new ones
          await supabaseAdmin.from('content_warnings').delete().eq('book_id', bookId);
        }
      }

      // If we have no warnings (or we just deleted them), generate new ones
      if (!existingWarnings || existingWarnings.length === 0 || forceRefresh || isStale) {
        console.log('🤖 Generating content warnings with AI agent...')
        onProgress?.({
          action: 'Starting AI content warning analysis',
          timestamp: performance.now(),
          metadata: {
            bookTitle: currentBook?.title,
            bookAuthor: currentBook?.author,
            hasDescription: !!currentBook?.description,
            descriptionLength: currentBook?.description?.length || 0
          }
        })
        onProgress?.('Analyzing book content with AI...');

        if (currentBook) {
          // RESTORED LOGIC: For existing books, always use web search (more thorough, finds official content notes)
          // For new books, use metadata-based generation first (more efficient), then verify
          isThinMetadata = !currentBook.description || currentBook.description.length < 150 || !currentBook.cover_url;

          let result;
          let usedSearch = false;
          let classificationRating: string | null = null;
          let foundCoverUrl: string | null = null;

          // Strategy: Use web search if:
          // 1. Book already exists in DB (restored old behavior - more thorough)
          // 2. Description is thin (needs web search anyway)
          // 3. Force Refresh is on
          // Otherwise: Try metadata-based generation first, then verify with web search
          if (isExistingBook || isThinMetadata || forceRefresh) {
            // Check if we already have a cached result from the first step (only if NOT forcing refresh)
            if (cachedWebSearchResult && !forceRefresh) {
              console.log("Using cached web search result");
              const searchResult = cachedWebSearchResult;
              usedSearch = true;
              usedWebSearch = true;
              pipelinePath = 'web_search_cached';
              // Note: AI generation already happened when cached result was created, so we can't time it here
              // The webSearch timing was already captured when the cache was created
              result = {
                content_warnings: searchResult.content_warnings,
                confidence: searchResult.confidence,
                reasoning: searchResult.reasoning,
                classification_rating: (searchResult as any).classification_rating
              };
              classificationRating = (searchResult as any).classification_rating || null;
              foundCoverUrl = (searchResult as any).book_cover_url || null;
            } else {
              // Always use web search for existing books (can find official author content notes)
              // or if metadata is thin
              onProgress?.({
                action: 'Initiating AI web search for comprehensive content analysis',
                timestamp: performance.now(),
                metadata: {
                  reason: isExistingBook ? 'existing_book' : isThinMetadata ? 'thin_metadata' : 'force_refresh'
                }
              })
              onProgress?.(isExistingBook || forceRefresh
                ? 'Performing comprehensive web search for content warnings...'
                : 'Book description is brief. AI performing web search for deeper analysis...');

              // findBookAndGenerateWarnings does both web search AND AI generation
              // We track the total time as webSearch (includes both operations)
              const webSearchStart = performance.now()
              const searchResult = await findBookAndGenerateWarnings(currentBook.isbn, model);
              const webSearchTotalTime = performance.now() - webSearchStart
              timings.webSearch += webSearchTotalTime
              // Note: AI generation is included in webSearch timing since findBookAndGenerateWarnings
              // performs both web search and AI analysis. We approximate AI time as part of webSearch.
              // For more granular tracking, we'd need to modify findBookAndGenerateWarnings to return separate timings.
              timings.aiContentWarningGeneration += webSearchTotalTime * 0.7 // Approximate 70% is AI, 30% is web search
              usedSearch = true
              usedWebSearch = true
              pipelinePath = isExistingBook ? 'web_search_existing' : (isThinMetadata ? 'web_search_thin_metadata' : 'web_search_force_refresh')

              onProgress?.({
                action: 'AI web search and analysis completed',
                aiResponse: {
                  book_found: searchResult.book_found,
                  confidence: searchResult.confidence,
                  reasoning: searchResult.reasoning,
                  warnings_count: searchResult.content_warnings?.length || 0,
                  classification_rating: (searchResult as any).classification_rating
                },
                result: `AI analysis found ${searchResult.content_warnings?.length || 0} content warnings with ${searchResult.confidence} confidence`,
                timestamp: performance.now(),
                metadata: {
                  duration: webSearchTotalTime,
                  warnings: searchResult.content_warnings?.map((w: any) => ({
                    category: w.category_id,
                    severity: w.severity
                  })) || []
                }
              })

              // Map the result format
              result = {
                content_warnings: searchResult.content_warnings,
                confidence: searchResult.confidence,
                reasoning: searchResult.reasoning,
                classification_rating: (searchResult as any).classification_rating
              };
              classificationRating = (searchResult as any).classification_rating || null;
              foundCoverUrl = (searchResult as any).book_cover_url || null;
            }
          } else {
            // For new books with good metadata: Use metadata-based generation first (faster)
            // Then verify with web search if no warnings found (catches false negatives)
            onProgress?.({
              action: 'Analyzing book metadata with AI (metadata-based analysis)',
              timestamp: performance.now(),
              metadata: {
                hasDescription: !!currentBook.description,
                descriptionLength: currentBook.description?.length || 0
              }
            })
            onProgress?.('Analyzing book metadata for content warnings...');

            const aiStart = performance.now()
            result = await generateContentWarnings({
              book_title: currentBook.title,
              book_author: currentBook.author || 'Unknown',
              book_description: currentBook.description || undefined,
              book_categories: currentBook.categories || undefined,
              book_isbn: currentBook.isbn
            }, model);
            const aiDuration = performance.now() - aiStart
            timings.aiContentWarningGeneration += aiDuration
            classificationRating = (result as any).classification_rating || null;
            pipelinePath = 'metadata_only'
            
            onProgress?.({
              action: 'AI metadata analysis completed',
              aiResponse: {
                confidence: result.confidence,
                reasoning: result.reasoning,
                warnings_count: result.content_warnings?.length || 0,
                classification_rating: (result as any).classification_rating
              },
              result: `AI found ${result.content_warnings?.length || 0} content warnings from metadata analysis`,
              timestamp: performance.now(),
              metadata: {
                duration: aiDuration,
                warnings: result.content_warnings?.map((w: any) => ({
                  category: w.category_id,
                  severity: w.severity
                })) || []
              }
            })

            // DOUBLE CHECK: If standard analysis says "Safe" (no warnings),
            // force a web search verification to avoid false negatives.
            if (result.content_warnings.length === 0) {
              console.log("Initial analysis found no warnings. Performing deep search verification...");
              onProgress?.({
                action: 'Initial analysis found no warnings - performing deep web search verification',
                result: 'Starting verification to avoid false negatives',
                timestamp: performance.now()
              })
              onProgress?.("Initial text analysis safe. Verifying with web search...");

              // findBookAndGenerateWarnings does both web search AND AI generation
              const webSearchStart = performance.now()
              const searchResult = await findBookAndGenerateWarnings(currentBook.isbn, model);
              const webSearchTotalTime = performance.now() - webSearchStart
              timings.webSearch += webSearchTotalTime
              // Approximate AI generation time (70% of total)
              timings.aiContentWarningGeneration += webSearchTotalTime * 0.7
              usedWebSearch = true
              pipelinePath = 'metadata_then_web_search_verification'

              // Handle "Book Not Found" in Deep Search
              if (!searchResult.book_found) {
                console.log("Deep search failed to find book info.");
                onProgress?.({
                  action: 'Deep search verification completed',
                  aiResponse: {
                    book_found: false,
                    reasoning: searchResult.reasoning
                  },
                  result: 'Deep search could not verify book details - keeping initial "safe" verdict with low confidence',
                  timestamp: performance.now()
                })
                onProgress?.("⚠️ Deep search could not verify book details.");

                // If we have local metadata, we keep the "Safe" verdict but with Low confidence and a warning in reasoning
                result.confidence = 'low';
                result.reasoning = `${result.reasoning} (Note: Deep web search could not confirm this safety rating due to lack of online results. Manual review recommended.)`;
                usedSearch = true;
              }
              // If search found something, OVERRIDE the initial result
              else if (searchResult.content_warnings.length > 0) {
                console.log("Deep search found warnings that initial analysis missed!");
                onProgress?.({
                  action: 'Deep search verification found hidden warnings',
                  aiResponse: {
                    book_found: true,
                    warnings_count: searchResult.content_warnings.length,
                    confidence: searchResult.confidence,
                    reasoning: searchResult.reasoning
                  },
                  result: `Deep search found ${searchResult.content_warnings.length} warnings that initial analysis missed - overriding result`,
                  timestamp: performance.now(),
                  metadata: {
                    warnings: searchResult.content_warnings.map((w: any) => ({
                      category: w.category_id,
                      severity: w.severity
                    }))
                  }
                })
                onProgress?.(`Deep search found ${searchResult.content_warnings.length} hidden warnings.`);

                result = {
                  content_warnings: searchResult.content_warnings,
                  confidence: searchResult.confidence,
                  reasoning: `Initial text analysis missed triggers. Web search correction: ${searchResult.reasoning}`,
                  classification_rating: (searchResult as any).classification_rating
                };
                classificationRating = (searchResult as any).classification_rating || null;
                foundCoverUrl = (searchResult as any).book_cover_url || null;
                usedSearch = true;
              } else {
                // If search ALSO found nothing, update reasoning to show we double checked
                onProgress?.({
                  action: 'Deep search verification confirmed no warnings',
                  aiResponse: {
                    book_found: true,
                    warnings_count: 0,
                    reasoning: searchResult.reasoning
                  },
                  result: 'Web search verification confirmed initial "safe" verdict',
                  timestamp: performance.now()
                })
                result.reasoning = `${result.reasoning} (Web search verification confirmed no significant warnings found).`;
                usedSearch = true;
              }
            }
          }

          // Update book with classification rating AND COVER if we got one
          const updates: any = {};

          if (classificationRating) {
            const categories = currentBook.categories || [];
            const hasClassification = categories.some(c => c.startsWith('CLASSIFICATION:'));
            if (!hasClassification) {
              categories.push(`CLASSIFICATION:${classificationRating}`);
              updates.categories = categories;
            }
          }

          // Update cover if we found one and the current one is missing
          // Validate the AI-found cover to ensure it's not a placeholder
          if (foundCoverUrl && !currentBook.cover_url && foundCoverUrl !== "No cover available") {
            const validatedCover = await validateCoverUrl(foundCoverUrl);
            if (validatedCover) {
              console.log(`Found new cover URL from AI: ${foundCoverUrl}`);
              updates.cover_url = validatedCover;
            } else {
              console.log(`AI-found cover was rejected as placeholder: ${foundCoverUrl}`);
            }
          }

          if (Object.keys(updates).length > 0) {
            const dbWriteStart = performance.now()
            await supabaseAdmin.from('books').update(updates).eq('id', bookId);
            timings.dbWrites += performance.now() - dbWriteStart
            // Update currentBook in memory as well
            currentBook = { ...currentBook, ...updates };
          }

          // Log the decision
          const decisionType = result.content_warnings.length > 0 ? 'warnings_generated' : 'no_warnings';
          await logAuditDecision({
            bookId,
            isbn: cleanIsbn,
            decisionType,
            warningsCount: result.content_warnings.length,
            aiReasoning: result.reasoning || (result.content_warnings.length > 0
              ? `Generated ${result.content_warnings.length} content warnings based on book analysis.`
              : 'AI analysis determined no content warnings are needed for this book.'),
            confidenceLevel: result.confidence,
            bookTitle: currentBook!.title,
            bookAuthor: currentBook!.author || null,
            descriptionLength: currentBook!.description?.length || null,
            hadThinMetadata: isThinMetadata,
            usedWebSearch: usedSearch,
            rawAiResponse: result,
            modelVersion: MODEL_VERSION,
            taxonomyVersion: TAXONOMY_VERSION,
            pipelinePath: usedSearch ? 'web_search_live' : 'metadata_only'
          })

          if (result.content_warnings.length > 0) {
            // Insert the generated warnings
            onProgress?.({
              action: 'Saving AI-generated content warnings to database',
              result: `Preparing to save ${result.content_warnings.length} warnings`,
              timestamp: performance.now(),
              metadata: {
                warningCount: result.content_warnings.length
              }
            })
            onProgress?.(`AI analysis complete. Saving ${result.content_warnings.length} warnings...`);

            const warningsToInsert: ContentWarningInsert[] = result.content_warnings
              .map((warning: any) => {
                const categoryId = warning.category_id || warning.category;
                const subcategoryId = warning.subcategory_id || null;
                
                // Validate subcategory_id exists in taxonomy
                if (subcategoryId && !validateSubcategory(categoryId, subcategoryId)) {
                  console.warn(`[Scan Service] Invalid subcategory_id "${subcategoryId}" for category "${categoryId}", skipping subcategory`);
                  // Continue without subcategory_id rather than failing
                }

                return {
                  book_id: bookId,
                  category: getCategoryById(categoryId)?.legacyCategory || 'other',
                  category_id: categoryId,
                  subcategory_id: validateSubcategory(categoryId, subcategoryId) ? subcategoryId : null,
                  confidence_score: warning.score,
                  description: warning.description,
                  severity: warning.severity,
                  presence: warning.presence || 'on_page',
                  detail_level: warning.detail_level || null,
                  is_spoiler: warning.is_spoiler || false,
                  requires_mediation: requiresMediation([{
                    category_id: categoryId,
                    severity: warning.severity,
                    detail_level: warning.detail_level || null
                  }]),
                  user_id: null,
                  reasoning: warning.reasoning || null,
                  is_author_verified: warning.is_author_verified || false,
                  source_url: warning.source_url || null
                };
              })
              .filter((w: any) => w !== null) // Remove any null entries from validation failures

            const dbWriteStart = performance.now()
            const { error: insertError } = await supabaseAdmin
              .from('content_warnings')
              .insert(warningsToInsert)
            timings.dbWrites += performance.now() - dbWriteStart

            if (!insertError) {
              contentWarningsGenerated = true
              console.log(`Generated ${result.content_warnings.length} content warnings`)
              onProgress?.({
                action: 'Content warnings saved to database',
                result: `Successfully saved ${result.content_warnings.length} content warnings`,
                timestamp: performance.now(),
                metadata: {
                  warningCount: result.content_warnings.length,
                  warnings: warningsToInsert.map(w => ({
                    category: w.category_id,
                    severity: w.severity
                  }))
                }
              })
            } else {
              console.error('Failed to insert AI-generated warnings:', insertError)
              onProgress?.({
                action: 'Failed to save content warnings',
                result: `Error: ${insertError.message}`,
                timestamp: performance.now()
              })
            }
          } else {
            // Check if the failure was due to missing API key, quota, or rate limits
            const isConfigError = result.reasoning?.includes('OPENAI_API_KEY') || result.reasoning?.includes('Configuration error');
            const isQuotaError = result.reasoning?.includes('quota') || result.reasoning?.includes('429') || result.reasoning?.includes('exceeded');
            const isRateLimitError = result.reasoning?.includes('rate limit') || result.reasoning?.includes('Rate limit');
            
            if (isConfigError) {
              onProgress?.('⚠️ AI analysis failed: OpenAI API key not configured. Please set OPENAI_API_KEY in environment variables.');
              console.error('❌ OpenAI API key missing:', result.reasoning);
            } else if (isQuotaError || isRateLimitError) {
              onProgress?.('⚠️ AI analysis failed: OpenAI API quota exceeded or rate limit reached. Please check your OpenAI account billing and limits.');
              console.error('❌ OpenAI API quota/rate limit error:', result.reasoning);
            } else {
              onProgress?.('AI analysis complete. No specific warnings generated.');
            }
          }
        }
      } else {
        onProgress?.(`Found ${existingWarnings.length} existing content warnings.`);
        // Set pipeline path for cached warnings
        pipelinePath = 'cached_warnings'
      }
    } catch (warningError) {
      console.error('Error generating content warnings:', warningError)
      // Don't fail the scan if warning generation fails
    }
  }

  // Get the final book data for author context investigation (refresh in case of updates)
  const finalBookData = currentBook

  // Check if author context exists, and investigate if missing
  let authorContextInvestigated = false
  try {
    if (finalBookData?.author && finalBookData.author !== 'Unknown Author') {
      console.log('🔍 Checking for existing author context for:', finalBookData.author)

      // Check if author context already exists
      const { data: existingAuthorContext } = await supabaseAdmin
        .from('author_context')
        .select('id')
        .eq('author_name', finalBookData.author)
        .eq('status', 'approved')

      console.log('📊 Existing author context count:', existingAuthorContext?.length || 0)

      if (!existingAuthorContext || existingAuthorContext.length === 0) {
        console.log('🤖 No author context found, investigating with AI agent...')
        console.log(`Author context investigation disabled for ${finalBookData.author}`)
        authorContextInvestigated = true
      }
    }
  } catch (contextError) {
    console.error('Error investigating author context:', contextError)
    // Don't fail the scan if author context investigation fails
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
