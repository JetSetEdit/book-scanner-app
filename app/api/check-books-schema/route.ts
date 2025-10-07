import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  try {
    // Get a sample book to see what columns exist
    const { data: books, error } = await supabase
      .from('books')
      .select('*')
      .limit(1)

    if (error) {
      console.error("Error fetching books:", error)
      return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 })
    }

    if (books && books.length > 0) {
      const book = books[0]
      const columns = Object.keys(book)
      return NextResponse.json({ 
        message: "Books table columns", 
        columns: columns,
        sampleBook: book
      })
    } else {
      return NextResponse.json({ message: "No books found" })
    }
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
