import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Library, Shield, AlertTriangle, Info } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Helper function to extract classification rating from categories
function getClassificationFromCategories(categories?: string[]): string | null {
  if (!categories) return null
  const classificationTag = categories.find(cat => cat.startsWith('CLASSIFICATION:'))
  return classificationTag ? classificationTag.replace('CLASSIFICATION:', '') : null
}

// Helper function to get content warning summary
function getContentWarningSummary(contentWarnings?: any[]): { severe: number; moderate: number; mild: number } {
  if (!contentWarnings) return { severe: 0, moderate: 0, mild: 0 }
  
  return contentWarnings.reduce((acc, warning) => {
    if (warning.severity === 'severe') acc.severe++
    else if (warning.severity === 'moderate') acc.moderate++
    else if (warning.severity === 'mild') acc.mild++
    return acc
  }, { severe: 0, moderate: 0, mild: 0 })
}

export default async function CollectionPage() {
  const supabase = await createClient()

  // Fetch all books from the database with content warnings
  const { data: books, error } = await supabase
    .from("books")
    .select(`
      *,
      content_warnings (
        id,
        description,
        severity
      )
    `)
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
                Book Database
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
            Book Database
          </h1>
          <p className="text-muted-foreground">
            {books?.length || 0} books with content warnings available
          </p>
          
          {/* Content Warning Legend */}
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Content Warning Legend</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Severe warnings</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Moderate warnings</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Mild warnings</span>
              </li>
            </ul>
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" style={{ gap: '3rem' }}>
            {books.map((book) => {
              const warningSummary = getContentWarningSummary(book.content_warnings)
              const hasWarnings = warningSummary.severe > 0 || warningSummary.moderate > 0 || warningSummary.mild > 0
              
              return (
                <Link key={book.id} href={`/book/${book.isbn}`}>
                  <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex gap-4 flex-1">
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

                          {/* Content Warnings Summary */}
                          {hasWarnings && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Shield className="h-3 w-3" />
                                <span className="text-xs font-medium">Content Warnings:</span>
                              </div>
                              <ul className="text-xs space-y-0.5">
                                {warningSummary.severe > 0 && (
                                  <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                    <span>{warningSummary.severe} severe</span>
                                  </li>
                                )}
                                {warningSummary.moderate > 0 && (
                                  <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                                    <span>{warningSummary.moderate} moderate</span>
                                  </li>
                                )}
                                {warningSummary.mild > 0 && (
                                  <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                    <span>{warningSummary.mild} mild</span>
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}

                          {/* Classification Rating */}
                          {(() => {
                            const classificationRating = book.classification_rating || getClassificationFromCategories(book.categories)
                            return classificationRating && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">Classification:</span>
                                <span className="text-xs bg-muted px-2 py-1 rounded">
                                  {classificationRating}
                                </span>
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
                      
                      {/* View Details Button */}
                      <div className="mt-4 pt-4 border-t">
                        <Button variant="outline" size="sm" className="w-full">
                          View Detailed Content Warnings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
