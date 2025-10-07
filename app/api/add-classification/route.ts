import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { isbn, classification_rating } = await request.json()
    
    if (!isbn || !classification_rating) {
      return NextResponse.json({ error: 'ISBN and classification rating are required' }, { status: 400 })
    }

    // Validate classification rating
    const validRatings = ['G', 'PG', 'M', 'MA15+', 'R18+', 'X18+']
    if (!validRatings.includes(classification_rating)) {
      return NextResponse.json({ error: 'Invalid classification rating' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // For now, store classification rating in categories field as a workaround
    // until we can add the proper classification_rating column
    const { data: existingBook, error: fetchError } = await supabase
      .from('books')
      .select('categories')
      .eq('isbn', isbn)
      .single()

    if (fetchError) {
      console.error('Error fetching book:', fetchError)
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Add classification rating to categories
    const existingCategories = existingBook.categories || []
    const classificationTag = `CLASSIFICATION:${classification_rating}`
    
    // Remove any existing classification tags
    const filteredCategories = existingCategories.filter(cat => !cat.startsWith('CLASSIFICATION:'))
    const updatedCategories = [...filteredCategories, classificationTag]

    const { error } = await supabase
      .from('books')
      .update({ categories: updatedCategories })
      .eq('isbn', isbn)
    
    if (error) {
      console.error('Error updating book:', error)
      return NextResponse.json({ error: 'Failed to update book' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, message: 'Classification rating updated' })
  } catch (error) {
    console.error('Error in add-classification API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
