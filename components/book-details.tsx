"use client"

import { BookCard } from "@/components/book-card"
import { ContentWarningsList } from "@/components/content-warnings-list"
import { AustralianClassification } from "@/components/australian-classification"
import { AddWarningDialog } from "@/components/add-warning-dialog"
import { AddSpiceRatingDialog } from "@/components/add-spice-rating-dialog"
import { AuthorContextDisplay } from "@/components/author-context-display"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft } from "lucide-react"
import { addContentWarning, addSpiceRating } from "@/app/actions/warning-actions"
import { useRouter } from "next/navigation"
import { useAuthorContext } from "@/hooks/use-author-context"

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
  spiceLevel?: number
  ageRating?: string
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

export function BookDetails({ book, spiceLevel, ageRating, warnings }: BookDetailsProps) {
  const router = useRouter()
  
  // Extract classification rating from categories if not directly available
  const classificationRating = book.classification_rating || getClassificationFromCategories(book.categories)
  
  // Get author context information
  const { contextItems, loading: contextLoading, investigateAuthor } = useAuthorContext(book.author || null)
  
  const handleAddWarning = async (data: { category: string; description: string; severity: string }) => {
    return await addContentWarning(book.id, data)
  }

  const handleAddRating = async (data: { spiceLevel: number; ageRating: string }) => {
    return await addSpiceRating(book.id, data)
  }

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
      <BookCard
        book={book}
        spiceLevel={spiceLevel}
        ageRating={ageRating}
        affiliateLink={`https://www.amazon.com/s?k=${book.isbn}`}
        isClickable={false}
      />

      <ContentWarningsList 
        warnings={warnings} 
        isAuthorApproved={warnings.some(w => w.is_author_approved === true)} 
      />

      {/* Author Context & Accountability Section */}
      {book.author && (
        <AuthorContextDisplay 
          contextItems={contextItems} 
          authorName={book.author}
          loading={contextLoading}
          onInvestigate={investigateAuthor}
        />
      )}

      {/* Australian Classification Section */}
      {classificationRating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AustralianClassification rating={classificationRating as any} size="md" />
              <span>Australian Classification</span>
            </CardTitle>
            <CardDescription>
              Official classification rating from the Australian Classification Board
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <AustralianClassification 
                rating={classificationRating as any} 
                size="lg" 
                showLabel={true}
              />
            </div>
          </CardContent>
        </Card>
      )}


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
          <AddWarningDialog bookId={book.id} onSubmit={handleAddWarning} />
          <AddSpiceRatingDialog bookId={book.id} onSubmit={handleAddRating} />
        </CardContent>
      </Card> */}
    </div>
  )
}
