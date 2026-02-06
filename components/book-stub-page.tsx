/**
 * Book Stub Page Component
 * 
 * Displays an SEO-friendly landing page for books that haven't been scanned yet.
 * Shows book metadata from external sources (Open Library, Google Books) and
 * encourages users to scan the book to unlock content warnings.
 * 
 * The component handles two states:
 * 1. With minimum metadata (title + author) → Full enhanced stub page, indexable
 * 2. Without minimum metadata → Fallback message, not indexable (noindex set via generateMetadata)
 * 
 * Note: Robots meta tag is handled in generateMetadata function, not here.
 */

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ScanBarcode, BookOpen, HelpCircle, ArrowRight } from "lucide-react"
import Image from "next/image"

interface BookStubPageProps {
  isbn: string
  metadata: {
    title: string
    author?: string
    cover_url?: string
    description?: string
    publisher?: string
    published_date?: string
  } | null
  shouldIndex: boolean
}

export function BookStubPage({ isbn, metadata, shouldIndex }: BookStubPageProps) {
  const hasMinimumMetadata = metadata && metadata.title && metadata.author

  return (
    <main className="min-h-screen bg-background">

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {hasMinimumMetadata ? (
            // Enhanced stub page with metadata
            <div className="space-y-8">
              {/* Book Header */}
              <div className="grid md:grid-cols-3 gap-8">
                {/* Cover */}
                <div className="md:col-span-1">
                  {metadata.cover_url ? (
                    <div className="relative aspect-[2/3] w-full bg-muted shadow-lg rounded-lg overflow-hidden">
                      <Image
                        src={metadata.cover_url.startsWith("http") 
                          ? `/api/book-cover?url=${encodeURIComponent(metadata.cover_url)}`
                          : metadata.cover_url}
                        alt={`Cover of ${metadata.title}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 300px"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[2/3] w-full bg-muted rounded-lg flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
                      {metadata.title}
                    </h1>
                    {metadata.author && (
                      <p className="text-xl text-muted-foreground">by {metadata.author}</p>
                    )}
                  </div>

                  {metadata.publisher && (
                    <div className="text-sm text-muted-foreground">
                      <span>Published by {metadata.publisher}</span>
                      {metadata.published_date && <span> • {metadata.published_date}</span>}
                    </div>
                  )}

                  {metadata.description && (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-muted-foreground leading-relaxed line-clamp-4">
                        {metadata.description}
                      </p>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Link href={`/scan?isbn=${encodeURIComponent(isbn)}`}>
                      <Button size="lg" className="w-full sm:w-auto">
                        <ScanBarcode className="mr-2 h-5 w-5" />
                        Scan this book
                      </Button>
                    </Link>
                    <Link href="/scan">
                      <Button variant="outline" size="lg" className="w-full sm:w-auto">
                        Go to scanner
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Why isn't this scanned yet? */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Why isn&apos;t this scanned yet?
                  </CardTitle>
                  <CardDescription>
                    Subtext content warnings are created by readers like you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    This book hasn&apos;t been scanned in Subtext yet. Content warnings are generated 
                    by our community of readers who scan books and help others read safely.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>Scan this book</strong> to unlock content warnings and help others discover 
                    what&apos;s inside before they read. The process takes just a few moments and helps 
                    build a safer reading community.
                  </p>
                  <div className="pt-2">
                    <Link href={`/scan?isbn=${encodeURIComponent(isbn)}`}>
                      <Button variant="default" className="w-full sm:w-auto">
                        Scan {metadata.title}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Fallback when metadata unavailable
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>This book isn&apos;t in Subtext yet</CardTitle>
                  <CardDescription>
                    We couldn&apos;t find ISBN <span className="font-mono">{isbn}</span> in our database or external libraries.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    This ISBN may be invalid, or the book may not be available in our external data sources 
                    (Open Library, Google Books). You can still try scanning it to create the book page.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Link href={`/scan?isbn=${encodeURIComponent(isbn)}`}>
                      <Button className="w-full sm:w-auto">
                        <ScanBarcode className="mr-2 h-5 w-5" />
                        Try scanning anyway
                      </Button>
                    </Link>
                    <Link href="/scan">
                      <Button variant="outline" className="w-full sm:w-auto">
                        Go to scanner
                      </Button>
                    </Link>
                    <Link href="/">
                      <Button variant="ghost" className="w-full sm:w-auto">
                        Back to home
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
