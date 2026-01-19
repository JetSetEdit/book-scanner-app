"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { Navbar } from "@/components/navbar"

interface ScanResult {
  isbn: string
  status: 'pending' | 'scanning' | 'completed' | 'failed'
  title?: string
  error?: string
  duration?: number
}

export default function BatchScanPage() {
  const [input, setInput] = useState("")
  const [results, setResults] = useState<ScanResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const parseISBNs = (text: string) => {
    return text.split(/[\n,]+/)
      .map(s => s.trim())
      .filter(s => s.length >= 10) // Basic length check
      .map(s => s.replace(/[^0-9X]/gi, '')) // Clean ISBN
  }

  const handleScan = async () => {
    const isbns = parseISBNs(input)
    if (isbns.length === 0) return

    setIsProcessing(true)
    setResults(isbns.map(isbn => ({ isbn, status: 'pending' })))
    setProgress({ current: 0, total: isbns.length })

    // Process sequentially to avoid rate limits
    for (let i = 0; i < isbns.length; i++) {
      const isbn = isbns[i]
      
      // Update status to scanning
      setResults(prev => prev.map(r => 
        r.isbn === isbn ? { ...r, status: 'scanning' } : r
      ))

      const startTime = Date.now()
      try {
        const response = await fetch('/api/admin/batch-scan/single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isbn })
        })

        const data = await response.json()
        const duration = (Date.now() - startTime) / 1000

        if (response.ok) {
          setResults(prev => prev.map(r => 
            r.isbn === isbn ? { 
              ...r, 
              status: 'completed', 
              title: data.title,
              duration 
            } : r
          ))
        } else {
          setResults(prev => prev.map(r => 
            r.isbn === isbn ? { 
              ...r, 
              status: 'failed', 
              error: data.error,
              duration 
            } : r
          ))
        }
      } catch (error) {
        setResults(prev => prev.map(r => 
          r.isbn === isbn ? { 
            ...r, 
            status: 'failed', 
            error: "Network error",
            duration: (Date.now() - startTime) / 1000 
          } : r
        ))
      }

      setProgress(prev => ({ ...prev, current: i + 1 }))
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    setIsProcessing(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar userMode="admin" />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Batch Scanner</h1>
          <p className="text-muted-foreground">
            Queue multiple books for deep analysis. This will force a refresh of existing data.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>Input ISBNs</CardTitle>
              <CardDescription>
                Paste a list of ISBNs (one per line or comma separated).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="9780141182636&#10;9780061120084&#10;..."
                className="font-mono min-h-[300px] mb-4"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isProcessing}
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {parseISBNs(input).length} detected
                </span>
                <Button 
                  onClick={handleScan} 
                  disabled={isProcessing || parseISBNs(input).length === 0}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing ({progress.current}/{progress.total})
                    </>
                  ) : (
                    'Start Batch Scan'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Queue Status</CardTitle>
              <CardDescription>
                {results.filter(r => r.status === 'completed').length} completed, {' '}
                {results.filter(r => r.status === 'failed').length} failed
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto max-h-[500px]">
              {results.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  No active queue
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((result, idx) => (
                    <div 
                      key={`${result.isbn}-${idx}`}
                      className={`p-3 rounded-lg border flex items-center justify-between text-sm ${
                        result.status === 'scanning' ? 'bg-blue-50/50 border-blue-200' :
                        result.status === 'completed' ? 'bg-green-50/50 border-green-200' :
                        result.status === 'failed' ? 'bg-red-50/50 border-red-200' :
                        'bg-muted/30'
                      }`}
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">{result.isbn}</span>
                          {result.duration && (
                            <span className="text-[10px] text-muted-foreground">
                              {result.duration.toFixed(1)}s
                            </span>
                          )}
                        </div>
                        {result.title && (
                          <span className="truncate text-muted-foreground" title={result.title}>
                            {result.title}
                          </span>
                        )}
                        {result.error && (
                          <span className="text-red-600 text-xs font-medium">
                            {result.error}
                          </span>
                        )}
                      </div>

                      <div className="ml-4 shrink-0">
                        {result.status === 'pending' && <Badge variant="outline">Pending</Badge>}
                        {result.status === 'scanning' && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                        {result.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {result.status === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
