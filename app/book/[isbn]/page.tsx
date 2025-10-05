import { BookDetails } from "@/components/book-details"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

interface BookPageProps {
  params: Promise<{
    isbn: string
  }>
}

export default async function BookPage({ params }: BookPageProps) {
  const { isbn } = await params
  const supabase = await createClient()

  // No authentication required

  // Fetch book data
  const { data: book, error: bookError } = await supabase.from("books").select("*").eq("isbn", isbn).single()

  if (bookError || !book) {
    notFound()
  }

  // Fetch spice ratings
  const { data: spiceRatings } = await supabase
    .from("spice_ratings")
    .select("spice_level, age_rating")
    .eq("book_id", book.id)

  // Calculate average spice level
  const avgSpiceLevel =
    spiceRatings && spiceRatings.length > 0
      ? Math.round(spiceRatings.reduce((sum, r) => sum + r.spice_level, 0) / spiceRatings.length)
      : undefined

  // Get most common age rating
  const ageRating =
    spiceRatings && spiceRatings.length > 0
      ? spiceRatings
          .map((r) => r.age_rating)
          .filter(Boolean)
          .sort(
            (a, b) =>
              spiceRatings.filter((r) => r.age_rating === b).length -
              spiceRatings.filter((r) => r.age_rating === a).length,
          )[0]
      : undefined

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
            spiceLevel={avgSpiceLevel}
            ageRating={ageRating}
            warnings={warningsWithValidations}
          />
        </div>
      </div>
    </main>
  )
}
