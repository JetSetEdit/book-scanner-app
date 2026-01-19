"use client"

import { useState, useEffect } from "react"
import { X, ChevronLeft, ChevronRight, Terminal, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Check if we're in dev mode
function isDevMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    process.env.NODE_ENV === 'development'
  )
}

interface DetailedStatusUpdate {
  action: string
  aiResponse?: string | any
  result?: string | any
  timestamp?: number
  metadata?: Record<string, any>
}

interface ScanDebugSidebarProps {
  statusUpdates: string[]
  detailedStatusUpdates?: DetailedStatusUpdate[]
  loading: boolean
  result: any
  error: string | null
  onClear?: () => void
}

export function ScanDebugSidebar({ statusUpdates, detailedStatusUpdates = [], loading, result, error, onClear }: ScanDebugSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDev, setIsDev] = useState(false)

  useEffect(() => {
    setIsDev(isDevMode())
  }, [])

  // Don't render in production
  if (!isDev) return null

  return (
    <>
      {/* Toggle Button - Always visible when in dev */}
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "fixed right-4 top-20 z-50 h-10 w-10 p-0 rounded-full shadow-lg",
          isOpen && "hidden"
        )}
        onClick={() => setIsOpen(true)}
        title="Show debug sidebar"
      >
        <Terminal className="h-4 w-4" />
      </Button>

      {/* Sidebar */}
      {isOpen && (
        <div className="fixed right-0 top-0 h-full w-80 bg-background border-l border-border shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Debug: Scan Progress</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setIsOpen(false)}
                title="Close sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Status */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </span>
                  {statusUpdates.length > 0 && onClear && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={onClear}
                      title="Clear logs"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  <div className={cn(
                    "text-xs px-2 py-1 rounded",
                    loading ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-muted"
                  )}>
                    {loading ? "🔄 Loading..." : result ? "✅ Complete" : error ? "❌ Error" : "⏸️ Idle"}
                  </div>
                </div>
              </div>

              {/* Stream of Consciousness - Detailed Updates */}
              {detailedStatusUpdates.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Stream of Consciousness ({detailedStatusUpdates.length})
                    </span>
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {detailedStatusUpdates.map((update, i) => (
                      <div
                        key={i}
                        className={cn(
                          "text-xs p-3 rounded border bg-card",
                          i === detailedStatusUpdates.length - 1 && loading && "border-primary bg-primary/5"
                        )}
                      >
                        <div className="space-y-2">
                          {/* Action */}
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground font-mono text-[10px] mt-0.5 flex-shrink-0">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <div className="flex-1 space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <span className="text-muted-foreground text-[10px] uppercase">Action:</span>
                                  <p className="font-medium text-foreground mt-0.5">{update.action}</p>
                                </div>
                                {update.timestamp && i > 0 && detailedStatusUpdates[i - 1]?.timestamp && (
                                  <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0">
                                    +{((update.timestamp - detailedStatusUpdates[i - 1].timestamp) / 1000).toFixed(1)}s
                                  </span>
                                )}
                              </div>
                              
                              {/* Model / analysis response (dev only) */}
                              {update.aiResponse && (
                                <div className="mt-2 pt-2 border-t border-border/50">
                                  <span className="text-muted-foreground text-[10px] uppercase">Analysis response:</span>
                                  <div className="mt-1 p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded border border-blue-500/20">
                                    {typeof update.aiResponse === 'string' ? (
                                      <p className="text-foreground">{update.aiResponse}</p>
                                    ) : (
                                      <div className="space-y-1">
                                        {update.aiResponse.book_found !== undefined && (
                                          <p><span className="text-muted-foreground">Book Found:</span> {update.aiResponse.book_found ? 'Yes' : 'No'}</p>
                                        )}
                                        {update.aiResponse.book_title && (
                                          <p><span className="text-muted-foreground">Title:</span> {update.aiResponse.book_title}</p>
                                        )}
                                        {update.aiResponse.book_author && (
                                          <p><span className="text-muted-foreground">Author:</span> {update.aiResponse.book_author}</p>
                                        )}
                                        {update.aiResponse.confidence && (
                                          <p><span className="text-muted-foreground">Confidence:</span> <span className="font-mono">{update.aiResponse.confidence}</span></p>
                                        )}
                                        {update.aiResponse.warnings_count !== undefined && (
                                          <p><span className="text-muted-foreground">Warnings:</span> {update.aiResponse.warnings_count}</p>
                                        )}
                                        {update.aiResponse.reasoning && (
                                          <div className="mt-1 pt-1 border-t border-blue-500/20">
                                            <p className="text-muted-foreground text-[10px] mb-0.5">Reasoning:</p>
                                            <p className="text-foreground italic">{update.aiResponse.reasoning}</p>
                                          </div>
                                        )}
                                        {update.aiResponse.classification_rating && (
                                          <p><span className="text-muted-foreground">Rating:</span> {update.aiResponse.classification_rating}</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Result */}
                              {update.result && (
                                <div className="mt-2 pt-2 border-t border-border/50">
                                  <span className="text-muted-foreground text-[10px] uppercase">Result:</span>
                                  <p className="text-foreground mt-0.5">{update.result}</p>
                                </div>
                              )}
                              
                              {/* Metadata */}
                              {update.metadata && Object.keys(update.metadata).length > 0 && (
                                <div className="mt-2 pt-2 border-t border-border/50">
                                  <span className="text-muted-foreground text-[10px] uppercase">Metadata:</span>
                                  <div className="mt-1 font-mono text-[10px] space-y-0.5">
                                    {Object.entries(update.metadata).map(([key, value]) => {
                                      if (key === 'warnings' && Array.isArray(value)) {
                                        return (
                                          <div key={key} className="ml-2">
                                            <span className="text-muted-foreground">{key}:</span> {value.length} warning(s)
                                          </div>
                                        )
                                      }
                                      return (
                                        <div key={key} className="ml-2">
                                          <span className="text-muted-foreground">{key}:</span> {String(value)}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Simple Progress Messages (fallback) */}
              {detailedStatusUpdates.length === 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Backend Messages ({statusUpdates.length})
                    </span>
                  </div>
                  {statusUpdates.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No messages yet...</p>
                  ) : (
                    <div className="space-y-1.5">
                      {statusUpdates.map((update, i) => (
                        <div
                          key={i}
                          className={cn(
                            "text-xs p-2 rounded border bg-card",
                            i === statusUpdates.length - 1 && loading && "border-primary bg-primary/5"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground font-mono text-[10px] mt-0.5">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <span className={cn(
                              "flex-1 break-words",
                              i === statusUpdates.length - 1 && loading && "font-medium text-foreground"
                            )}>
                              {update}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                    Error
                  </span>
                  <div className="text-xs p-2 rounded border border-destructive/50 bg-destructive/10 text-destructive">
                    {error}
                  </div>
                </div>
              )}

              {/* Result Summary */}
              {result && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                    Result Summary
                  </span>
                  <div className="text-xs space-y-1 p-2 rounded border bg-muted/50">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Is New Book:</span>
                      <span className="font-mono">{result.isNewBook ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Warnings Generated:</span>
                      <span className="font-mono">{result.contentWarningsGenerated ? "Yes" : "No"}</span>
                    </div>
                    {result.timing && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="text-muted-foreground mb-1">Timing:</div>
                        <div className="font-mono text-[10px] space-y-0.5">
                          <div>Total: {result.timing.duration.toFixed(0)}ms</div>
                          {Object.entries(result.timing.stages).map(([stage, duration]: [string, any]) => (
                            <div key={stage} className="ml-2">
                              {stage}: {duration.toFixed(0)}ms
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-border bg-muted/30">
            <p className="text-[10px] text-muted-foreground text-center">
              Dev Mode Only
            </p>
          </div>
        </div>
      )}
    </>
  )
}
