"use client"

import { ContentWarningsList } from "@/components/content-warnings-list"
import { AuditHistory } from "@/components/audit-history"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface BookDetailsProps {
  book: any
  warnings: any[]
}

export function BookDetails({ book, warnings }: BookDetailsProps) {
  const router = useRouter()
  const [isAuditOpen, setIsAuditOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white text-slate-950 font-sans selection:bg-slate-950 selection:text-white">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Navigation */}
        <div className="mb-12 flex items-center justify-between border-b border-slate-200 pb-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-slate-500 hover:text-slate-950 hover:bg-transparent pl-0 text-xs font-bold tracking-widest uppercase transition-colors"
          >
            ← Back to Collection
          </Button>
          <div className="text-xs font-bold tracking-widest uppercase text-slate-400">
            Book Scanner v1.0
          </div>
        </div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-16 items-start">
          {/* Left Column: Cover & Specs */}
          <div className="space-y-8 sticky top-8">
            {/* Cover Image - Sharp, elegant shadow */}
            <div className="relative aspect-[2/3] w-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] bg-slate-100">
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={`Cover of ${book.title}`}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 font-serif italic">
                  No Cover
                </div>
              )}
            </div>

            {/* Specs Table - Clean, Modernist lines */}
            <div className="border-t-2 border-slate-950 pt-6">
              <h3 className="font-sans text-xs font-bold uppercase tracking-widest mb-6 text-slate-400">
                Specifications
              </h3>
              <div className="space-y-4 font-sans text-sm">
                <div className="flex justify-between items-baseline border-b border-slate-100 pb-2">
                  <span className="font-medium text-slate-500">ISBN</span>
                  <span className="font-mono text-slate-950">{book.isbn}</span>
                </div>
                {book.publisher && (
                  <div className="flex justify-between items-baseline border-b border-slate-100 pb-2">
                    <span className="font-medium text-slate-500">Publisher</span>
                    <span className="text-slate-950 text-right">{book.publisher}</span>
                  </div>
                )}
                {book.published_date && (
                  <div className="flex justify-between items-baseline border-b border-slate-100 pb-2">
                    <span className="font-medium text-slate-500">Released</span>
                    <span className="text-slate-950">{book.published_date}</span>
                  </div>
                )}
                {book.page_count && (
                  <div className="flex justify-between items-baseline border-b border-slate-100 pb-2">
                    <span className="font-medium text-slate-500">Length</span>
                    <span className="text-slate-950">{book.page_count} pages</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="space-y-12">
            {/* Header */}
            <div className="space-y-6">
              {/* Categories as Modernist Pills */}
              {book.categories && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {book.categories
                    .filter((c: string) => !c.startsWith('CLASSIFICATION:') && !c.startsWith('nyt:'))
                    .map((category: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-slate-200 text-slate-500 rounded-full bg-white"
                      >
                        {category}
                      </span>
                    ))}
                </div>
              )}

              <h1 className="text-5xl md:text-7xl font-serif font-medium tracking-tight text-slate-950 leading-[1.1]">
                {book.title}
              </h1>
              <div className="text-xl md:text-2xl font-serif italic text-slate-500 border-l-2 border-slate-950 pl-6 py-1">
                by {book.author || 'Unknown Author'}
              </div>
            </div>

            {/* Synopsis */}
            {book.description && (
              <div className="prose prose-slate prose-lg max-w-none">
                <p className="text-slate-600 leading-relaxed text-lg">
                  {book.description.replace(/<[^>]*>?/gm, '')}
                </p>
              </div>
            )}

            {/* Content Warnings - The "Feature" Block */}
            <div className="mt-16">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px bg-slate-200 flex-1"></div>
                <h3 className="font-serif text-2xl text-slate-950 italic">Content Analysis</h3>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              <ContentWarningsList
                warnings={warnings}
                isAuthorApproved={warnings.some((w: any) => w.is_author_approved === true)}
              />
            </div>

            {/* Collapsible Audit History - Integrated into new design */}
            <div className="mt-12 border-t border-slate-100 pt-8">
              <Collapsible open={isAuditOpen} onOpenChange={setIsAuditOpen} className="w-full space-y-4">
                <div className="flex items-center justify-between group cursor-pointer" onClick={() => setIsAuditOpen(!isAuditOpen)}>
                  <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
                    System Logs & Audit Trail
                  </h3>
                  <Button variant="ghost" size="sm" className="w-9 p-0 text-slate-400 group-hover:text-slate-600">
                    {isAuditOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    <span className="sr-only">Toggle Audit Logs</span>
                  </Button>
                </div>
                <CollapsibleContent className="space-y-2">
                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-100 font-mono text-sm">
                    <AuditHistory bookId={book.id} />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
