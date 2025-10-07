import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Library } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AustralianClassification } from "@/components/australian-classification"

// Helper function to extract classification rating from categories
function getClassificationFromCategories(categories?: string[]): string | null {
  if (!categories) return null
  const classificationTag = categories.find(cat => cat.startsWith('CLASSIFICATION:'))
  return classificationTag ? classificationTag.replace('CLASSIFICATION:', '') : null
}

export default async function CollectionPage() {
  const supabase = await createClient()

  // Fetch all books from the database
  const { data: books, error } = await supabase
    .from("books")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching books:", error)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Library className="h-5 w-5" />
                My Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Error loading your collection. Please try again later.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <Library className="h-8 w-8" />
            My Collection
          </h1>
          <p className="text-muted-foreground">
            {books?.length || 0} book{books?.length !== 1 ? 's' : ''} in your collection
          </p>
        </div>

        {!books || books.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                No Books Yet
              </CardTitle>
              <CardDescription>
                Your collection is empty. Start by adding some books!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Scan a barcode or enter an ISBN to add your first book
                </p>
                <a 
                  href="/" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  Add Your First Book
                </a>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <Link key={book.id} href={`/book/${book.isbn}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Book Cover */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-32 bg-muted rounded-lg overflow-hidden relative">
                          {book.cover_url ? (
                            <Image
                              src={book.cover_url}
                              alt={`Cover of ${book.title}`}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Cover</div>
                          )}
                        </div>
                      </div>

                      {/* Book Details */}
                      <div className="flex-1 space-y-2">
                        <div>
                          <h3 className="font-bold text-lg text-balance mb-1">{book.title}</h3>
                          {book.author && <p className="text-sm text-muted-foreground">by {book.author}</p>}
                        </div>

                        {/* Classification Rating */}
                        {(() => {
                          const classificationRating = book.classification_rating || getClassificationFromCategories(book.categories)
                          return classificationRating && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">Classification:</span>
                              <AustralianClassification 
                                rating={classificationRating as any} 
                                size="sm" 
                              />
                            </div>
                          )
                        })()}

                        {/* Metadata */}
                        <div className="text-xs text-muted-foreground space-y-1">
                          {book.publisher && <div>Publisher: {book.publisher}</div>}
                          {book.published_date && <div>Published: {book.published_date}</div>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
