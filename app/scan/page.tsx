"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, ArrowRight, History, Trash2, Camera, Flag } from "lucide-react"
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
import { getCurrentStage } from "@/lib/utils/scan-progress-mapper"
import { ScanDebugSidebar } from "@/components/scan-debug-sidebar"

// Helper function to format status messages for display
function formatStatusMessage(message: string): string {
  // Remove emojis
  let cleaned = message.replace(/📖|📝|🔍|🤖|⏳|✅|❌|⚠️|💡|📋|🔄|📥|🌐|💾|📚|📄|🚀/g, '').trim()
  
  // Convert technical messages to user-friendly ones
  const replacements: [RegExp, string][] = [
    [/validating isbn and checking local database/i, 'Checking if we already have this book...'],
    [/checking local database for existing book/i, 'Checking our database...'],
    [/found metadata for "([^"]+)"/i, 'Found book: $1'],
    [/saving to database/i, 'Saving book information...'],
    [/book found in local database/i, 'Book found in our database'],
    [/fetching book metadata from external libraries/i, 'Searching online libraries...'],
    [/external api fetch completed/i, 'Found book information'],
    [/found \d+ candidate\(s\) from external libraries/i, 'Found book matches'],
    [/calling fetchbookbyisbn/i, 'Fetching book details...'],
    [/fetched data from (.+)/i, 'Retrieved from $1'],
    [/saving description \(\d+ chars\) to database/i, 'Saving book description...'],
    [/fetched and saved fresh description/i, 'Updated book description'],
    [/checking if description is sufficient for analysis/i, 'Checking book description...'],
    [/description for analysis: (\d+) characters/i, 'Using description ($1 characters)'],
    [/starting ai content analysis with openai/i, 'Starting AI analysis...'],
    [/analyzing: "([^"]+)"/i, 'Analyzing: $1'],
    [/using description:/i, 'Reviewing book description'],
    [/calling analyzebookwithmultimodel/i, 'Running AI analysis...'],
    [/ai analysis complete: (\d+) warnings generated/i, 'Analysis complete: Found $1 content warnings'],
    [/analysis took (\d+)ms/i, 'Analysis completed'],
    [/saving (\d+) content warnings to database/i, 'Saving $1 content warnings...'],
    [/deleting existing ai-generated warnings/i, 'Clearing previous warnings...'],
    [/deleted existing ai-generated warnings/i, 'Cleared previous warnings'],
    [/saved (\d+) content warnings/i, 'Saved $1 content warnings'],
    [/no content warnings identified by ai analysis/i, 'No content warnings found'],
    [/description too minimal/i, 'Description is too short'],
    [/proceeding with analysis due to force refresh/i, 'Proceeding with analysis...'],
    [/scan process completed/i, 'Scan completed successfully'],
  ]
  
  for (const [pattern, replacement] of replacements) {
    cleaned = cleaned.replace(pattern, replacement)
  }
  
  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }
  
  return cleaned
}

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
  const [detailedStatusUpdates, setDetailedStatusUpdates] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[] | null>(null)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [isProcessingSelection, setIsProcessingSelection] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportSubmitted, setReportSubmitted] = useState(false)
  const [reportTitle, setReportTitle] = useState("")
  const [reportAuthor, setReportAuthor] = useState("")
  const [reportAdditionalInfo, setReportAdditionalInfo] = useState("")
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)

  // Note: We store lastIsbn for history, but don't auto-fill the input
  // Users can manually enter or scan a new ISBN each time

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
        setDetailedStatusUpdates([])
    }
    // Reset selection state
    setSelectedCandidateId(null)
    setIsProcessingSelection(false)
    // Reset report form state
    setShowReportForm(false)
    setReportSubmitted(false)
    setReportTitle("")
    setReportAuthor("")
    setReportAdditionalInfo("")

    try {
      markStage('api-request-sent')
      
      // Use the scan endpoint with multi-model analysis
        setStatusUpdates(prev => [...prev, "Starting scan with multi-model analysis (GPT-4o + Gemini)..."])
        
        const response = await fetch("/api/scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            isbn: isbnToScan, 
            forceRefresh: true,
            selectedCandidate: selectedCandidate || undefined
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { error: errorText || "Failed to scan ISBN" }
          }
          throw new Error(errorData.error || "Failed to scan ISBN")
        }

        // Handle streaming response
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let result: any = null
        let buffer = ''

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              // Check buffer one last time
              if (buffer.trim()) {
                const lines = buffer.split('\n')
                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    try {
                      const data = JSON.parse(line.slice(6))
                      if (data.result) {
                        result = data.result
                      }
                    } catch (e) {
                      // Ignore parse errors
                    }
                  }
                }
              }
              break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || '' // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6))
                  
                  if (data.status) {
                    // Progress update
                    setStatusUpdates(prev => [...prev, data.status])
                    setDetailedStatusUpdates(prev => [...prev, {
                      action: data.status,
                      timestamp: Date.now()
                    }])
                  } else if (data.result) {
                    // Final result
                    result = data.result
                  } else if (data.error) {
                    throw new Error(data.error)
                  }
                } catch (e) {
                  console.warn('Failed to parse stream data:', e, line)
                }
              }
            }
            
            if (result) break
          }
        } else {
          // Fallback for non-streaming response
          const data = await response.json()
          result = data.result || data
        }

        if (!result) {
          throw new Error("No result received from scan - the scan may have completed but no result was returned")
        }

        markStage('result-received')
        
        // Handle ambiguous results (multiple candidates)
        if (result.status === 'ambiguous' && result.candidates && result.candidates.length > 0) {
          setCandidates(result.candidates)
          setResult(null) // Clear result to show candidate selection UI
          setLoading(false)
          return
        }
        
        // Transform result to match expected format
        const transformedResult = {
          success: result.success,
          book: result.book,
          isNewBook: result.isNewBook || false,
          contentWarningsGenerated: result.contentWarningsGenerated || false,
          timings: result.timings,
          flags: result.flags
        }
        
        setResult(transformedResult)
        setCandidates(null)
        
        // If scan failed, set error message
        if (!result.success && result.message) {
          setError(result.message)
        }
        
        markStage('result-processed')
        
        // Save to scan history
        if (result.book) {
          addScan({
            isbn: isbnToScan,
            title: result.book.title || "Unknown",
            author: result.book.author || undefined,
            bookId: result.book.id || `scan-${isbnToScan}`,
          })
        }
        
        setLastIsbn(isbnToScan)
        markStage('ui-updated')
        const timingResult = endTiming()
        if (timingResult) {
          (transformedResult as any).timing = timingResult
        }
        
        setLoading(false)
        return
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

  const handleReportBook = async () => {
    if (!isbn) return
    
    setIsSubmittingReport(true)
    try {
      const response = await fetch("/api/report-book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isbn: isbn,
          title: reportTitle || undefined,
          author: reportAuthor || undefined,
          additionalInfo: reportAdditionalInfo || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit report")
      }

      const data = await response.json()
      setReportSubmitted(true)
      setShowReportForm(false)
      // Reset form after a delay
      setTimeout(() => {
        setReportTitle("")
        setReportAuthor("")
        setReportAdditionalInfo("")
        setReportSubmitted(false)
      }, 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report")
    } finally {
      setIsSubmittingReport(false)
    }
  }

  return (
    <>
      {/* Dev-only Debug Sidebar */}
      <ScanDebugSidebar
        statusUpdates={statusUpdates}
        detailedStatusUpdates={detailedStatusUpdates}
        loading={loading}
        result={result}
        error={error}
        onClear={() => {
          setStatusUpdates([])
          setDetailedStatusUpdates([])
        }}
      />
      
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
          <div className="mb-6 p-4 border rounded-lg bg-muted/30 space-y-4">
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
            <p className="text-xs text-muted-foreground ml-6">
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
                  placeholder="Enter ISBN"
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
              <AlertDescription>
                {error}
                {error.includes("not found") && !showReportForm && !reportSubmitted && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReportForm(true)}
                      className="w-full sm:w-auto"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Report this ISBN
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {reportSubmitted && (
            <Alert className="mb-6 border-green-500 text-green-700 bg-green-50 dark:bg-green-950/20">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Report Submitted</AlertTitle>
              <AlertDescription>
                Thank you! Your report has been submitted. We'll investigate this ISBN.
              </AlertDescription>
            </Alert>
          )}

          {showReportForm && !reportSubmitted && (
            <Card className="mb-6 border-blue-500">
              <CardHeader>
                <CardTitle className="text-lg">Report Missing Book</CardTitle>
                <CardDescription>
                  Help us find this book by providing any information you know about it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="report-title">Book Title (if known)</Label>
                  <Input
                    id="report-title"
                    placeholder="e.g., The Great Gatsby"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="report-author">Author (if known)</Label>
                  <Input
                    id="report-author"
                    placeholder="e.g., F. Scott Fitzgerald"
                    value={reportAuthor}
                    onChange={(e) => setReportAuthor(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="report-info">Additional Information (optional)</Label>
                  <textarea
                    id="report-info"
                    placeholder="Any other details that might help us find this book..."
                    value={reportAdditionalInfo}
                    onChange={(e) => setReportAdditionalInfo(e.target.value)}
                    className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleReportBook}
                    disabled={isSubmittingReport}
                    className="flex-1"
                  >
                    {isSubmittingReport ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Flag className="mr-2 h-4 w-4" />
                        Submit Report
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReportForm(false)
                      setReportTitle("")
                      setReportAuthor("")
                      setReportAdditionalInfo("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Progress Display */}
          {(() => {
            const currentStage = getCurrentStage(statusUpdates)
            const shouldShowLoader = loading && currentStage !== null && !result && !candidates && !error
            
            if (!shouldShowLoader) return null

            const StageIcon = currentStage.icon
            const latestMessage = statusUpdates[statusUpdates.length - 1] || ''
            // Format message for user-friendly display
            const cleanMessage = formatStatusMessage(latestMessage)

            return (
              <div className="mb-6 border rounded-lg p-6 bg-muted/30 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-4">
                  {/* Stage Header */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <StageIcon className="h-5 w-5 text-primary" />
                      {loading && (
                        <Loader2 className="h-3 w-3 animate-spin text-primary absolute -top-1 -right-1" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{currentStage.displayText}</p>
                      <div className="mt-2 w-full bg-secondary rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${(currentStage.stage / 4) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Current Status Message */}
                  {cleanMessage && (
                    <div className="pt-3 border-t border-border/50">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Current step:</span> {cleanMessage}
                      </p>
                    </div>
                  )}
                  
                  {/* Recent Steps (last 3) */}
                  {statusUpdates.length > 1 && (
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Recent steps:</p>
                      <ul className="space-y-1">
                        {statusUpdates.slice(-3).map((update, idx) => {
                          const cleanUpdate = formatStatusMessage(update)
                          const isLatest = idx === statusUpdates.slice(-3).length - 1
                          return (
                            <li 
                              key={idx} 
                              className={cn(
                                "text-xs text-muted-foreground flex items-start gap-2",
                                isLatest && "text-foreground font-medium"
                              )}
                            >
                              <span className="text-muted-foreground mt-0.5">•</span>
                              <span>{cleanUpdate}</span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
          
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

                 {result && result.success && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <Alert className="border-green-500 text-green-700 bg-green-50 dark:bg-green-950/20">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Scan completed successfully.
                  {result.multiModelAnalysis && (
                    <span className="block mt-1 text-xs">
                      Multi-model analysis completed (GPT-4o + Gemini)
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              {/* Multi-Model Analysis Display */}
              {result.multiModelAnalysis && (
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20 space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <span className="text-blue-600 dark:text-blue-400">🤖</span>
                    Multi-Model Analysis
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Agreement Score</div>
                      <div className="font-bold text-lg">
                        {Math.round(result.multiModelAnalysis.analysis.agreement_score * 100)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Combined Warnings</div>
                      <div className="font-bold text-lg">
                        {result.multiModelAnalysis.combined_warnings.length}
                      </div>
                    </div>
                  </div>

                  {result.multiModelAnalysis.analysis.unique_to_gpt4o.length > 0 && (
                    <div className="text-xs">
                      <span className="font-medium">GPT-4o uniquely found:</span>{' '}
                      <span className="text-muted-foreground">
                        {result.multiModelAnalysis.analysis.unique_to_gpt4o.join(', ')}
                      </span>
                    </div>
                  )}

                  {result.multiModelAnalysis.analysis.unique_to_gemini.length > 0 && (
                    <div className="text-xs">
                      <span className="font-medium">Gemini uniquely found:</span>{' '}
                      <span className="text-muted-foreground">
                        {result.multiModelAnalysis.analysis.unique_to_gemini.join(', ')}
                      </span>
                    </div>
                  )}

                  {result.multiModelAnalysis.analysis.severity_differences.length > 0 && (
                    <div className="text-xs">
                      <div className="font-medium mb-1">Severity Differences:</div>
                      {result.multiModelAnalysis.analysis.severity_differences.map((diff: any, i: number) => (
                        <div key={i} className="text-muted-foreground ml-2">
                          {diff.category}: GPT-4o={diff.gpt4o_score.toFixed(2)}, Gemini={diff.gemini_score.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    {result.multiModelAnalysis.analysis.reasoning_insights}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                    {result.multiModelAnalysis.model_results.map((model: any) => (
                      <div key={model.model} className="p-2 bg-white dark:bg-slate-800 rounded">
                        <div className="font-medium">{model.model}</div>
                        <div className="text-muted-foreground">
                          {model.content_warnings.length} warnings • {model.timing}ms
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                        <span className="font-mono">
                          {result.multiModelAnalysis 
                            ? `${result.multiModelAnalysis.combined_warnings.length} (combined)`
                            : result.contentWarningsGenerated ? "Yes" : "No"}
                        </span>
                    </div>
                    {result.multiModelAnalysis && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Classification Rating</span>
                        <span className="font-mono">{result.multiModelAnalysis.classification_rating || "N/A"}</span>
                      </div>
                    )}
                 </div>
                 
                 {/* Display Combined Warnings for Multi-Model */}
                 {result.multiModelAnalysis && result.multiModelAnalysis.combined_warnings.length > 0 && (
                   <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                     <h4 className="font-semibold text-sm mb-3">Combined Content Warnings</h4>
                     <div className="space-y-2">
                       {result.multiModelAnalysis.combined_warnings.map((warning: any, i: number) => (
                         <div key={i} className="p-3 bg-white dark:bg-slate-800 rounded border text-sm">
                           <div className="flex items-start justify-between gap-2">
                             <div className="flex-1">
                               <div className="font-medium">{warning.description}</div>
                               <div className="text-xs text-muted-foreground mt-1">
                                 Category: {warning.category_id} • Severity: {warning.severity} • Score: {warning.score?.toFixed(2) || 'N/A'}
                               </div>
                               {warning.source === 'combined' && warning.original_scores && (
                                 <div className="text-xs text-muted-foreground mt-1">
                                   Combined from: {warning.original_scores.map((s: any) => `${s.model}=${s.score.toFixed(2)}`).join(', ')}
                                   {warning.model_agreement && ` (${warning.model_agreement} agreement)`}
                                 </div>
                               )}
                               {warning.source !== 'combined' && (
                                 <div className="text-xs text-muted-foreground mt-1">
                                   Source: {warning.source === 'gpt-4o' ? 'GPT-4o only' : 'Gemini only'}
                                 </div>
                               )}
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
                 
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
    </>
  )
}
