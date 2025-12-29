"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Check, Save } from "lucide-react"

function TestCoverContent() {
  const searchParams = useSearchParams()
  const [isbn, setIsbn] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [updatingCover, setUpdatingCover] = useState(false)
  const [coverUpdateSuccess, setCoverUpdateSuccess] = useState<string | null>(null)
  const imageErrorRef = useRef<{ [key: string]: boolean }>({})
  const hasAutoScanned = useRef(false)

  // Auto-scan if ISBN is provided in query params
  useEffect(() => {
    const isbnParam = searchParams.get('isbn')
    if (isbnParam && !hasAutoScanned.current) {
      setIsbn(isbnParam)
      hasAutoScanned.current = true
      // Trigger scan after a brief delay to ensure state is set
      setTimeout(() => {
        const form = document.querySelector('form')
        if (form) {
          form.requestSubmit()
        }
      }, 100)
    }
  }, [searchParams])

  // Helper function to extract Google Books base URL and generate zoom variants
  const getGoogleBooksZoomVariants = (url: string) => {
    if (!url.includes('books.google.com')) return null
    
    try {
      const urlObj = new URL(url)
      const zoomLevels = [1, 2, 3, 4, 5]
      
      return zoomLevels.map(zoom => {
        urlObj.searchParams.set('zoom', zoom.toString())
        return {
          zoom,
          url: urlObj.toString()
        }
      })
    } catch {
      return null
    }
  }

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    imageErrorRef.current = {} // Reset error tracking

    try {
      const response = await fetch("/api/scan-isbn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isbn, stream: true }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to scan ISBN")
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("Response body is not readable")
      }

      let finalResult: any = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.status) {
                console.log("Status:", data.status)
              } else if (data.statusUpdate) {
                console.log("Status Update:", data.statusUpdate)
              } else if (data.result) {
                finalResult = data.result
              } else if (data.error) {
                throw new Error(data.error)
              }
            } catch (parseError) {
              console.error("Error parsing SSE data:", parseError)
            }
          }
        }
      }

      setResult(finalResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const updateCoverUrl = async (coverUrl: string) => {
    if (!isbn || !result?.book) {
      setError('No ISBN or book data available')
      return
    }

    setUpdatingCover(true)
    setCoverUpdateSuccess(null)
    setError(null)

    try {
      const response = await fetch('/api/dev/update-cover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isbn, coverUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update cover URL')
      }

      setCoverUpdateSuccess(data.message)
      // Update the result to reflect the new cover URL
      setResult({
        ...result,
        book: {
          ...result.book,
          cover_url: coverUrl,
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update cover URL')
    } finally {
      setUpdatingCover(false)
    }
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Cover Test Page</CardTitle>
          <CardDescription>
            Test ISBN scanning and see what cover data comes back
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleScan} className="flex gap-4 mb-6">
            <Input
              placeholder="Enter ISBN"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <Button type="submit" disabled={loading || !isbn}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning
                </>
              ) : (
                "Scan"
              )}
            </Button>
          </form>

          {error && (
            <div className="mb-6 p-4 border border-destructive rounded-lg bg-destructive/10">
              <p className="text-destructive font-medium">Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {coverUpdateSuccess && (
            <div className="mb-6 p-4 border border-green-500 rounded-lg bg-green-500/10">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" />
                <p className="font-medium">{coverUpdateSuccess}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-bold text-lg mb-4">Book Data</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Title:</span> {result.book?.title || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Author:</span> {result.book?.author || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">ISBN:</span> {result.book?.isbn || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Cover URL:</span>{" "}
                    {result.book?.cover_url ? (
                      <span className="font-mono text-xs break-all">{result.book.cover_url}</span>
                    ) : (
                      <span className="text-muted-foreground">NULL (missing)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Cover Image Display */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-bold text-lg mb-4">Cover Image</h3>
                <div className="space-y-6">
                  {/* Google Books Zoom Levels */}
                  {result.book?.cover_url && getGoogleBooksZoomVariants(result.book.cover_url) && (
                    <div>
                      <p className="text-sm font-medium mb-4">Google Books - All Zoom Levels (via proxy):</p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {getGoogleBooksZoomVariants(result.book.cover_url)!.map(({ zoom, url }) => {
                          const key = `gb-zoom-${zoom}-${url}`
                          return (
                            <div key={key} className="space-y-2">
                              <div className="relative aspect-[2/3] w-full border rounded-lg overflow-hidden bg-muted">
                                {imageErrorRef.current[key] ? (
                                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
                                    Failed to load
                                  </div>
                                ) : (
                                  <img
                                    src={`/api/book-cover?url=${encodeURIComponent(url)}`}
                                    alt={`Cover zoom ${zoom}`}
                                    className="object-cover w-full h-full"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      if (!imageErrorRef.current[key]) {
                                        imageErrorRef.current[key] = true;
                                        target.style.display = 'none';
                                        setResult({ ...result });
                                      }
                                    }}
                                  />
                                )}
                              </div>
                              <p className="text-xs text-center text-muted-foreground">Zoom {zoom}</p>
                              <p className="text-xs text-center font-mono break-all text-[10px]">{url.substring(0, 60)}...</p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs"
                                onClick={() => updateCoverUrl(url)}
                                disabled={updatingCover}
                              >
                                {updatingCover ? (
                                  <>
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="mr-1 h-3 w-3" />
                                    Save to DB
                                  </>
                                )}
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Direct URL */}
                  {result.book?.cover_url && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Direct URL (may have CORS issues):</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCoverUrl(result.book.cover_url)}
                          disabled={updatingCover}
                        >
                          {updatingCover ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Save className="mr-1 h-3 w-3" />
                              Save to DB
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="relative aspect-[2/3] w-48 border rounded-lg overflow-hidden bg-muted">
                        {imageErrorRef.current[`direct-${result.book.cover_url}`] ? (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            Failed to load (CORS?)
                          </div>
                        ) : (
                          <img
                            src={result.book.cover_url}
                            alt={`Cover of ${result.book.title}`}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const url = result.book.cover_url;
                              if (url && !imageErrorRef.current[`direct-${url}`]) {
                                imageErrorRef.current[`direct-${url}`] = true;
                                target.style.display = 'none';
                                // Force re-render to show error message
                                setResult({ ...result });
                              }
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Proxied URL */}
                  {result.book?.cover_url && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Proxied URL (via /api/book-cover):</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCoverUrl(result.book.cover_url)}
                          disabled={updatingCover}
                        >
                          {updatingCover ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Save className="mr-1 h-3 w-3" />
                              Save to DB
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="relative aspect-[2/3] w-48 border rounded-lg overflow-hidden bg-muted">
                        {imageErrorRef.current[`proxy-${result.book.cover_url}`] ? (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            Failed to load
                          </div>
                        ) : (
                          <img
                            src={`/api/book-cover?url=${encodeURIComponent(result.book.cover_url)}`}
                            alt={`Cover of ${result.book.title}`}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const url = result.book.cover_url;
                              if (url && !imageErrorRef.current[`proxy-${url}`]) {
                                imageErrorRef.current[`proxy-${url}`] = true;
                                target.style.display = 'none';
                                // Force re-render to show error message
                                setResult({ ...result });
                              }
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {!result.book?.cover_url && (
                    <div className="relative aspect-[2/3] w-48 border rounded-lg bg-muted flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">No cover URL</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Raw Result JSON */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-bold text-lg mb-4">Raw Result (JSON)</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs max-h-[400px]">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>

              {/* Scan Metadata */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-bold text-lg mb-4">Scan Metadata</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Is New Book:</span> {result.isNewBook ? "Yes" : "No"}
                  </div>
                  <div>
                    <span className="font-medium">Content Warnings Generated:</span>{" "}
                    {result.contentWarningsGenerated ? "Yes" : "No"}
                  </div>
                  <div>
                    <span className="font-medium">Used Web Search:</span>{" "}
                    {result.flags?.usedWebSearch ? "Yes" : "No"}
                  </div>
                  <div>
                    <span className="font-medium">Is Thin Metadata:</span>{" "}
                    {result.flags?.isThinMetadata ? "Yes" : "No"}
                  </div>
                  <div>
                    <span className="font-medium">Pipeline Path:</span> {result.flags?.pipelinePath || "N/A"}
                  </div>
                  {result.timings && (
                    <div className="mt-4 pt-4 border-t">
                      <span className="font-medium">Timings:</span>
                      <div className="mt-2 font-mono text-xs space-y-1">
                        <div>Total: {result.timings.total?.toFixed(0)}ms</div>
                        {result.timings.dbLookup && (
                          <div className="ml-2">DB Lookup: {result.timings.dbLookup.toFixed(0)}ms</div>
                        )}
                        {result.timings.externalMetadataFetch && (
                          <div className="ml-2">
                            External Fetch: {result.timings.externalMetadataFetch.toFixed(0)}ms
                          </div>
                        )}
                        {result.timings.webSearch && (
                          <div className="ml-2">Web Search: {result.timings.webSearch.toFixed(0)}ms</div>
                        )}
                        {result.timings.aiContentWarningGeneration && (
                          <div className="ml-2">
                            AI Generation: {result.timings.aiContentWarningGeneration.toFixed(0)}ms
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function TestCoverPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <TestCoverContent />
    </Suspense>
  )
}

