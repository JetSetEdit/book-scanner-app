import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  try {
    const { data: books, error } = await supabase
      .from('books')
      .select('isbn, title, author')

    if (error) {
      console.error("Error fetching books:", error)
      return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 })
    }

    return NextResponse.json({ books })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
