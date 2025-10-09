import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { fetchBookByISBN } from '@/lib/book-api'
import { validateISBN, normalizeISBN } from '@/lib/isbn-validation'
import { matchBook, createBookRecord, BookMetadata } from '@/lib/book-matching'

export async function POST(request: NextRequest) {
  try {
    console.log('Scan ISBN V2 API called')
    
    const { isbn, notes } = await request.json()
    console.log('Processing ISBN:', isbn)

    if (!isbn) {
      return NextResponse.json({ error: 'ISBN is required' }, { status: 400 })
    }

    // Validate ISBN format
    if (!validateISBN(isbn)) {
      console.log('Invalid ISBN format:', isbn)
      return NextResponse.json({ 
        error: 'Invalid ISBN format. Please enter a valid 10 or 13 digit ISBN.' 
      }, { status: 400 })
    }

    // Clean ISBN (remove hyphens, spaces)
    const cleanIsbn = normalizeISBN(isbn)

    // Step 1: Try external APIs to get metadata
    console.log('Fetching book metadata for ISBN:', cleanIsbn)
    const bookData = await fetchBookByISBN(cleanIsbn)

    let metadata: BookMetadata
    let contentWarningsGenerated = false

    if (bookData) {
      // Convert external API data to our metadata format
      metadata = {
        title: bookData.title,
        authors: bookData.author ? [bookData.author] : [],
        publisher: bookData.publisher,
        pubYear: bookData.published_date ? new Date(bookData.published_date).getFullYear() : undefined,
        binding: 'other', // Default, could be enhanced to detect from API
        language: 'en', // Default, could be enhanced to detect from API
        isbn13: cleanIsbn.length === 13 ? cleanIsbn : undefined,
        isbn10: cleanIsbn.length === 10 ? cleanIsbn : undefined,
        coverUrl: bookData.cover_url,
        description: bookData.description,
        categories: bookData.categories,
        source: 'openlibrary' // Will be updated based on which API returned data
      }
    } else {
      // Try AI agent to find book information
      console.log('External APIs failed, trying AI agent...')
      try {
        const { findBookAndGenerateWarnings } = await import('@/lib/content-warning-agent')
        const aiResult = await findBookAndGenerateWarnings(cleanIsbn)

        if (aiResult.book_found) {
          metadata = {
            title: aiResult.book_title || `Unknown Book (ISBN: ${cleanIsbn})`,
            authors: aiResult.book_author ? [aiResult.book_author] : [],
            publisher: undefined,
            pubYear: undefined,
            binding: 'other',
            language: 'en',
            isbn13: cleanIsbn.length === 13 ? cleanIsbn : undefined,
            isbn10: cleanIsbn.length === 10 ? cleanIsbn : undefined,
            coverUrl: aiResult.book_cover_url,
            description: aiResult.book_description,
            categories: aiResult.book_categories,
            source: 'ai_agent'
          }
        } else {
          // Create minimal metadata
          metadata = {
            title: `Unknown Book (ISBN: ${cleanIsbn})`,
            authors: ['Unknown Author'],
            publisher: undefined,
            pubYear: undefined,
            binding: 'other',
            language: 'en',
            isbn13: cleanIsbn.length === 13 ? cleanIsbn : undefined,
            isbn10: cleanIsbn.length === 10 ? cleanIsbn : undefined,
            source: 'manual'
          }
        }
      } catch (aiError) {
        console.error('AI agent failed:', aiError)
        // Create minimal metadata
        metadata = {
          title: `Unknown Book (ISBN: ${cleanIsbn})`,
          authors: ['Unknown Author'],
          publisher: undefined,
          pubYear: undefined,
          binding: 'other',
          language: 'en',
          isbn13: cleanIsbn.length === 13 ? cleanIsbn : undefined,
          isbn10: cleanIsbn.length === 10 ? cleanIsbn : undefined,
          source: 'manual'
        }
      }
    }

    // Step 2: Match against existing books
    console.log('Matching book against existing records...')
    const matchResult = await matchBook(cleanIsbn, metadata)

    console.log('Match result:', matchResult)

    let workId: string
    let editionId: string
    let isNewBook = false

    if (matchResult.action === 'link') {
      // Link to existing book
      workId = matchResult.workId!
      editionId = matchResult.editionId!
      console.log(`Linking to existing book: work=${workId}, edition=${editionId}`)
    } else if (matchResult.action === 'create_edition') {
      // Create new edition under existing work
      workId = matchResult.workId!
      const result = await createBookRecord(cleanIsbn, metadata, workId)
      editionId = result.editionId
      isNewBook = true
      console.log(`Created new edition under existing work: work=${workId}, edition=${editionId}`)
    } else if (matchResult.action === 'create_work') {
      // Create new work and edition
      const result = await createBookRecord(cleanIsbn, metadata)
      workId = result.workId
      editionId = result.editionId
      isNewBook = true
      console.log(`Created new work and edition: work=${workId}, edition=${editionId}`)
    } else {
      // Low confidence - create minimal record and flag for review
      const result = await createBookRecord(cleanIsbn, metadata)
      workId = result.workId
      editionId = result.editionId
      isNewBook = true
      console.log(`Created minimal record for review: work=${workId}, edition=${editionId}`)
    }

    // Step 3: Check for content warnings
    console.log('Checking for content warnings...')
    const { data: existingWarnings } = await supabaseAdmin
      .from('content_warnings')
      .select('id')
      .eq('book_id', workId) // Content warnings are linked to work, not edition

    if (!existingWarnings || existingWarnings.length === 0) {
      console.log('No content warnings found, generating with AI agent...')
      try {
        const { generateContentWarnings } = await import('@/lib/content-warning-agent')
        
        const result = await generateContentWarnings({
          book_title: metadata.title,
          book_author: metadata.authors.join(', '),
          book_description: metadata.description,
          book_categories: metadata.categories,
          book_isbn: cleanIsbn
        })

        if (result.content_warnings.length > 0) {
          const warningsToInsert = result.content_warnings.map(warning => ({
            book_id: workId,
            category: warning.category,
            description: warning.description,
            severity: warning.severity,
            is_author_approved: false,
            source: 'ai_generated',
            user_id: null
          }))

          const { error: insertError } = await supabaseAdmin
            .from('content_warnings')
            .insert(warningsToInsert)

          if (!insertError) {
            contentWarningsGenerated = true
            console.log(`Generated ${result.content_warnings.length} content warnings`)
          } else {
            console.error('Failed to insert AI-generated warnings:', insertError)
          }
        }
      } catch (warningError) {
        console.error('Error generating content warnings:', warningError)
      }
    }

    // Step 4: Record the scan
    const { data: scan, error: scanError } = await supabaseAdmin
      .from('scans')
      .insert({
        isbn: cleanIsbn,
        book_id: workId,
        notes: notes || null
      })
      .select()
      .single()

    if (scanError) {
      console.error('Error recording scan:', scanError)
      // Don't fail the whole operation for scan recording errors
    }

    // Step 5: Get book details for response
    const { data: bookDetails } = await supabaseAdmin
      .from('book_details')
      .select('*')
      .eq('work_id', workId)
      .eq('edition_id', editionId)
      .single()

    return NextResponse.json({
      success: true,
      book: bookDetails,
      scan: scan || { id: 'temp-scan-id', isbn: cleanIsbn, book_id: workId },
      isNewBook,
      contentWarningsGenerated,
      matchResult: {
        confidence: matchResult.confidence,
        action: matchResult.action,
        reason: matchResult.reason
      }
    })

  } catch (error) {
    console.error('Scan ISBN V2 error:', JSON.stringify(error, null, 2))
    return NextResponse.json({
      error: 'Failed to process ISBN scan',
      details: error instanceof Error ? error.message : 'Unknown error',
      debug: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

