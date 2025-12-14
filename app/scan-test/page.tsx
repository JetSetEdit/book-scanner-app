"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, ArrowRight, History, Trash2, Camera } from "lucide-react"
import Link from "next/link"
import { useLocalStorage } from "@/hooks/use-browser-storage"
import { useScanHistory } from "@/hooks/use-scan-history"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import { startTiming, markStage, endTiming, formatTiming } from "@/lib/utils/timing"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { AccessibleAudioPlayer } from "@/components/accessible-audio-player"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function ScanTestPage() {
  // Browser storage for last ISBN
  const [lastIsbn, setLastIsbn] = useLocalStorage<string>("last-scanned-isbn", "")
  const [isbn, setIsbn] = useState("")
  
  // Scan history
  const { history, addScan, clearHistory } = useScanHistory()
  
  // User preferences
  const { preferences, updatePreference } = useUserPreferences()
  
  // Show scanner based on user preference
  const [showScanner, setShowScanner] = useState(preferences.showCameraScanner ?? false)
  
  // Update showScanner when preference changes
  useEffect(() => {
    setShowScanner(preferences.showCameraScanner ?? false)
  }, [preferences.showCameraScanner])
  
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusUpdates, setStatusUpdates] = useState<string[]>([])
  const [candidates, setCandidates] = useState<any[] | null>(null)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [isProcessingSelection, setIsProcessingSelection] = useState(false)

  // Load last ISBN on mount
  useEffect(() => {
    if (lastIsbn) {
      setIsbn(lastIsbn)
    }
  }, [lastIsbn])

  const performScan = async (isbnToScan: string, selectedCandidate?: any) => {
    // Start timing
    const timer = startTiming()
    markStage('scan-initiated')
    
    setLoading(true)
    setError(null)
    if (!selectedCandidate) {
        setResult(null)
        setCandidates(null)
        setStatusUpdates([])
    }
    // Reset selection state
    setSelectedCandidateId(null)
    setIsProcessingSelection(false)

    try {
      markStage('api-request-sent')
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

      const responseReceivedTime = performance.now()
      markStage('api-response-received')

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

      markStage('stream-started')

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          markStage('stream-completed')
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
                const data = JSON.parse(line.slice(6))
                
                if (data.status) {
                  setStatusUpdates(prev => [...prev, data.status])
                } else if (data.result) {
                  markStage('result-received')
                  
                  if (data.result.status === 'ambiguous') {
                    setCandidates(data.result.candidates)
                    setStatusUpdates(prev => [...prev, "Ambiguous results found. Waiting for selection..."])
                  } else {
                    setResult(data.result)
                    setCandidates(null)
                    
                    markStage('result-processed')
                    
                    // Save to scan history
                    if (data.result.book) {
                      addScan({
                        isbn: data.result.book.isbn,
                        title: data.result.book.title || "Unknown",
                        author: data.result.book.author || undefined,
                        bookId: data.result.book.id,
                      })
                    }
                    
                    // Save last ISBN
                    setLastIsbn(isbnToScan)
                    
                    // End timing and log
                    markStage('ui-updated')
                    const timingResult = endTiming()
                    if (timingResult) {
                      // Log to console
                      console.log('📊 Scan Timing Results:')
                      console.log(`  Total Duration: ${timingResult.duration.toFixed(0)}ms`)
                      Object.entries(timingResult.stages).forEach(([stage, duration]) => {
                        console.log(`  ${stage}: ${duration.toFixed(0)}ms`)
                      })
                      // Store timing in result for display
                      (data.result as any).timing = timingResult
                    }
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
      // Reset selection state on error
      setSelectedCandidateId(null)
      setIsProcessingSelection(false)
    } finally {
      setLoading(false)
    }
  }

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    await performScan(isbn)
  }
  
  const handleSelectCandidate = async (candidate: any) => {
    // Prevent double-click
    if (isProcessingSelection || selectedCandidateId) return
    
    // Mark as selected and processing
    setSelectedCandidateId(candidate.isbn || candidate.title)
    setIsProcessingSelection(true)
    
    // Clear candidates after a brief delay to show selection animation
    setTimeout(() => {
      setCandidates(null)
    }, 300)
    await performScan(isbn, candidate)
  }

  const handleBarcodeScan = (scannedISBN: string) => {
    setIsbn(scannedISBN)
    // Automatically trigger scan
    performScan(scannedISBN)
    // Optionally hide scanner after successful scan
    setShowScanner(false)
  }

  const handleScannerError = (errorMsg: string) => {
    setError(errorMsg)
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Scan Book</CardTitle>
          <CardDescription>
            Scan a book barcode with your camera or enter an ISBN manually.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Scanner Preference Toggle */}
          <div className="mb-6 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-camera-scanner"
                checked={showScanner}
                onCheckedChange={(checked) => {
                  const newValue = checked === true
                  setShowScanner(newValue)
                  updatePreference('showCameraScanner', newValue)
                }}
              />
              <Label
                htmlFor="show-camera-scanner"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Show camera scanner by default
              </Label>
            </div>
            <p className="text-xs text-muted-foreground mt-2 ml-6">
              When enabled, the camera scanner will be shown when you visit this page. You can always toggle it on/off.
            </p>
          </div>

          {/* Scan History */}
          {history.length > 0 && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  <span className="text-sm font-medium">Recent Scans</span>
                  <span className="text-xs text-muted-foreground">({history.length})</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="h-7 text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.slice(0, 5).map((item) => (
                  <Button
                    key={item.isbn}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsbn(item.isbn)
                      performScan(item.isbn)
                    }}
                    className="text-xs h-7"
                  >
                    {item.title.length > 20 ? `${item.title.substring(0, 20)}...` : item.title}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Unified Interface: Scanner + Manual Entry */}
          <div className="space-y-6 mb-6">
            {/* Barcode Scanner */}
            {showScanner && (
              <div>
                <BarcodeScanner
                  onScanSuccess={handleBarcodeScan}
                  onError={handleScannerError}
                  onClose={() => setShowScanner(false)}
                />
              </div>
            )}

            {/* Divider */}
            {showScanner && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">Or</span>
                </div>
              </div>
            )}

            {/* Manual Entry */}
            <div>
              {!showScanner && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowScanner(true)}
                  className="mb-4"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Use Camera Scanner
                </Button>
              )}
              <form onSubmit={handleScan} className="flex gap-4">
                <Input
                  placeholder="Enter ISBN (e.g., 9780375826696)"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  className="flex-1"
                  autoFocus={!showScanner}
                />
                <Button type="submit" disabled={loading || !isbn}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scanning
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Scan Book
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

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
                    {candidates.map((candidate, idx) => {
                        const candidateId = candidate.isbn || candidate.title
                        const isSelected = selectedCandidateId === candidateId
                        const shouldAnimateOut = selectedCandidateId && !isSelected
                        
                        return (
                            <div 
                                key={idx} 
                                className={cn(
                                    "flex items-start gap-4 p-4 border rounded-lg transition-all duration-300",
                                    isSelected 
                                        ? "bg-primary/10 border-primary shadow-md scale-[1.02] cursor-default" 
                                        : shouldAnimateOut
                                        ? "opacity-0 scale-95 -translate-x-4 pointer-events-none"
                                        : "hover:bg-muted/50 cursor-pointer hover:shadow-sm",
                                    isProcessingSelection && !isSelected && "pointer-events-none"
                                )}
                                onClick={() => !isProcessingSelection && handleSelectCandidate(candidate)}
                            >
                                {candidate.cover_url && (
                                    <img 
                                        src={candidate.cover_url} 
                                        alt={candidate.title} 
                                        className={cn(
                                            "w-16 h-24 object-cover rounded shadow-sm transition-all duration-300",
                                            isSelected && "ring-2 ring-primary"
                                        )} 
                                    />
                                )}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-base">{candidate.title}</h4>
                                            <p className="text-sm text-muted-foreground">{candidate.author}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{candidate.publisher} • {candidate.published_date}</p>
                                            <div className="mt-2 flex gap-2">
                                                <span className="text-xs bg-secondary px-2 py-1 rounded-full">Source: {candidate.source}</span>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="flex items-center gap-2 text-primary">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span className="text-xs font-medium">Processing...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant={isSelected ? "default" : "secondary"}
                                    disabled={isProcessingSelection}
                                    className={cn(
                                        "transition-all duration-300",
                                        isSelected && "bg-primary text-primary-foreground"
                                    )}
                                >
                                    {isSelected ? "Selected" : "Select"}
                                </Button>
                            </div>
                        )
                    })}
                </div>
                {/* Google Books Attribution for candidate covers */}
                {candidates.some(c => c.source === 'googlebooks') && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Covers via{' '}
                    <a
                      href="https://books.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Google Books
                    </a>
                  </p>
                )}
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
                        
                        {/* Timing Display */}
                        {result.timing && (
                          <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">
                            <div className="font-bold mb-1">⏱️ Scan Timing:</div>
                            <div>Total: <strong>{result.timing.duration.toFixed(0)}ms</strong></div>
                            {Object.entries(result.timing.stages).map(([stage, duration]) => (
                              <div key={stage} className="ml-2 text-muted-foreground">
                                {stage}: {duration.toFixed(0)}ms
                              </div>
                            ))}
                          </div>
                        )}
                        

                        {/* Audio Player - If Available */}
                        {result.book.audio_url && result.book.content_briefing && (
                          <div className="mt-4">
                            <AccessibleAudioPlayer
                              audioUrl={result.book.audio_url}
                              duration={result.book.audio_duration || undefined}
                              transcript={result.book.audio_transcript || result.book.content_briefing}
                              briefing={result.book.content_briefing}
                            />
                          </div>
                        )}

                        <div className="mt-4">
                            <Link href={`/book/${result.book.isbn}`}>
                                <Button 
                                  variant="outline" 
                                  className="w-full"
                                  onClick={() => {
                                    // Track timing to book page navigation
                                    if (result.timing) {
                                      const navStart = performance.now()
                                      const timeToNav = navStart - (result.timing.startTime + result.timing.duration)
                                      console.log(`📊 Time to navigate: ${timeToNav.toFixed(0)}ms`)
                                      console.log(`📊 Total time (scan + nav): ${(result.timing.duration + timeToNav).toFixed(0)}ms`)
                                    }
                                  }}
                                >
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
                 
                 {preferences.showRawApiResponse && (
                   <div className="mt-4">
                     <h4 className="text-sm font-semibold mb-2">Raw API Response:</h4>
                     <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs max-h-[300px]">
                         {JSON.stringify(result, null, 2)}
                     </pre>
                   </div>
                 )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
