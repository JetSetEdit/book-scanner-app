"use client"




import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, X, BookOpen, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"

interface SearchResult {
  id: string
  isbn: string
  title: string
  author: string | null
  cover_url: string | null
  warningSummary: {
    severe: number
    moderate: number
    mild: number
  }
  hasWarnings: boolean
  source?: 'database' | 'external_api'
}

interface ExternalSearchResult {
  isbn: string
  title: string
  author: string | null
  cover_url: string | null
  description: string | null
  source: 'external_api'
}

interface SearchResponse {
  books: SearchResult[]
  externalResults?: ExternalSearchResult[]
  total: number
  query: string
  isISBN?: boolean
  isbnNotFound?: boolean
  normalizedISBN?: string | null
}

interface SearchProps {
  className?: string
  placeholder?: string
}

export function SearchComponent({ className, placeholder }: SearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [externalResults, setExternalResults] = useState<ExternalSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [searchMeta, setSearchMeta] = useState<{ isISBN?: boolean; isbnNotFound?: boolean; normalizedISBN?: string | null }>({})
  const [severityFilters, setSeverityFilters] = useState({
    mild: true,
    moderate: true,
    severe: true,
  })
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Debounced search with severity filters
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setShowResults(false)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const timeoutId = setTimeout(async () => {
      try {
        const severityParams = Object.entries(severityFilters)
          .filter(([_, enabled]) => enabled)
          .map(([severity]) => severity)
          .join(",")

        const url = `/api/search?q=${encodeURIComponent(query)}${severityParams ? `&severity=${severityParams}` : ""}`
        const response = await fetch(url)
        const data: SearchResponse = await response.json()
        setResults(data.books || [])
        setExternalResults(data.externalResults || [])
        console.log('[Search Component] Results:', {
          database: data.books?.length || 0,
          external: data.externalResults?.length || 0,
          total: (data.books?.length || 0) + (data.externalResults?.length || 0)
        })
        setSearchMeta({
          isISBN: data.isISBN,
          isbnNotFound: data.isbnNotFound,
          normalizedISBN: data.normalizedISBN,
        })
        setShowResults(true)
      } catch (error) {
        console.error("Search error:", error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [query, severityFilters])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setIsOpen(true)
  }

  const handleClear = () => {
    setQuery("")
    setResults([])
    setExternalResults([])
    setShowResults(false)
    inputRef.current?.focus()
  }

  const handleResultClick = () => {
    setShowResults(false)
    setQuery("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setShowResults(false)
      inputRef.current?.blur()
    } else if (e.key === "Enter" && results.length > 0) {
      router.push(`/book/${results[0].isbn}`)
      handleResultClick()
    }
  }

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-md", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50 pointer-events-none" strokeWidth={1.5} />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder || "Search by title, author, or ISBN (e.g. ‘Fourth Wing’ or 9781649374042)"}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0 || externalResults.length > 0) setShowResults(true)
          }}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 w-full"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (query.length >= 2 || results.length > 0 || externalResults.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-lg z-[100] max-h-[500px] overflow-y-auto">
          {/* Severity Filters */}
          {query.length >= 2 && (
            <div className="px-4 py-3 border-b border-border bg-muted/50">
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-muted-foreground">Filter by tolerance:</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      id="filter-mild"
                      checked={severityFilters.mild}
                      onCheckedChange={(checked) =>
                        setSeverityFilters((prev) => ({ ...prev, mild: checked === true }))
                      }
                    />
                    <Label
                      htmlFor="filter-mild"
                      className="text-xs font-medium text-yellow-600 cursor-pointer"
                    >
                      Mild
                    </Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      id="filter-moderate"
                      checked={severityFilters.moderate}
                      onCheckedChange={(checked) =>
                        setSeverityFilters((prev) => ({ ...prev, moderate: checked === true }))
                      }
                    />
                    <Label
                      htmlFor="filter-moderate"
                      className="text-xs font-medium text-orange-600 cursor-pointer"
                    >
                      Moderate
                    </Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      id="filter-severe"
                      checked={severityFilters.severe}
                      onCheckedChange={(checked) =>
                        setSeverityFilters((prev) => ({ ...prev, severe: checked === true }))
                      }
                    />
                    <Label
                      htmlFor="filter-severe"
                      className="text-xs font-medium text-red-600 cursor-pointer"
                    >
                      Severe
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isLoading && results.length === 0 && externalResults.length === 0 && query.length >= 3 ? (
            <div className="p-4 text-center space-y-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Searching our library...
              </p>
              {query.length >= 3 && (
                <p className="text-xs text-muted-foreground">
                  Also checking external sources...
                </p>
              )}
            </div>
          ) : results.length === 0 && externalResults.length === 0 && !isLoading && query.length >= 2 ? (
            <div className="p-4">
              {searchMeta.isbnNotFound && searchMeta.normalizedISBN ? (
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Book with ISBN <span className="font-mono font-medium text-foreground">{searchMeta.normalizedISBN}</span> not found
                  </p>
                  <Button
                    onClick={() => {
                      router.push(`/scan?isbn=${encodeURIComponent(searchMeta.normalizedISBN!)}`)
                      handleResultClick()
                    }}
                    className="gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    Scan this book
                  </Button>
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground">
                  No books found matching &quot;{query}&quot;
                  {(!severityFilters.mild || !severityFilters.moderate || !severityFilters.severe) && (
                    <div className="mt-2 text-xs">
                      Try adjusting your tolerance filters
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (results.length > 0 || externalResults.length > 0) ? (
            <div className="py-2">
              {/* Database Results */}
              {results.length > 0 && (
                <>
                  {results.map((book) => (
                    <Link
                      key={book.id}
                      href={`/book/${book.isbn}`}
                      onClick={handleResultClick}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-accent transition-colors border-b border-border"
                    >
                      {/* Cover */}
                      <div className="flex-shrink-0 w-12 h-16 bg-muted rounded overflow-hidden relative">
                        {book.cover_url ? (
                          <Image
                            src={book.cover_url.startsWith('http')
                              ? `/api/book-cover?url=${encodeURIComponent(book.cover_url)}`
                              : book.cover_url}
                            alt={`Cover of ${book.title}`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Book Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-foreground truncate">
                          {book.title}
                        </h3>
                        {book.author && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {book.author}
                          </p>
                        )}
                        {book.hasWarnings && (
                          <div className="flex items-center gap-2 mt-2">
                            {book.warningSummary.severe > 0 && (
                              <span className="text-[10px] font-medium text-red-600">
                                {book.warningSummary.severe} severe
                              </span>
                            )}
                            {book.warningSummary.moderate > 0 && (
                              <span className="text-[10px] font-medium text-orange-600">
                                {book.warningSummary.moderate} moderate
                              </span>
                            )}
                            {book.warningSummary.mild > 0 && (
                              <span className="text-[10px] font-medium text-yellow-600">
                                {book.warningSummary.mild} mild
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                  {results.length >= 20 && (
                    <div className="px-4 py-2 border-b border-border text-xs text-muted-foreground text-center">
                      Showing top 20 results
                    </div>
                  )}
                </>
              )}

              {/* External API Results */}
              {isLoading && results.length > 0 && externalResults.length === 0 && query.length >= 3 && (
                <div className="px-4 py-3 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Searching external sources...
                    </p>
                  </div>
                </div>
              )}
              {externalResults.length > 0 && (
                <>
                  {results.length > 0 && (
                    <div className="px-4 py-2 border-b border-border bg-muted/30">
                      <p className="text-xs font-medium text-muted-foreground">
                        Not yet scanned
                      </p>
                    </div>
                  )}
                  {externalResults.map((book) => (
                    <div
                      key={book.isbn}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 bg-muted/20"
                    >
                      {/* Cover */}
                      <div className="flex-shrink-0 w-12 h-16 bg-muted rounded overflow-hidden relative">
                        {book.cover_url ? (
                          <Image
                            src={book.cover_url}
                            alt={`Cover of ${book.title}`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Book Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-foreground truncate">
                          {book.title}
                        </h3>
                        {book.author && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {book.author}
                          </p>
                        )}
                        {book.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {book.description}
                          </p>
                        )}
                        <Button
                          onClick={() => {
                            router.push(`/scan?isbn=${encodeURIComponent(book.isbn)}`)
                            handleResultClick()
                          }}
                          size="sm"
                          className="mt-2 gap-2"
                          variant="outline"
                        >
                          <BookOpen className="h-3 w-3" />
                          Scan this book
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Google Books Attribution */}
              {(results.length > 0 || externalResults.length > 0) && (
                <div className="px-4 py-2 border-t border-border">
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 text-center">
                    Data sourced via Google Books
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

