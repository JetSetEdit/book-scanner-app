"use client"

import { ContentWarningsList } from "@/components/content-warnings-list"
import { AuditHistory } from "@/components/audit-history"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, Calendar, Layers, Printer, Barcode, ChevronDown, ChevronUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

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
  const [isAuditOpen, setIsAuditOpen] = useState(false)

  const classificationRating = book.classification_rating || getClassificationFromCategories(book.categories)

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors pl-0"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Collection
        </Button>
      </div>

      <div className="grid lg:grid-cols-[350px_1fr] gap-10 items-start">
        {/* Left Column: Cover & Metadata Sidebar */}
        <div className="space-y-6">
          {/* Cover Image */}
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl shadow-2xl bg-muted ring-1 ring-border/50">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={`Cover of ${book.title}`}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground p-6 text-center">
                <BookOpen className="h-16 w-16 mb-4 opacity-20" />
                <span className="text-sm font-medium">No Cover Available</span>
              </div>
            )}

            {/* Classification Badge Overlay */}
            {classificationRating && (
              <div className="absolute top-4 right-4">
                <Badge className="text-lg font-bold px-3 py-1 shadow-lg backdrop-blur-md bg-background/90 text-foreground border-input">
                  {classificationRating}
                </Badge>
              </div>
            )}
          </div>

          {/* Book Metadata Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Book Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              <div className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Barcode className="h-4 w-4" /> ISBN
                </span>
                <span className="font-mono font-medium">{book.isbn}</span>
              </div>

              {book.publisher && (
                <div className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Printer className="h-4 w-4" /> Publisher
                  </span>
                  <span className="font-medium text-right truncate max-w-[180px]" title={book.publisher}>
                    {book.publisher}
                  </span>
                </div>
              )}

              {book.published_date && (
                <div className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Published
                  </span>
                  <span className="font-medium">{book.published_date}</span>
                </div>
              )}

              {book.page_count && (
                <div className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Layers className="h-4 w-4" /> Pages
                  </span>
                  <span className="font-medium">{book.page_count}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Main Content */}
        <div className="space-y-10">
          {/* Header Section */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-balance leading-tight">
              {book.title}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-lg text-muted-foreground">
              <p>
                by <span className="font-semibold text-foreground">{book.author || 'Unknown Author'}</span>
              </p>
            </div>

            {/* Categories */}
            {book.categories && book.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {book.categories
                  .filter(c => !c.startsWith('CLASSIFICATION:') && !c.startsWith('nyt:'))
                  .map((category, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="px-3 py-1 text-sm font-medium bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      {category}
                    </Badge>
                  ))}
              </div>
            )}
          </div>

          {/* Synopsis */}
          {book.description && (
            <div className="prose prose-stone dark:prose-invert max-w-none">
              <h3 className="text-xl font-semibold mb-3">Synopsis</h3>
              <div className="text-muted-foreground leading-relaxed text-lg">
                {book.description.replace(/<[^>]*>?/gm, '')}
              </div>
            </div>
          )}

          {/* Content Warnings Section */}
          <div className="border-t pt-8">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              Content Analysis
            </h3>
            <ContentWarningsList
              warnings={warnings}
              isAuthorApproved={warnings.some(w => w.is_author_approved === true)}
            />
          </div>

          {/* Collapsible Audit History */}
          <div className="border-t pt-8">
            <Collapsible open={isAuditOpen} onOpenChange={setIsAuditOpen} className="w-full space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-muted-foreground">AI Analysis Logs</h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 p-0">
                    {isAuditOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    <span className="sr-only">Toggle Audit Logs</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="space-y-2 animate-accordion-down">
                <div className="bg-muted/30 rounded-lg p-4 border">
                  <AuditHistory bookId={book.id} />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  )
}
