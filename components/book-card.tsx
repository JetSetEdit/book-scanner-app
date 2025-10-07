import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { AustralianClassification } from "@/components/australian-classification"

interface BookCardProps {
  book: {
    isbn: string
    title: string
    author?: string
    cover_url?: string
    description?: string
    publisher?: string
    published_date?: string
    page_count?: number
    categories?: string[]
    classification_rating?: string
  }
  spiceLevel?: number
  ageRating?: string
  affiliateLink?: string
}

// Helper function to extract classification rating from categories
function getClassificationFromCategories(categories?: string[]): string | null {
  if (!categories) return null
  const classificationTag = categories.find(cat => cat.startsWith('CLASSIFICATION:'))
  return classificationTag ? classificationTag.replace('CLASSIFICATION:', '') : null
}

export function BookCard({ book, spiceLevel, ageRating, affiliateLink }: BookCardProps) {
  // Extract classification rating from categories if not directly available
  const classificationRating = book.classification_rating || getClassificationFromCategories(book.categories)
  return (
    <Link href={`/book/${book.isbn}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-6">
        <div className="flex gap-6">
          {/* Book Cover */}
          <div className="flex-shrink-0">
            <div className="w-32 h-48 bg-muted rounded-lg overflow-hidden relative">
              {book.cover_url ? (
                <Image
                  src={book.cover_url || "/placeholder.svg"}
                  alt={`Cover of ${book.title}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Cover</div>
              )}
            </div>
          </div>

          {/* Book Details */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-balance mb-1">{book.title}</h2>
              {book.author && <p className="text-muted-foreground">by {book.author}</p>}
            </div>

            {/* Ratings */}
            {spiceLevel !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Spice Level:</span>
                <span className="text-sm text-muted-foreground">{spiceLevel}/5</span>
              </div>
            )}
            {ageRating && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Age Rating:</span>
                <Badge variant="secondary">{ageRating}</Badge>
              </div>
            )}
            {classificationRating && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Classification:</span>
                <AustralianClassification 
                  rating={classificationRating as any} 
                  size="sm" 
                />
              </div>
            )}

            {/* Description */}
            {book.description && <p className="text-sm text-muted-foreground line-clamp-3">{book.description}</p>}

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {book.publisher && <span>Publisher: {book.publisher}</span>}
              {book.published_date && <span>Published: {book.published_date}</span>}
              {book.page_count && <span>{book.page_count} pages</span>}
            </div>

            {/* Categories */}
            {book.categories && book.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {book.categories.map((category) => (
                  <Badge key={category} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
            )}

            {/* Affiliate Link */}
            {affiliateLink && (
              <a
                href={affiliateLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Buy on Amazon
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
        </CardContent>
      </Card>
    </Link>
  )
}
