import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fetchFromGoogleBooks(isbn: string) {
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)
    const data = await response.json()
    
    if (data.items && data.items.length > 0) {
      const book = data.items[0].volumeInfo
      return {
        title: book.title,
        authors: book.authors,
        publisher: book.publisher,
        publishedDate: book.publishedDate,
        description: book.description,
        imageLinks: book.imageLinks,
        categories: book.categories,
        industryIdentifiers: book.industryIdentifiers
      }
    }
    return null
  } catch (error) {
    console.error('Google Books API error:', error)
    return null
  }
}

async function fetchFromOpenLibrary(isbn: string) {
  try {
    const response = await fetch(`https://openlibrary.org/isbn/${isbn}.json`)
    const data = await response.json()
    
    if (data.title) {
      return {
        title: data.title,
        authors: data.authors ? data.authors.map((a: any) => a.name) : [],
        publisher: data.publishers ? data.publishers[0] : null,
        publish_date: data.publish_date,
        description: data.description || data.subtitle,
        covers: data.covers,
        subjects: data.subjects
      }
    }
    return null
  } catch (error) {
    console.error('OpenLibrary API error:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { isbn, limit = 10 } = await request.json()

    if (isbn) {
      // Fetch metadata for specific ISBN
      const cleanIsbn = isbn.replace(/[-\s]/g, '')
      
      // Try Google Books first, then OpenLibrary
      let metadata = await fetchFromGoogleBooks(cleanIsbn)
      if (!metadata) {
        metadata = await fetchFromOpenLibrary(cleanIsbn)
      }

      if (metadata) {
        // Update book record
        const updateData: any = {
          metadata: metadata,
          last_checked: new Date().toISOString(),
          in_db: true
        }

        if (metadata.title) updateData.title = metadata.title
        if (metadata.authors) updateData.author = Array.isArray(metadata.authors) ? metadata.authors.join(', ') : metadata.authors
        if (metadata.publisher) updateData.publisher = metadata.publisher
        if (metadata.publishedDate || metadata.publish_date) updateData.published_date = metadata.publishedDate || metadata.publish_date
        if (metadata.description) updateData.description = metadata.description
        if (metadata.imageLinks?.thumbnail) updateData.cover_url = metadata.imageLinks.thumbnail
        if (metadata.categories) updateData.categories = Array.isArray(metadata.categories) ? metadata.categories.join(', ') : metadata.categories

        const { error } = await supabase
          .from('books')
          .update(updateData)
          .eq('isbn', cleanIsbn)

        if (error) throw error

        return NextResponse.json({
          success: true,
          isbn: cleanIsbn,
          metadata: metadata
        })
      } else {
        return NextResponse.json({
          success: false,
          error: 'No metadata found for ISBN'
        }, { status: 404 })
      }
    } else {
      // Fetch metadata for pending books
      const { data: pendingBooks, error } = await supabase
        .from('books')
        .select('isbn, title, last_checked')
        .eq('review_status', 'pending')
        .or('last_checked.is.null,last_checked.lt.' + new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(limit)

      if (error) throw error

      const results = []
      for (const book of pendingBooks || []) {
        const cleanIsbn = book.isbn.replace(/[-\s]/g, '')
        
        let metadata = await fetchFromGoogleBooks(cleanIsbn)
        if (!metadata) {
          metadata = await fetchFromOpenLibrary(cleanIsbn)
        }

        if (metadata) {
          const updateData: any = {
            metadata: metadata,
            last_checked: new Date().toISOString(),
            in_db: true
          }

          if (metadata.title) updateData.title = metadata.title
          if (metadata.authors) updateData.author = Array.isArray(metadata.authors) ? metadata.authors.join(', ') : metadata.authors
          if (metadata.publisher) updateData.publisher = metadata.publisher
          if (metadata.publishedDate || metadata.publish_date) updateData.published_date = metadata.publishedDate || metadata.publish_date
          if (metadata.description) updateData.description = metadata.description
          if (metadata.imageLinks?.thumbnail) updateData.cover_url = metadata.imageLinks.thumbnail
          if (metadata.categories) updateData.categories = Array.isArray(metadata.categories) ? metadata.categories.join(', ') : metadata.categories

          const { error: updateError } = await supabase
            .from('books')
            .update(updateData)
            .eq('isbn', cleanIsbn)

          if (!updateError) {
            results.push({ isbn: cleanIsbn, success: true, metadata })
          } else {
            results.push({ isbn: cleanIsbn, success: false, error: updateError.message })
          }
        } else {
          results.push({ isbn: cleanIsbn, success: false, error: 'No metadata found' })
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      return NextResponse.json({
        success: true,
        processed: results.length,
        results: results
      })
    }

  } catch (error) {
    console.error('Fetch metadata error:', error)
    return NextResponse.json({
      error: 'Failed to fetch metadata',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


