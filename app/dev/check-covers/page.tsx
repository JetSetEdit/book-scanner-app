"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, CheckCircle2, XCircle, RefreshCw, Image as ImageIcon, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Book {
  id: string
  isbn: string
  title: string
  author: string | null
  cover_url: string | null
  created_at: string
}

interface CoverCheckResult {
  isValid: boolean
  error?: string
  size?: number
  contentType?: string
}

export default function CheckCoversPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState<{ [key: string]: boolean }>({})
  const [results, setResults] = useState<{ [key: string]: CoverCheckResult }>({})
  const [filter, setFilter] = useState<'all' | 'hasCover' | 'noCover'>('all')
  const [searchIsbn, setSearchIsbn] = useState("")

  const fetchBooks = async () => {
    setLoading(true)
    try {
      const hasCoverParam = filter === 'hasCover' ? 'true' : filter === 'noCover' ? 'false' : null
      const params = new URLSearchParams()
      if (hasCoverParam) params.set('hasCover', hasCoverParam)
      params.set('limit', '100')

      const response = await fetch(`/api/dev/check-covers?${params.toString()}`)
      const data = await response.json()
      setBooks(data.books || [])
    } catch (error) {
      console.error('Error fetching books:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [filter])

  const checkCover = async (book: Book) => {
    if (!book.cover_url) {
      setResults(prev => ({
        ...prev,
        [book.id]: { isValid: false, error: 'No cover URL' }
      }))
      return
    }

    setChecking(prev => ({ ...prev, [book.id]: true }))

    try {
      const response = await fetch(`/api/book-cover?url=${encodeURIComponent(book.cover_url)}`, {
        method: 'HEAD'
      })

      const contentType = response.headers.get('content-type')
      const contentLength = response.headers.get('content-length')
      const size = contentLength ? parseInt(contentLength) : undefined

      if (!response.ok) {
        setResults(prev => ({
          ...prev,
          [book.id]: {
            isValid: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
            size,
            contentType
          }
        }))
        return
      }

      if (!contentType || !contentType.startsWith('image/')) {
        setResults(prev => ({
          ...prev,
          [book.id]: {
            isValid: false,
            error: 'Not an image',
            size,
            contentType
          }
        }))
        return
      }

      // Check for known placeholder sizes
      if (size === 15567) {
        setResults(prev => ({
          ...prev,
          [book.id]: {
            isValid: false,
            error: 'Google Books placeholder (15,567 bytes)',
            size,
            contentType
          }
        }))
        return
      }

      if (size && size < 1024) {
        setResults(prev => ({
          ...prev,
          [book.id]: {
            isValid: false,
            error: `Too small (${size} bytes)`,
            size,
            contentType
          }
        }))
        return
      }

      setResults(prev => ({
        ...prev,
        [book.id]: {
          isValid: true,
          size,
          contentType
        }
      }))
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [book.id]: {
          isValid: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }))
    } finally {
      setChecking(prev => ({ ...prev, [book.id]: false }))
    }
  }

  const checkAllCovers = async () => {
    for (const book of books) {
      if (book.cover_url) {
        await checkCover(book)
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }

  const filteredBooks = searchIsbn
    ? books.filter(book => book.isbn.includes(searchIsbn))
    : books

  const stats = {
    total: books.length,
    withCover: books.filter(b => b.cover_url).length,
    withoutCover: books.filter(b => !b.cover_url).length,
    checked: Object.keys(results).length,
    valid: Object.values(results).filter(r => r.isValid).length,
    invalid: Object.values(results).filter(r => !r.isValid).length,
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>Check Book Covers (Dev)</CardTitle>
          <CardDescription>
            Validate cover URLs for books in the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 border rounded-lg">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Books</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-2xl font-bold">{stats.withCover}</div>
              <div className="text-sm text-muted-foreground">With Cover</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
              <div className="text-sm text-muted-foreground">Valid Covers</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.invalid}</div>
              <div className="text-sm text-muted-foreground">Invalid Covers</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Select value={filter} onValueChange={(v: 'all' | 'hasCover' | 'noCover') => setFilter(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Books</SelectItem>
                <SelectItem value="hasCover">With Cover</SelectItem>
                <SelectItem value="noCover">No Cover</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Search by ISBN..."
              value={searchIsbn}
              onChange={(e) => setSearchIsbn(e.target.value)}
              className="flex-1 max-w-xs"
            />

            <Button onClick={fetchBooks} variant="outline" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>

            <Button onClick={checkAllCovers} variant="outline" disabled={loading}>
              <ImageIcon className="mr-2 h-4 w-4" />
              Check All Covers
            </Button>
          </div>

          {/* Books List */}
          <div className="space-y-4">
            {filteredBooks.map((book) => {
              const result = results[book.id]
              const isChecking = checking[book.id]

              return (
                <div
                  key={book.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Cover Preview */}
                    <div className="flex-shrink-0">
                      <div className="relative w-16 h-24 bg-muted rounded border overflow-hidden">
                        {book.cover_url ? (
                          <img
                            src={`/api/book-cover?url=${encodeURIComponent(book.cover_url)}`}
                            alt={book.title}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            No Cover
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Book Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{book.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {book.author || 'Unknown Author'}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-1">
                        ISBN: {book.isbn}
                      </div>
                      {book.cover_url && (
                        <div className="text-xs text-muted-foreground font-mono truncate mt-1">
                          {book.cover_url.substring(0, 80)}...
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                      <Link href={`/test-cover?isbn=${encodeURIComponent(book.isbn)}`}>
                        <Button size="sm" variant="default">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Test Cover
                        </Button>
                      </Link>
                      {isChecking ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : result ? (
                        result.isValid ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-5 w-5" />
                            <div className="text-xs">
                              <div>Valid</div>
                              {result.size && (
                                <div className="text-muted-foreground">
                                  {(result.size / 1024).toFixed(1)} KB
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-5 w-5" />
                            <div className="text-xs">
                              <div>Invalid</div>
                              <div className="text-muted-foreground">{result.error}</div>
                            </div>
                          </div>
                        )
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => checkCover(book)}
                          disabled={!book.cover_url}
                        >
                          Check
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredBooks.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              No books found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

