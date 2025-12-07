import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Library, Shield, AlertTriangle, Info, AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { RefreshBookButtonWrapper } from "@/components/refresh-book-button-wrapper"
import { SeverityMild, SeverityModerate, SeveritySevere } from "@/components/severity-icons"
import { SeverityLegend } from "@/components/severity-legend"

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
                Bookshelf
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
            Bookshelf
          </h1>
          <p className="text-muted-foreground">
            {books?.length || 0} books with content warnings available
          </p>

          {/* Content Warning Legend */}
          <div className="mt-8 border-t-2 border-slate-200 pt-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-slate-200 flex-1"></div>
              <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-slate-400">
                Warning Legend
              </h3>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>
            <SeverityLegend />
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
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h3 className="font-bold text-lg text-balance mb-1 leading-tight">{book.title}</h3>
                              {book.author && <p className="text-sm text-muted-foreground">by {book.author}</p>}
                            </div>
                            <RefreshBookButtonWrapper isbn={book.isbn} />
                          </div>

                          {/* Content Warnings Summary */}
                          {hasWarnings ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Shield className="h-3 w-3" />
                                <span className="text-xs font-medium">Content Warnings:</span>
                              </div>
                              <ul className="text-xs space-y-0.5">
                                {warningSummary.severe > 0 && (
                                  <li className="flex items-center gap-2">
                                    <div className="p-0.5 rounded-full bg-red-50 text-red-600">
                                      <SeveritySevere className="h-3 w-3" />
                                    </div>
                                    <span>{warningSummary.severe} severe</span>
                                  </li>
                                )}
                                {warningSummary.moderate > 0 && (
                                  <li className="flex items-center gap-2">
                                    <div className="p-0.5 rounded-full bg-orange-50 text-orange-600">
                                      <SeverityModerate className="h-3 w-3" />
                                    </div>
                                    <span>{warningSummary.moderate} moderate</span>
                                  </li>
                                )}
                                {warningSummary.mild > 0 && (
                                  <li className="flex items-center gap-2">
                                    <div className="p-0.5 rounded-full bg-yellow-50 text-yellow-600">
                                      <SeverityMild className="h-3 w-3" />
                                    </div>
                                    <span>{warningSummary.mild} mild</span>
                                  </li>
                                )}
                              </ul>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Shield className="h-3 w-3" />
                                <span className="text-xs font-medium">Content Warnings:</span>
                              </div>
                              <p className="text-xs text-muted-foreground pl-5">No specific warnings</p>
                            </div>
                          )}

                          {/* Classification Rating */}
                          {(() => {
                            const classificationRating = (book as any).classification_rating || getClassificationFromCategories(book.categories || undefined)
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

                      {/* View Book Link */}
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="text-center">
                          <span className="text-xs font-bold tracking-widest uppercase text-slate-400 hover:text-slate-600 transition-colors">
                            View Book
                          </span>
                        </div>
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
