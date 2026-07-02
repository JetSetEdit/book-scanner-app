"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, ArrowRight, ArrowLeft, History, Trash2, Camera, Flag, Clock, ChevronDown, SlidersHorizontal } from "lucide-react"
import Link from "next/link"
import { useLocalStorage } from "@/hooks/use-browser-storage"
import { useScanHistory } from "@/hooks/use-scan-history"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import { useIsMobile } from "@/hooks/use-mobile"
import { startTiming, markStage, endTiming, formatTiming } from "@/lib/utils/timing"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { AccessibleAudioPlayer } from "@/components/accessible-audio-player"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { getCurrentStage } from "@/lib/utils/scan-progress-mapper"
import { ScanDebugSidebar } from "@/components/scan-debug-sidebar"
import { RateLimitFeedbackDialog } from "@/components/rate-limit-feedback-dialog"
import { BonusScanBadge } from "@/components/bonus-scan-badge"
import { BonusClaimNotification } from "@/components/bonus-claim-notification"
import { PaywallModal } from "@/components/paywall-modal"
import { canRunScan } from "@/lib/entitlements"
import { getDailyScanUsage, incrementDailyScanUsage } from "@/lib/utils/scan-usage"
import { ScanningAnimation } from "@/components/scanning-animation"
import {
  SCAN_FIRST_MESSAGE,
  getScanLastMessage,
  getMiddleFlavourMessages,
  FLAVOUR_MESSAGE_INTERVAL_MS,
} from "@/lib/scan-loading-messages"

// Helper function to format status messages for display
function formatStatusMessage(message: string): string {
  // Remove emojis
  let cleaned = message.replace(/📖|📝|🔍|🤖|⏳|✅|❌|⚠️|💡|📋|🔄|📥|🌐|💾|📚|📄|🚀/g, '').trim()

  // Extract categories if present in "Checking for: ..."
  if (message.match(/Checking for:/i)) {
    return 'analyzing_categories'
  }

  // Convert technical messages to user-friendly ones
  const replacements: [RegExp, string][] = [
    [/validating isbn and checking local database/i, 'Searching our library...'],
    [/checking local database for existing book/i, 'Looking for this book...'],
    [/found metadata for "([^"]+)"/i, 'Found book: $1'],
    [/saving to database/i, 'Saving book information...'],
    [/book found in local database/i, 'Found it! Loading book details...'],
    [/fetching book metadata from external libraries/i, 'Finding book information...'],
    [/external api fetch completed/i, 'Found book information'],
    [/found \d+ candidate\(s\) from external libraries/i, 'Book found!'],
    [/calling fetchbookbyisbn/i, 'Getting book details...'],
    [/fetched data from (.+)/i, 'Found on $1'],
    [/saving description \(\d+ chars\) to database/i, 'Preparing description...'],
    [/fetched and saved fresh description/i, 'Description ready'],
    [/checking if description is sufficient for analysis/i, 'Reviewing book summary...'],
    [/description for analysis: (\d+) characters/i, 'Analyzing $1 characters...'],
    [/starting ai content analysis with openai/i, 'Starting analysis...'],
    [/analyzing: "([^"]+)"/i, 'Checking for: $1'],
    [/using description:/i, 'Reviewing book description'],
    [/calling analyzebookwithmultimodel/i, 'Analyzing the book...'],
    [/ai analysis complete: (\d+) warnings generated/i, 'Found $1 content warnings'],
    [/analysis took (\d+)ms/i, 'Analysis complete!'],
    [/saving (\d+) content warnings to database/i, 'Saving results...'],
    [/deleting existing ai-generated warnings/i, 'Updating warnings...'],
    // Avoid showing this redundant internal step (backend still sends "ai-generated" internally)
    [/deleted existing ai-generated warnings/i, ''],
    [/saved (\d+) content warnings/i, 'Saved $1 warnings'],
    [/no content warnings identified by ai analysis/i, 'No warnings detected'],
    [/description too minimal/i, 'Limited information available, enriching...'],
    [/proceeding with analysis due to force refresh/i, 'Proceeding with analysis...'],
    [/scan process completed/i, 'Scan completed successfully'],
    [/finding your book/i, 'Finding your book...'],
    [/scan complete/i, 'Scan complete'],
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

function ScanTestPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isMobile = useIsMobile()

  // Browser storage for last ISBN
  const [lastIsbn, setLastIsbn] = useLocalStorage<string>("last-scanned-isbn", "")
  const [isbn, setIsbn] = useState("")

  // Scan history
  const { history, addScan, clearHistory } = useScanHistory()

  // User preferences
  const { preferences, updatePreference } = useUserPreferences()

  const AUTO_CAMERA_OPT_OUT_KEY = "scan_auto_camera_opt_out_v1"
  const DEFAULT_SCAN_CREDITS_PER_DAY = 5

  // Camera scanner state (mobile-first: auto-open when supported)
  const [showScanner, setShowScanner] = useState(false)
  const [cameraTrouble, setCameraTrouble] = useState(false)
  const [showTroubleshoot, setShowTroubleshoot] = useState(false)
  const [didInitCamera, setDidInitCamera] = useState(false)

  // Client-side only flag to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false)
  const [hasAutoScanned, setHasAutoScanned] = useState(false)

  // Scan mode (Quick vs Deep). Default to Quick for browsing.
  const [scanMode, setScanMode] = useState<'quick' | 'deep'>('quick')
  const [forceRefresh, setForceRefresh] = useState(false)
  const DEEP_SCAN_COST = 2

  // Initialize camera visibility:
  // - If user explicitly enabled "show camera by default", always open
  // - Otherwise, auto-open on mobile when supported unless user opted out after closing
  useEffect(() => {
    if (!isMounted || didInitCamera) return

    const canUseCamera =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function"

    const optedOut = (() => {
      try {
        return window.localStorage.getItem(AUTO_CAMERA_OPT_OUT_KEY) === "true"
      } catch {
        return false
      }
    })()

    if (preferences.showCameraScanner) {
      setShowScanner(true)
    } else if (isMobile && canUseCamera && !optedOut) {
      setShowScanner(true)
    }

    setDidInitCamera(true)
     
  }, [isMounted, didInitCamera, isMobile, preferences.showCameraScanner])

  // If the user turns on the preference, open the scanner immediately.
  useEffect(() => {
    if (preferences.showCameraScanner) {
      setShowScanner(true)
      setCameraTrouble(false)
    }
  }, [preferences.showCameraScanner])

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [bonusClaimInfo, setBonusClaimInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusUpdates, setStatusUpdates] = useState<string[]>([])
  const [detailedStatusUpdates, setDetailedStatusUpdates] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[] | null>(null)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [isProcessingSelection, setIsProcessingSelection] = useState(false)
  const [redirectingTo, setRedirectingTo] = useState<{ isbn: string; title: string } | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportSubmitted, setReportSubmitted] = useState(false)
  const [reportTitle, setReportTitle] = useState("")
  const [reportAuthor, setReportAuthor] = useState("")
  const [reportAdditionalInfo, setReportAdditionalInfo] = useState("")
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const isDevUi = typeof window !== 'undefined' && window.location.hostname === 'localhost'

  // Flavour text progress: first + middle (timer) + last (on result)
  const flavourIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const flavourMiddleRef = useRef<string[]>([])
  const flavourNextIndexRef = useRef(0)

  const clearFlavourInterval = useCallback(() => {
    if (flavourIntervalRef.current) {
      clearInterval(flavourIntervalRef.current)
      flavourIntervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => { clearFlavourInterval() }
  }, [clearFlavourInterval])

  // Rate limit tracking
  const [rateLimit, setRateLimit] = useState<{
    limit: number
    remaining: number
    resetAt: number
    unlimited?: boolean
  } | null>(null)

  // Freemium paywall (daily scan limit)
  const [showPaywall, setShowPaywall] = useState(false)
  // VIP/invite users have unlimited scans; we can't read httpOnly cookie on client so we ask the API
  const [isUnlimited, setIsUnlimited] = useState<boolean | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    fetch('/api/entitlements')
      .then((r) => r.json())
      .then((data) => setIsUnlimited(data?.ok && data?.unlimited === true))
      .catch(() => setIsUnlimited(false))
  }, [])

  // NOTE: We intentionally do NOT clear `error` when opening the scanner.
  // Users may need to see camera permission / failure messages even after closing the scanner.

  // Check for ISBN in URL params and auto-start scan
  useEffect(() => {
    if (!isMounted || hasAutoScanned) return

    const isbnParam = searchParams.get('isbn')
    const scanModeParam = searchParams.get('scanMode')
    const forceRefreshParam = searchParams.get('forceRefresh')
    const forceRefreshFromUrl = forceRefreshParam === '1' || forceRefreshParam === 'true'
    if (scanModeParam === 'quick' || scanModeParam === 'deep') {
      setScanMode(scanModeParam)
    }
    if (forceRefreshFromUrl) {
      setForceRefresh(true)
    }
    // Only check if ISBN exists - don't check loading/result state as they may not be initialized yet
    if (isbnParam && isbnParam.trim()) {
      const normalizedIsbn = isbnParam.trim()
      setIsbn(normalizedIsbn)
      setHasAutoScanned(true)
      let searchCandidate: unknown = undefined
      try {
        const raw = sessionStorage.getItem('scanSearchCandidate')
        if (raw) {
          const parsed = JSON.parse(raw) as { isbn?: string; title?: string; author?: string; cover_url?: string; description?: string; source?: string }
          const storedIsbn = parsed?.isbn?.replace?.(/[\s-]/g, '')
          const matchIsbn = normalizedIsbn.replace(/[\s-]/g, '')
          if (storedIsbn && matchIsbn && storedIsbn === matchIsbn && parsed.title) {
            searchCandidate = {
              isbn: normalizedIsbn,
              title: parsed.title,
              author: parsed.author,
              cover_url: parsed.cover_url,
              description: parsed.description,
              source: (parsed.source === 'openlibrary' ? 'openlibrary' : 'googlebooks') as 'openlibrary' | 'googlebooks',
            }
            sessionStorage.removeItem('scanSearchCandidate')
          }
        }
      } catch (_) {}
      console.log('[Auto-scan] Triggering scan for ISBN:', normalizedIsbn, 'mode:', scanModeParam, 'searchCandidate:', !!searchCandidate)
      const timeoutId = setTimeout(() => {
        console.log('[Auto-scan] Executing performScan after timeout')
        performScan(
          normalizedIsbn,
          searchCandidate as any,
          scanModeParam === 'quick' || scanModeParam === 'deep' ? scanModeParam : undefined,
          forceRefreshFromUrl ? true : undefined
        )
      }, 500) // Increased timeout to ensure state is properly set
      return () => clearTimeout(timeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, searchParams, hasAutoScanned]) // Run when component mounts with ISBN param

  // Note: We store lastIsbn for history, but don't auto-fill the input
  // Users can manually enter or scan a new ISBN each time

  const performScan = async (
    isbnToScan: string,
    selectedCandidate?: any,
    scanModeOverride?: 'quick' | 'deep',
    forceRefreshOverride?: boolean
  ) => {
    console.log('[Scan] performScan called:', { isbnToScan, scanModeOverride, forceRefreshOverride })
    const effectiveMode = scanModeOverride ?? scanMode
    // VIP/invite users have unlimited scans; skip client-side limit check. When unknown (null), allow request—API will enforce.
    if (isUnlimited === false) {
      const { usedQuick, usedDeep } = getDailyScanUsage()
      if (!canRunScan({ plan: "free", scanType: effectiveMode, usedQuick, usedDeep })) {
        setShowPaywall(true)
        return
      }
    }
    // Start timing
    const timer = startTiming()
    markStage('scan-initiated')

    setLoading(true)
    setError(null)
    setRedirectingTo(null)

    // Flavour progress: first message + middle on timer, last on result
    const initialStatus = SCAN_FIRST_MESSAGE
    flavourMiddleRef.current = getMiddleFlavourMessages(effectiveMode)
    flavourNextIndexRef.current = 0
    clearFlavourInterval()

    if (!selectedCandidate) {
      setResult(null)
      setCandidates(null)
      setStatusUpdates([initialStatus])
      setDetailedStatusUpdates([{ action: initialStatus, timestamp: Date.now() }])
    } else {
      setStatusUpdates(prev => [...prev, initialStatus])
      setDetailedStatusUpdates(prev => [...prev, { action: initialStatus, timestamp: Date.now() }])
    }

    flavourIntervalRef.current = setInterval(() => {
      const middle = flavourMiddleRef.current
      const idx = flavourNextIndexRef.current
      if (idx >= middle.length) {
        clearFlavourInterval()
        return
      }
      const next = middle[idx]
      flavourNextIndexRef.current = idx + 1
      setStatusUpdates(prev => [...prev, next])
      setDetailedStatusUpdates(prev => [...prev, { action: next, timestamp: Date.now() }])
      if (idx + 1 >= middle.length) clearFlavourInterval()
    }, FLAVOUR_MESSAGE_INTERVAL_MS)

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

      // Get user's timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isbn: isbnToScan,
          forceRefresh: forceRefreshOverride ?? forceRefresh,
          selectedCandidate: selectedCandidate || undefined,
          timezone: userTimezone,
          scanMode: scanModeOverride ?? scanMode
        }),
      })

      // Handle rate limit (429) - can come as streaming response
      if (response.status === 429) {
        // Try to read error from stream
        try {
          const reader = response.body?.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          if (reader) {
            const { done, value } = await reader.read()
            if (!done && value) {
              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6))
                    if (data.error) {
                      const rateLimitInfo = data.error.rateLimit || {
                        limit: 5,
                        remaining: 0,
                        resetAt: Date.now() + 24 * 60 * 60 * 1000
                      }
                      setRateLimit(rateLimitInfo)
                      throw new Error(data.error.message || data.error.error || 'Rate limit exceeded')
                    }
                  } catch (e) {
                    // Ignore parse errors
                  }
                }
              }
            }
          }
        } catch (e) {
          // Fall through to default error handling
        }

        // Fallback error if stream parsing failed
        const errorText = await response.text().catch(() => 'Rate limit exceeded')
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = {
            error: 'Rate limit exceeded',
            message: `You've reached your daily scan credit limit. Please try again tomorrow.`
          }
        }
        setRateLimit({
          limit: DEFAULT_SCAN_CREDITS_PER_DAY,
          remaining: 0,
          resetAt: Date.now() + 24 * 60 * 60 * 1000
        })
        throw new Error(errorData.message || errorData.error || 'Rate limit exceeded')
      }

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
                  // Progress still driven by flavour timer; keep detailed for debug only
                  setDetailedStatusUpdates(prev => [...prev, {
                    action: data.status,
                    timestamp: Date.now()
                  }])
                } else if (data.result) {
                  // Final result
                  result = data.result
                  console.log('[Scan] Received result:', {
                    success: result?.success,
                    hasBook: !!result?.book,
                    bookId: result?.book?.id
                  })
                } else if (data.error) {
                  console.error('[Scan] Error in stream:', data.error)
                  const errorMsg = typeof data.error === 'string'
                    ? data.error
                    : data.error.error || data.error.message || 'Unknown error'
                  throw new Error(errorMsg)
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
        console.error('[Scan] No result received. Buffer:', buffer.substring(0, 500))
        console.error('[Scan] Status updates:', statusUpdates)
        throw new Error("No result received from scan - the scan may have completed but no result was returned")
      }

      clearFlavourInterval()
      const warningCount = result?.multiModelAnalysis?.combined_warnings?.length
      setStatusUpdates(prev => [...prev, getScanLastMessage(warningCount)])

      console.log('[Scan] Result received:', {
        success: result.success,
        hasBook: !!result.book,
        bookId: result.book?.id,
        isNewBook: result.isNewBook,
        contentWarningsGenerated: result.contentWarningsGenerated
      })

      markStage('result-received')

      // Handle ambiguous results (multiple candidates)
      if (result.status === 'ambiguous' && result.candidates && result.candidates.length > 0) {
        clearFlavourInterval()
        setCandidates(result.candidates)
        setResult(null) // Clear result to show candidate selection UI
        setLoading(false)
        return
      }

      // Update rate limit from result if available
      if (result.rateLimit) {
        setRateLimit(result.rateLimit)
      }

      // Handle bonus claim notification if bonus was claimed
      if (result.bonusClaimInfo) {
        setBonusClaimInfo(result.bonusClaimInfo)
        // Clear after notification is shown (component will handle toast)
        setTimeout(() => setBonusClaimInfo(null), 6000)
      }

      // Transform result to match expected format
      const transformedResult = {
        success: result.success !== false, // Default to true if not explicitly false
        book: result.book,
        isNewBook: result.isNewBook || false,
        contentWarningsGenerated: result.contentWarningsGenerated || false,
        timings: result.timings,
        flags: result.flags,
        analysisLevel: result.analysisLevel,
        metadataQuality: result.metadataQuality,
        enrichmentUsed: result.enrichmentUsed
      }

      console.log('[Scan] Transformed result:', {
        success: transformedResult.success,
        hasBook: !!transformedResult.book,
        bookId: transformedResult.book?.id
      })

      setResult(transformedResult)
      setCandidates(null)

      // If scan failed, set error message
      if (!result.success && result.message) {
        setError(result.message)
      }

      markStage('result-processed')

      // Increment daily usage for freemium limit
      incrementDailyScanUsage(effectiveMode)

      // Save to scan history
      if (result?.book) {
        try {
          addScan({
            isbn: isbnToScan,
            title: result.book.title || "Unknown",
            author: result.book.author || undefined,
            bookId: result.book.id || `scan-${isbnToScan}`,
          })
        } catch (historyError) {
          console.warn('[Scan] Failed to save to history:', historyError)
          // Don't throw - history save failure shouldn't break the scan
        }
      }

      setLastIsbn(isbnToScan)

      try {
        markStage('ui-updated')
        const timingResult = endTiming()
        if (timingResult) {
          (transformedResult as any).timing = timingResult
        }
      } catch (timingError) {
        console.warn('[Scan] Timing error (non-critical):', timingError)
        // Don't throw - timing is not critical
      }

      // Auto-redirect to book page if book already exists — show brief transition
      if (transformedResult.success && transformedResult.book && !transformedResult.isNewBook) {
        setLoading(false)
        setRedirectingTo({ isbn: isbnToScan, title: transformedResult.book.title || 'this book' })
        setTimeout(() => {
          router.push(`/book/${isbnToScan}`)
        }, 1200)
        return
      }
      // Note: incrementDailyScanUsage already called above for non-redirect success path

      setLoading(false)
      return
    } catch (err) {
      clearFlavourInterval()
      console.error('[Scan] Error caught in performScan:', err)
      console.error('[Scan] Error details:', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : typeof err
      })
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      // Reset selection state on error
      setSelectedCandidateId(null)
      setIsProcessingSelection(false)
    } finally {
      clearFlavourInterval()
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
    setCameraTrouble(true)
    setShowTroubleshoot(true)
  }

  const closeScanner = () => {
    setShowScanner(false)

    // If the user didn't explicitly opt-in via preference, treat closing as an opt-out for auto-open.
    if (!preferences.showCameraScanner) {
      try {
        window.localStorage.setItem(AUTO_CAMERA_OPT_OUT_KEY, "true")
      } catch {
        // ignore
      }
    }
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

      <div className="mx-auto max-w-2xl px-4 pt-4 pb-8 sm:pt-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold">Scan Book</h1>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 -mr-1 text-muted-foreground hover:text-foreground"
            onClick={() => setShowSettings(s => !s)}
            aria-label="Scan settings"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </Button>
        </div>

        {/* ── Settings panel (hidden by default) ── */}
        {showSettings && (
          <div className="mb-6 p-4 border rounded-xl bg-muted/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="quick-scan"
                  checked={scanMode === 'quick'}
                  onCheckedChange={(checked) => setScanMode(checked === true ? 'quick' : 'deep')}
                />
                <Label htmlFor="quick-scan" className="text-sm font-medium cursor-pointer">
                  Quick scan (15–30s, recommended)
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Quick mode returns the most important warnings first. Deep scan (90–120s) uses {DEEP_SCAN_COST} credits.
              </p>
            </div>

            {isDevUi && (
              <div className="flex items-center space-x-2">
                <Checkbox id="force-refresh" checked={forceRefresh} onCheckedChange={(checked) => setForceRefresh(checked === true)} />
                <Label htmlFor="force-refresh" className="text-sm font-medium cursor-pointer">Force refresh</Label>
              </div>
            )}

            <div className="pt-3 border-t border-border/50 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-camera-scanner"
                  checked={preferences.showCameraScanner ?? false}
                  onCheckedChange={(checked) => {
                    const newValue = checked === true
                    updatePreference('showCameraScanner', newValue)
                    if (newValue) { try { window.localStorage.removeItem(AUTO_CAMERA_OPT_OUT_KEY) } catch {} }
                  }}
                />
                <Label htmlFor="show-camera-scanner" className="text-sm font-medium cursor-pointer">Auto-open camera</Label>
              </div>
              {cameraTrouble && (
                <p className="text-xs text-amber-700 dark:text-amber-400 ml-6">Camera trouble detected. Try manual entry or re-request permission.</p>
              )}
            </div>

            {isMounted && history.length > 0 && (
              <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{history.length} recent scans</span>
                <Button variant="ghost" size="sm" onClick={clearHistory} className="h-7 text-xs text-muted-foreground">
                  <Trash2 className="h-3 w-3 mr-1" /> Clear history
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Camera Scanner ── */}
        <div className="mb-6">
          {showScanner ? (
            <BarcodeScanner
              onScanSuccess={handleBarcodeScan}
              onError={handleScannerError}
              onClose={closeScanner}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                try { window.localStorage.removeItem(AUTO_CAMERA_OPT_OUT_KEY) } catch {}
                setShowScanner(true)
              }}
              className="w-full min-h-[160px] border-2 border-dashed border-border/60 rounded-xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
            >
              <Camera className="h-8 w-8" />
              <span className="text-sm font-medium">Tap to scan barcode</span>
            </button>
          )}
        </div>

        {/* ── "or" divider ── */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground">or enter ISBN</span>
          </div>
        </div>

        {/* ── ISBN Input ── */}
        <div className="mb-4">
              <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Input
                    placeholder="Enter ISBN"
                    aria-label="Enter ISBN number"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    className="flex-1"
                    autoFocus={!showScanner}
                    disabled={rateLimit?.remaining === 0 && !rateLimit?.unlimited}
                  />
                  <Button type="submit" disabled={loading || !isbn.trim() || (rateLimit?.remaining === 0 && !rateLimit?.unlimited)}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scanning
                      </>
                    ) : rateLimit?.remaining === 0 && !rateLimit?.unlimited ? (
                      <>
                        Limit Reached
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

        {/* ── Compact info bar: mode + credits ── */}
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="cursor-pointer text-xs select-none"
            onClick={() => setScanMode(m => m === 'quick' ? 'deep' : 'quick')}
          >
            {scanMode === 'quick' ? 'Quick scan' : 'Deep scan'}
          </Badge>
          {rateLimit && !rateLimit.unlimited && (
            <span className={cn(
              "text-xs",
              rateLimit.remaining === 0 ? "text-destructive font-medium" : "text-muted-foreground"
            )}>
              {rateLimit.remaining}/{rateLimit.limit} credits
            </span>
          )}
          {rateLimit?.unlimited && (
            <span className="text-xs text-muted-foreground">Unlimited</span>
          )}
          <div className="ml-auto">
            <BonusScanBadge variant="scan-page" />
          </div>
        </div>

        {/* ── History chips ── */}
        {isMounted && history.length > 0 && (
          <div className="mb-6 flex items-center gap-2 overflow-x-auto py-1 scrollbar-hide">
            <History className="h-3 w-3 text-muted-foreground shrink-0" />
            {history.slice(0, 5).map((item) => (
              <Button
                key={item.isbn}
                variant="ghost"
                size="sm"
                onClick={() => { setIsbn(item.isbn); performScan(item.isbn) }}
                className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground shrink-0"
              >
                {item.title.length > 20 ? `${item.title.substring(0, 20)}…` : item.title}
              </Button>
            ))}
          </div>
        )}

        {/* ── Rate limit exhausted warning ── */}
        {rateLimit && rateLimit.remaining === 0 && !rateLimit.unlimited && (
          <div className="mb-6 p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500/50 text-yellow-700 dark:text-yellow-400">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Daily scan limit reached</span>
              <span className="text-xs text-muted-foreground">
                Resets {new Date(rateLimit.resetAt).toLocaleTimeString('en-US', {
                  hour: 'numeric', minute: '2-digit', hour12: true,
                  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                })}
              </span>
            </div>
            <div className="mt-2 flex justify-end">
              <RateLimitFeedbackDialog rateLimitRemaining={rateLimit.remaining} />
            </div>
          </div>
        )}

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
                      maxLength={500}
                      className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <p className="mt-1 text-xs text-muted-foreground text-right">{reportAdditionalInfo.length}/500</p>
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
              const currentStage = getCurrentStage(statusUpdates, loading)
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
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground">{currentStage.displayText}</p>
                          <span className="text-xs text-muted-foreground tabular-nums">{Math.round((currentStage.stage / 4) * 100)}%</span>
                        </div>
                        <div className="mt-2 w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${(currentStage.stage / 4) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Current Status Message */}
                    {cleanMessage === 'analyzing_categories' ? (
                      <div className="pt-3 border-t border-border/50">
                        <ScanningAnimation
                          isAnalyzing={true}
                          categories={latestMessage.replace(/.*Checking for:/i, '').split(',').map(s => s.trim()).filter(Boolean)}
                        />
                      </div>
                    ) : cleanMessage && (
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
                            if (!cleanUpdate) return null
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

            {/* Redirect transition — existing book found */}
            {redirectingTo && (
              <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="border rounded-lg p-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-green-800 dark:text-green-200">
                        Found it!
                      </p>
                      <p className="text-sm text-green-700/80 dark:text-green-300/70 truncate">
                        Taking you to <span className="font-medium italic">{redirectingTo.title}</span>
                      </p>
                    </div>
                    <Loader2 className="h-4 w-4 animate-spin text-green-600 dark:text-green-400 shrink-0" />
                  </div>
                  <div className="mt-3 w-full bg-green-200/50 dark:bg-green-800/30 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-green-500 dark:bg-green-400 h-1.5 rounded-full animate-[progress_1.2s_ease-in-out_forwards]" />
                  </div>
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
                            alt={`${candidate.title}${candidate.author ? ` by ${candidate.author}` : ''}`}
                            className={cn(
                              "w-12 h-18 sm:w-16 sm:h-24 object-cover rounded shadow-sm transition-all duration-300",
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

            {/* Bonus Claim Notification */}
            <BonusClaimNotification
              claimInfo={bonusClaimInfo}
              onDismiss={() => setBonusClaimInfo(null)}
            />

            <PaywallModal open={showPaywall} onOpenChange={setShowPaywall} />

            {result && result.success && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-400">
                {/* Success header — compact, no alert box */}
                <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  <span className="font-medium">Scan complete</span>
                  {result.analysisLevel && (
                    <Badge variant="outline" className="ml-auto text-[10px]">
                      {result.analysisLevel === 'quick' && result.enrichmentUsed ? 'Quick (enriched)' : result.analysisLevel === 'quick' ? 'Quick' : 'Deep'}
                      {result.metadataQuality ? ` · ${result.metadataQuality} metadata` : ''}
                    </Badge>
                  )}
                </div>

                {/* Cross-check Analysis Display */}
                {result.multiModelAnalysis && (
                  <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20 space-y-4">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <span className="text-blue-600 dark:text-blue-400">🤖</span>
                      Cross-check Summary
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
                        <span className="font-medium">Primary model uniquely found:</span>{' '}
                        <span className="text-muted-foreground">
                          {result.multiModelAnalysis.analysis.unique_to_gpt4o.join(', ')}
                        </span>
                      </div>
                    )}

                    {result.multiModelAnalysis.analysis.unique_to_gemini.length > 0 && (
                      <div className="text-xs">
                        <span className="font-medium">Secondary model uniquely found:</span>{' '}
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
                            {diff.category}: Primary={diff.gpt4o_score.toFixed(2)}, Secondary={diff.gemini_score.toFixed(2)}
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
                          <div className="font-medium">
                            {model.model === 'gpt-4o' ? 'Primary model' : model.model === 'gemini' ? 'Secondary model' : model.model}
                          </div>
                          <div className="text-muted-foreground">
                            {model.content_warnings.length} warnings • {model.timing}ms
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Book result card */}
                <div className="space-y-4">
                  {result.book && (
                    <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
                      <div className="flex gap-4 p-4">
                        {result.book.cover_url && (
                          <img
                            src={result.book.cover_url.startsWith("http") ? `/api/book-cover?url=${encodeURIComponent(result.book.cover_url)}` : result.book.cover_url}
                            alt={`Cover of ${result.book.title}`}
                            className="w-20 h-[120px] object-cover rounded-lg shadow-sm shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <h3 className="font-serif font-bold text-lg leading-tight">{result.book.title || "Unknown Title"}</h3>
                            {result.book.author && <p className="text-sm text-muted-foreground mt-0.5">{result.book.author}</p>}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                            {result.isNewBook && <Badge variant="secondary" className="text-[10px]">New</Badge>}
                            {result.contentWarningsGenerated && <Badge variant="outline" className="text-[10px]">Warnings generated</Badge>}
                            {result.multiModelAnalysis && (
                              <Badge variant="outline" className="text-[10px]">
                                {result.multiModelAnalysis.combined_warnings.length} warnings (cross-checked)
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Audio Player */}
                      {result.book.audio_url && result.book.content_briefing && (
                        <div className="px-4 pb-3">
                          <AccessibleAudioPlayer
                            audioUrl={result.book.audio_url}
                            duration={result.book.audio_duration || undefined}
                            transcript={result.book.audio_transcript || result.book.content_briefing}
                            briefing={result.book.content_briefing}
                          />
                        </div>
                      )}

                      {/* CTA */}
                      <div className="border-t px-4 py-3">
                        <Link href={`/book/${result.book.isbn}`}>
                          <Button className="w-full" size="sm">
                            View Full Details <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Timing Display (dev-only) */}
                  {isDevUi && result.timing && (
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">
                      <div className="font-bold mb-1">Scan Timing:</div>
                      <div>Total: <strong>{result.timing.duration.toFixed(0)}ms</strong></div>
                      {Object.entries(result.timing.stages).map(([stage, duration]) => (
                        <div key={stage} className="ml-2 text-muted-foreground">
                          {stage}: {Number(duration).toFixed(0)}ms
                        </div>
                      ))}
                    </div>
                  )}

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
                                    Source: {warning.source === 'gpt-4o' ? 'Primary model only' : warning.source === 'gemini' ? 'Secondary model only' : warning.source}
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
      </div>
    </>
  )
}

export default function ScanTestPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-2xl px-4 pt-4 pb-8 sm:pt-8">
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading scanner...</p>
        </div>
      </div>
    }>
      <ScanTestPageContent />
    </Suspense>
  )
}
