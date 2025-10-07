import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  const supabase = await createClient()

  try {
    // Get the book first
    const { data: book, error: fetchError } = await supabase
      .from('books')
      .select('*')
      .eq('isbn', '9780316769174')
      .single()

    if (fetchError) {
      console.error('Error fetching book:', fetchError)
      return NextResponse.json({ error: 'Book not found', details: fetchError }, { status: 404 })
    }

    console.log('Current book data:', book)

    // Add classification rating to categories
    const existingCategories = book.categories || []
    const classificationTag = 'CLASSIFICATION:M'
    
    // Remove any existing classification tags
    const filteredCategories = existingCategories.filter(cat => !cat.startsWith('CLASSIFICATION:'))
    const updatedCategories = [...filteredCategories, classificationTag]

    console.log('Updated categories:', updatedCategories)

    // Update the book
    const { error: updateError } = await supabase
      .from('books')
      .update({ categories: updatedCategories })
      .eq('isbn', '9780316769174')

    if (updateError) {
      console.error('Error updating book:', updateError)
      return NextResponse.json({ error: 'Failed to update book', details: updateError }, { status: 500 })
    }

    // Fetch the updated book to verify
    const { data: updatedBook, error: verifyError } = await supabase
      .from('books')
      .select('*')
      .eq('isbn', '9780316769174')
      .single()

    if (verifyError) {
      console.error('Error verifying update:', verifyError)
      return NextResponse.json({ error: 'Failed to verify update', details: verifyError }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Classification rating updated',
      originalCategories: existingCategories,
      updatedCategories: updatedCategories,
      finalBook: updatedBook
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred', details: error }, { status: 500 })
  }
}
