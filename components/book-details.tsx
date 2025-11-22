"use client"

import { ContentWarningsList } from "@/components/content-warnings-list"
import { AuditHistory } from "@/components/audit-history"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, Calendar, Layers, Printer } from "lucide-react"
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
    is_author_approved?: boolean
    source?: string
    reasoning?: string | null
    is_author_verified?: boolean
    source_url?: string | null
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
  
  const classificationRating = book.classification_rating || getClassificationFromCategories(book.categories)

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={handleBack}
        className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors pl-0"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back to Collection
      </Button>

      <div className="grid md:grid-cols-[300px_1fr] gap-8 items-start">
        {/* Left Column: Cover & Quick Stats */}
        <div className="space-y-6">
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg shadow-2xl bg-muted">
             {book.cover_url ? (
                <img 
                  src={book.cover_url} 
                  alt={`Cover of ${book.title}`}
                  className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground">
                  <BookOpen className="h-16 w-16 mb-4 opacity-20" />
                  <span className="text-sm font-medium">No Cover Available</span>
                </div>
              )}
              
              {/* Classification Badge Overlay */}
              {classificationRating && (
                <div className="absolute top-4 right-4">
                   <Badge variant="secondary" className="backdrop-blur-md bg-background/80 text-foreground font-bold border shadow-sm">
                      {classificationRating}
                   </Badge>
                </div>
              )}
          </div>
          
          <Card className="bg-muted/30 border-none shadow-none">
             <CardContent className="p-4 space-y-4 text-sm">
                {book.publisher && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                        <Printer className="h-4 w-4" /> Publisher
                    </span>
                    <span className="font-medium text-right truncate max-w-[150px]">{book.publisher}</span>
                  </div>
                )}
                {book.published_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Published
                    </span>
                    <span className="font-medium">{book.published_date}</span>
                  </div>
                )}
                {book.page_count && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                        <Layers className="h-4 w-4" /> Pages
                    </span>
                    <span className="font-medium">{book.page_count}</span>
                  </div>
                )}
             </CardContent>
          </Card>
        </div>

        {/* Right Column: Details & Warnings */}
        <div className="space-y-8">
          <div>
            <div className="space-y-2 mb-6">
                <h1 className="text-4xl font-extrabold tracking-tight text-balance">{book.title}</h1>
                <p className="text-xl text-muted-foreground">by <span className="font-semibold text-foreground">{book.author || 'Unknown Author'}</span></p>
            </div>

            {book.categories && book.categories.length > 0 && (
               <div className="flex flex-wrap gap-2 mb-6">
                  {book.categories.filter(c => !c.startsWith('CLASSIFICATION:')).map((category, i) => (
                    <Badge key={i} variant="outline" className="px-3 py-1 text-sm font-medium border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors cursor-default">
                      {category}
                    </Badge>
                  ))}
               </div>
            )}

            {book.description && (
              <div className="prose prose-stone dark:prose-invert max-w-none">
                {/* Check if description starts with a quote-like structure (e.g. "I shouldn't have...") */}
                {book.description.match(/^["']?I /) || book.description.match(/^["']?[A-Z][^.?!]+[.?!]["']?(\s|$)/) ? (
                    <div className="mb-4 pl-4 border-l-4 border-primary/20 italic text-xl text-muted-foreground font-serif">
                        {book.description.split('\n')[0]}
                    </div>
                ) : null}
                
                <p className="text-muted-foreground leading-relaxed text-lg">
                    {/* If we showed the first line as a quote, maybe we want to show the rest? Or just show it all? 
                        Let's just show the full description clean for now, the quote block above is purely decorative if it matches a "hook" style.
                    */}
                    {book.description.replace(/<[^>]*>?/gm, '')}
                </p>
              </div>
            )}
          </div>

          <div className="border-t pt-8">
             <ContentWarningsList 
                warnings={warnings} 
                isAuthorApproved={warnings.some(w => w.is_author_approved === true)} 
             />
          </div>

          <div className="border-t pt-8">
             <AuditHistory bookId={book.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
