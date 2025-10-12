"use client"

import { ContentWarningsList } from "@/components/content-warnings-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, BookOpen } from "lucide-react"
import { useRouter } from "next/navigation"

interface BookDetailsProps {
  book: {
    id: string
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
  warnings: Array<{
    id: string
    category: string
    description: string
    severity: "mild" | "moderate" | "severe"
    helpful_count: number
    not_helpful_count: number
    user_validation?: boolean | null
  }>
}

// Helper function to extract classification rating from categories
function getClassificationFromCategories(categories?: string[]): string | null {
  if (!categories) return null
  const classificationTag = categories.find(cat => cat.startsWith('CLASSIFICATION:'))
  return classificationTag ? classificationTag.replace('CLASSIFICATION:', '') : null
}

export function BookDetails({ book, warnings }: BookDetailsProps) {
  const router = useRouter()
  
  // Extract classification rating from categories if not directly available
  const classificationRating = book.classification_rating || getClassificationFromCategories(book.categories)
  
  


  const handleBack = () => {
    router.push('/')
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Button 
        variant="outline" 
        onClick={handleBack}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Book Information */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-6">
            {/* Book Cover */}
            <div className="flex-shrink-0">
              {book.cover_url ? (
                <img 
                  src={book.cover_url} 
                  alt={`Cover of ${book.title}`}
                  className="w-32 h-48 object-cover rounded-lg shadow-md"
                />
              ) : (
                <div className="w-32 h-48 bg-muted rounded-lg flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Book Details */}
            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-2xl font-bold text-balance">{book.title}</h1>
                <p className="text-lg text-muted-foreground">by {book.author || 'Unknown Author'}</p>
              </div>
              
              {book.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{book.description}</p>
                </div>
              )}
              
              {/* Book Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {book.publisher && (
                  <div>
                    <span className="font-medium">Publisher:</span>
                    <span className="ml-2 text-muted-foreground">{book.publisher}</span>
                  </div>
                )}
                {book.published_date && (
                  <div>
                    <span className="font-medium">Published:</span>
                    <span className="ml-2 text-muted-foreground">{book.published_date}</span>
                  </div>
                )}
                {book.page_count && (
                  <div>
                    <span className="font-medium">Pages:</span>
                    <span className="ml-2 text-muted-foreground">{book.page_count}</span>
                  </div>
                )}
                {book.categories && book.categories.length > 0 && (
                  <div>
                    <span className="font-medium">Categories:</span>
                    <span className="ml-2 text-muted-foreground">{book.categories.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ContentWarningsList 
        warnings={warnings} 
        isAuthorApproved={warnings.some(w => w.is_author_approved === true)} 
      />




      {/* Temporarily hidden - user contribution section */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Contribute
          </CardTitle>
          <CardDescription>Help the community by adding content warnings or ratings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
        </CardContent>
      </Card> */}
    </div>
  )
}
