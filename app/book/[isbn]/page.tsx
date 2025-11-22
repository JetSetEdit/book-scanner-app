import { BookDetails } from "@/components/book-details"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

interface BookPageProps {
  params: {
    isbn: string
  }
}

export default async function BookPage({ params }: BookPageProps) {
  const { isbn } = params
  const supabase = await createClient()

  // No authentication required

  // Fetch book data
  const { data: book, error: bookError } = await supabase.from("books").select("*").eq("isbn", isbn).single()

  if (bookError || !book) {
    notFound()
  }


  // Fetch content warnings
  const { data: warnings } = await supabase
    .from("content_warnings")
    .select("*")
    .eq("book_id", book.id)
    .order("helpful_count", { ascending: false })

  // No user validation needed - all warnings are shown without user-specific data
  const warningsWithValidations = warnings || []

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <BookDetails
            book={book}
            warnings={warningsWithValidations}
          />
        </div>
      </div>
    </main>
  )
}
