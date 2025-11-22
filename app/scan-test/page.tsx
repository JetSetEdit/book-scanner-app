"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function ScanTestPage() {
  const [isbn, setIsbn] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusUpdates, setStatusUpdates] = useState<string[]>([])
  const [candidates, setCandidates] = useState<any[] | null>(null)

  const performScan = async (isbnToScan: string, selectedCandidate?: any) => {
    setLoading(true)
    setError(null)
    if (!selectedCandidate) {
        setResult(null)
        setCandidates(null)
        setStatusUpdates([])
    }

    try {
      const body: any = { isbn: isbnToScan, stream: true }
      if (selectedCandidate) {
        body.selectedCandidate = selectedCandidate
      }

      const response = await fetch("/api/scan-isbn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
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
                  setStatusUpdates(prev => [...prev, data.status])
                } else if (data.result) {
                  if (data.result.status === 'ambiguous') {
                    setCandidates(data.result.candidates)
                    setStatusUpdates(prev => [...prev, "Ambiguous results found. Waiting for selection..."])
                  } else {
                    setResult(data.result)
                    setCandidates(null)
                  }
                } else if (data.error) {
                  throw new Error(data.error)
                }
            } catch (parseError) {
                console.error("Error parsing SSE data:", parseError)
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    await performScan(isbn)
  }
  
  const handleSelectCandidate = async (candidate: any) => {
    await performScan(isbn, candidate)
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>ISBN Scanner Test</CardTitle>
          <CardDescription>
            Test the refactored scanning logic and AI generation.
            Enter an ISBN (e.g., 9780375826696) to trigger the backend service.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleScan} className="flex gap-4 mb-6">
            <Input
              placeholder="Enter ISBN..."
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !isbn}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning
                </>
              ) : (
                "Scan Book"
              )}
            </Button>
          </form>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Status Updates */}
          {(loading || statusUpdates.length > 0) && !result && !candidates && !error && (
            <div className="mb-6 space-y-2 border rounded-lg p-4 bg-muted/30">
              <h3 className="font-semibold text-sm">Progress:</h3>
              <div className="space-y-1">
                {statusUpdates.map((update, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-1 duration-300">
                     {i === statusUpdates.length - 1 && loading ? (
                        <Loader2 className="h-3 w-3 animate-spin text-primary" /> 
                     ) : (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                     )}
                    <span className={i === statusUpdates.length - 1 ? "text-foreground font-medium" : ""}>{update}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {candidates && (
            <div className="space-y-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Alert className="border-yellow-500 text-yellow-700 bg-yellow-50 dark:bg-yellow-950/20">
                    <AlertTitle>Multiple Books Found</AlertTitle>
                    <AlertDescription>
                        We found multiple matches for this ISBN. Please select the correct book below.
                    </AlertDescription>
                </Alert>
                
                <div className="grid gap-3">
                    {candidates.map((candidate, idx) => (
                        <div key={idx} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleSelectCandidate(candidate)}>
                            {candidate.cover_url && (
                                <img src={candidate.cover_url} alt={candidate.title} className="w-16 h-24 object-cover rounded shadow-sm" />
                            )}
                            <div className="flex-1">
                                <h4 className="font-bold text-base">{candidate.title}</h4>
                                <p className="text-sm text-muted-foreground">{candidate.author}</p>
                                <p className="text-xs text-muted-foreground mt-1">{candidate.publisher} • {candidate.published_date}</p>
                                <div className="mt-2 flex gap-2">
                                    <span className="text-xs bg-secondary px-2 py-1 rounded-full">Source: {candidate.source}</span>
                                </div>
                            </div>
                            <Button size="sm" variant="secondary">Select</Button>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <Alert className="border-green-500 text-green-700 bg-green-50 dark:bg-green-950/20">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Scan completed successfully.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                 {result.book && (
                    <div className="p-4 border rounded bg-muted/50">
                        <h3 className="font-bold text-lg">{result.book.title || "Unknown Title"}</h3>
                        <p className="text-sm text-muted-foreground">{result.book.author}</p>
                        <div className="mt-4">
                            <Link href={`/book/${result.book.isbn}`}>
                                <Button variant="outline" className="w-full">
                                    View Book Page <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                 )}

                 <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Is New Book?</span>
                        <span className="font-mono">{result.isNewBook ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Warnings Generated?</span>
                        <span className="font-mono">{result.contentWarningsGenerated ? "Yes" : "No"}</span>
                    </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Context Investigated?</span>
                        <span className="font-mono">{result.authorContextInvestigated ? "Yes" : "No"}</span>
                    </div>
                 </div>
                 
                 <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2">Raw API Response:</h4>
                    <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs max-h-[300px]">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                 </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
