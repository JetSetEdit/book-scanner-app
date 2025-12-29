"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Code, Play, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

// Check if we're in dev mode
function isDevMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    process.env.NODE_ENV === 'development'
  )
}

interface AgentResult {
  agent: 'assumption-based' | 'evidence-based'
  isbn: string
  timestamp: Date
  result: {
    success: boolean
    book?: any
    warnings?: any[]
    reasoning?: string
    confidence?: string
    error?: string
  }
}

export default function AgentComparisonPage() {
  const [isDev, setIsDev] = useState(false)
  const [isbn, setIsbn] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [results, setResults] = useState<AgentResult[]>([])
  const [assumptionResult, setAssumptionResult] = useState<AgentResult | null>(null)
  const [evidenceResult, setEvidenceResult] = useState<AgentResult | null>(null)
  const [hybridResult, setHybridResult] = useState<AgentResult | null>(null)
  const [runSequentially, setRunSequentially] = useState(true) // Default to sequential to avoid rate limits
  const [includeHybrid, setIncludeHybrid] = useState(true) // Include hybrid mode by default
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsDev(isDevMode())
  }, [])

  if (!isDev) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Dev Only</h1>
          <p className="text-muted-foreground">This page is only available in development mode.</p>
        </div>
      </div>
    )
  }

  const handleScan = async () => {
    if (!isbn.trim()) {
      alert("Please enter an ISBN")
      return
    }

    setIsScanning(true)
    setAssumptionResult(null)
    setEvidenceResult(null)
    setHybridResult(null)
    setError(null)

    try {
      let assumptionData, evidenceData, hybridData

      if (runSequentially) {
        // Run sequentially to avoid rate limits
        console.log('Running scans sequentially...')
        
        // First scan: assumption-based
        const assumptionResponse = await fetch('/api/dev/scan-with-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isbn: isbn.trim(),
            agentType: 'assumption-based'
          })
        })
        assumptionData = await assumptionResponse.json()
        
        if (!assumptionResponse.ok && assumptionData.error?.includes('rate limit')) {
          throw new Error(`Rate limit error: ${assumptionData.error}. Please wait a moment and try again.`)
        }

        // Small delay between scans
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Second scan: evidence-based
        const evidenceResponse = await fetch('/api/dev/scan-with-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isbn: isbn.trim(),
            agentType: 'evidence-based'
          })
        })
        evidenceData = await evidenceResponse.json()
        
        if (!evidenceResponse.ok && evidenceData.error?.includes('rate limit')) {
          throw new Error(`Rate limit error: ${evidenceData.error}. Please wait a moment and try again.`)
        }

        // Third scan: hybrid (if enabled)
        if (includeHybrid) {
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          const hybridResponse = await fetch('/api/dev/scan-with-agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              isbn: isbn.trim(),
              agentType: 'hybrid'
            })
          })
          hybridData = await hybridResponse.json()
          
          if (!hybridResponse.ok && hybridData.error?.includes('rate limit')) {
            console.warn('Hybrid scan failed due to rate limit')
            hybridData = null
          }
        }
      } else {
        // Run in parallel (faster but may hit rate limits)
        const assumptionPromise = fetch('/api/dev/scan-with-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isbn: isbn.trim(),
            agentType: 'assumption-based'
          })
        }).then(async res => {
          const data = await res.json()
          if (!res.ok && data.error?.includes('rate limit')) {
            throw new Error(`Rate limit: ${data.error}`)
          }
          return data
        })

        const evidencePromise = fetch('/api/dev/scan-with-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isbn: isbn.trim(),
            agentType: 'evidence-based'
          })
        }).then(async res => {
          const data = await res.json()
          if (!res.ok && data.error?.includes('rate limit')) {
            throw new Error(`Rate limit: ${data.error}`)
          }
          return data
        })

        const results = await Promise.allSettled([assumptionPromise, evidencePromise])
        
        if (results[0].status === 'rejected') {
          throw results[0].reason
        }
        if (results[1].status === 'rejected') {
          throw results[1].reason
        }
        
        assumptionData = results[0].status === 'fulfilled' ? results[0].value : null
        evidenceData = results[1].status === 'fulfilled' ? results[1].value : null

        // Third scan: hybrid (if enabled) - run after parallel scans complete
        if (includeHybrid) {
          try {
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            const hybridResponse = await fetch('/api/dev/scan-with-agent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                isbn: isbn.trim(),
                agentType: 'hybrid'
              })
            })
            hybridData = await hybridResponse.json()
            
            if (!hybridResponse.ok && hybridData.error?.includes('rate limit')) {
              console.warn('Hybrid scan failed due to rate limit')
              hybridData = null
            }
          } catch (hybridError) {
            console.warn('Hybrid scan error:', hybridError)
            hybridData = null
          }
        }
      }

      const assumptionResult: AgentResult = {
        agent: 'assumption-based',
        isbn: isbn.trim(),
        timestamp: new Date(),
        result: assumptionData
      }

      const evidenceResult: AgentResult = {
        agent: 'evidence-based',
        isbn: isbn.trim(),
        timestamp: new Date(),
        result: evidenceData
      }

      let hybridResultObj: AgentResult | null = null
      if (hybridData) {
        hybridResultObj = {
          agent: 'hybrid',
          isbn: isbn.trim(),
          timestamp: new Date(),
          result: hybridData
        }
        setHybridResult(hybridResultObj)
      }

      setAssumptionResult(assumptionResult)
      setEvidenceResult(evidenceResult)
      setResults([assumptionResult, evidenceResult, ...(hybridResultObj ? [hybridResultObj] : [])])

    } catch (error) {
      console.error('Error scanning:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to scan'
      setError(errorMessage)
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Code className="h-5 w-5 text-slate-400" />
            <h1 className="text-3xl font-bold">Agent Comparison Tool</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Compare assumption-based (old) vs evidence-based (new) agent instructions side-by-side
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Scan Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="9781405293181"
                    onKeyDown={(e) => e.key === 'Enter' && !isScanning && handleScan()}
                  />
                </div>
                <Button
                  onClick={handleScan}
                  disabled={isScanning || !isbn.trim()}
                  className="gap-2"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Run Comparison
                    </>
                  )}
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sequential"
                    checked={runSequentially}
                    onCheckedChange={(checked) => setRunSequentially(checked === true)}
                  />
                  <Label htmlFor="sequential" className="text-sm cursor-pointer">
                    Run sequentially (recommended to avoid rate limits)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="includeHybrid"
                    checked={includeHybrid}
                    onCheckedChange={(checked) => setIncludeHybrid(checked === true)}
                  />
                  <Label htmlFor="includeHybrid" className="text-sm cursor-pointer">
                    Include Hybrid mode (current production default)
                  </Label>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results - Side by Side */}
        {(assumptionResult || evidenceResult || hybridResult) && (
          <div className={cn(
            "grid gap-6",
            hybridResult ? "md:grid-cols-3" : "md:grid-cols-2"
          )}>
            {/* Assumption-Based Agent (Old) */}
            <Card className={cn(
              "border-2",
              assumptionResult ? "border-orange-300" : "border-slate-200"
            )}>
              <CardHeader className="bg-orange-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="px-2 py-1 bg-orange-200 text-orange-900 rounded text-xs font-bold">
                    OLD
                  </span>
                  Assumption-Based Agent
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {assumptionResult ? (
                  <AgentResultDisplay result={assumptionResult} />
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Waiting for result...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Evidence-Based Agent (New) */}
            <Card className={cn(
              "border-2",
              evidenceResult ? "border-green-300" : "border-slate-200"
            )}>
              <CardHeader className="bg-green-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="px-2 py-1 bg-green-200 text-green-900 rounded text-xs font-bold">
                    NEW
                  </span>
                  Evidence-Based Agent
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {evidenceResult ? (
                  <AgentResultDisplay result={evidenceResult} />
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Waiting for result...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hybrid Agent (Current Production) */}
            {includeHybrid && (
              <Card className={cn(
                "border-2",
                hybridResult ? "border-blue-300" : "border-slate-200"
              )}>
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-200 text-blue-900 rounded text-xs font-bold">
                      PROD
                    </span>
                    Hybrid Agent (Current)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {hybridResult ? (
                    <AgentResultDisplay result={hybridResult} />
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      Waiting for result...
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Comparison Summary */}
        {assumptionResult && evidenceResult && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Comparison Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <ComparisonSummary 
                assumption={assumptionResult} 
                evidence={evidenceResult}
                hybrid={hybridResult}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function AgentResultDisplay({ result }: { result: AgentResult }) {
  const { result: data } = result

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "h-2 w-2 rounded-full",
          data.success ? "bg-green-500" : "bg-red-500"
        )} />
        <span className="text-sm font-medium">
          {data.success ? "Success" : "Failed"}
        </span>
        {data.confidence && (
          <span className="text-xs text-muted-foreground ml-auto">
            Confidence: <strong>{data.confidence}</strong>
          </span>
        )}
      </div>

      {/* Book Info */}
      {data.book && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Book Found:</h3>
          <div className="text-sm space-y-1 pl-4">
            <div><strong>Title:</strong> {data.book.title || 'N/A'}</div>
            <div><strong>Author:</strong> {data.book.author || 'N/A'}</div>
            {data.book.description && (
              <div className="mt-2">
                <strong>Description:</strong>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                  {data.book.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warnings */}
      {data.warnings && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">
            Content Warnings ({data.warnings.length})
          </h3>
          {data.warnings.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.warnings.map((warning: any, idx: number) => (
                <div key={idx} className="text-xs border-l-2 border-slate-200 pl-2 py-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                      warning.severity === 'severe' && "bg-red-100 text-red-700",
                      warning.severity === 'moderate' && "bg-orange-100 text-orange-700",
                      warning.severity === 'mild' && "bg-yellow-100 text-yellow-700"
                    )}>
                      {warning.severity}
                    </span>
                    <span className="font-medium">{warning.category_id}</span>
                    {warning.subcategory_id && (
                      <span className="text-muted-foreground">→ {warning.subcategory_id}</span>
                    )}
                  </div>
                  <div className="text-muted-foreground mt-1">{warning.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No warnings generated</p>
          )}
        </div>
      )}

      {/* Reasoning */}
      {data.reasoning && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">AI Reasoning</h3>
          <div className="text-xs bg-slate-50 p-3 rounded border border-slate-200 max-h-48 overflow-y-auto">
            <pre className="whitespace-pre-wrap font-mono text-[11px]">
              {data.reasoning}
            </pre>
          </div>
        </div>
      )}

      {/* Error */}
      {data.error && (
        <div className="text-xs text-red-600 bg-red-50 p-3 rounded border border-red-200">
          <strong>Error:</strong> {data.error}
        </div>
      )}

      {/* Timestamp */}
      <div className="text-xs text-muted-foreground pt-2 border-t">
        Scanned at: {result.timestamp.toLocaleTimeString()}
      </div>
    </div>
  )
}

function ComparisonSummary({ 
  assumption, 
  evidence,
  hybrid
}: { 
  assumption: AgentResult
  evidence: AgentResult
  hybrid?: AgentResult | null
}) {
  const assumptionWarnings = assumption.result.warnings || []
  const evidenceWarnings = evidence.result.warnings || []
  const hybridWarnings = hybrid?.result.warnings || []

  const assumptionCount = assumptionWarnings.length
  const evidenceCount = evidenceWarnings.length
  const hybridCount = hybridWarnings.length

  const assumptionSeverities = {
    severe: assumptionWarnings.filter((w: any) => w.severity === 'severe').length,
    moderate: assumptionWarnings.filter((w: any) => w.severity === 'moderate').length,
    mild: assumptionWarnings.filter((w: any) => w.severity === 'mild').length,
  }

  const evidenceSeverities = {
    severe: evidenceWarnings.filter((w: any) => w.severity === 'severe').length,
    moderate: evidenceWarnings.filter((w: any) => w.severity === 'moderate').length,
    mild: evidenceWarnings.filter((w: any) => w.severity === 'mild').length,
  }

  const hybridSeverities = hybrid ? {
    severe: hybridWarnings.filter((w: any) => w.severity === 'severe').length,
    moderate: hybridWarnings.filter((w: any) => w.severity === 'moderate').length,
    mild: hybridWarnings.filter((w: any) => w.severity === 'mild').length,
  } : null

  return (
    <div className={cn(
      "grid gap-6",
      hybrid ? "md:grid-cols-3" : "md:grid-cols-2"
    )}>
      <div>
        <h3 className="font-semibold mb-3">Warning Counts</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total Warnings:</span>
            <div className="flex gap-2 items-center">
              <span className="font-mono">{assumptionCount}</span>
              <span className="text-muted-foreground">vs</span>
              <span className="font-mono">{evidenceCount}</span>
              {hybrid && (
                <>
                  <span className="text-muted-foreground">vs</span>
                  <span className="font-mono font-bold text-blue-600">{hybridCount}</span>
                </>
              )}
            </div>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span>Severe:</span>
            <div className="flex gap-2 items-center">
              <span className="font-mono">{assumptionSeverities.severe}</span>
              <span className="text-muted-foreground">vs</span>
              <span className="font-mono">{evidenceSeverities.severe}</span>
              {hybrid && (
                <>
                  <span className="text-muted-foreground">vs</span>
                  <span className="font-mono font-bold text-blue-600">{hybridSeverities?.severe || 0}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <span>Moderate:</span>
            <div className="flex gap-2 items-center">
              <span className="font-mono">{assumptionSeverities.moderate}</span>
              <span className="text-muted-foreground">vs</span>
              <span className="font-mono">{evidenceSeverities.moderate}</span>
              {hybrid && (
                <>
                  <span className="text-muted-foreground">vs</span>
                  <span className="font-mono font-bold text-blue-600">{hybridSeverities?.moderate || 0}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <span>Mild:</span>
            <div className="flex gap-2 items-center">
              <span className="font-mono">{assumptionSeverities.mild}</span>
              <span className="text-muted-foreground">vs</span>
              <span className="font-mono">{evidenceSeverities.mild}</span>
              {hybrid && (
                <>
                  <span className="text-muted-foreground">vs</span>
                  <span className="font-mono font-bold text-blue-600">{hybridSeverities?.mild || 0}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-3">Confidence Levels</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Assumption-Based:</span>
            <span className="font-mono">{assumption.result.confidence || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>Evidence-Based:</span>
            <span className="font-mono">{evidence.result.confidence || 'N/A'}</span>
          </div>
          {hybrid && (
            <div className="flex justify-between">
              <span>Hybrid:</span>
              <span className="font-mono font-bold text-blue-600">{hybrid.result.confidence || 'N/A'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

