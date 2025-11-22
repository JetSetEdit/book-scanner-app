"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, FileText, Search, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface AuditLog {
  id: string
  decision_type: 'warnings_generated' | 'no_warnings' | 'search_performed' | 'metadata_thin'
  warnings_count: number
  ai_reasoning: string
  confidence_level: 'low' | 'medium' | 'high' | null
  had_thin_metadata: boolean
  used_web_search: boolean
  description_length: number | null
  created_at: string
  raw_ai_response: any
}

interface AuditHistoryProps {
  bookId: string
}

const decisionTypeLabels: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  warnings_generated: {
    label: "Warnings Generated",
    icon: AlertTriangle,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/20"
  },
  no_warnings: {
    label: "No Warnings Found",
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/20"
  },
  search_performed: {
    label: "Web Search Performed",
    icon: Search,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/20"
  },
  metadata_thin: {
    label: "Thin Metadata Detected",
    icon: Info,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950/20"
  }
}

export function AuditHistory({ bookId }: AuditHistoryProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function fetchLogs() {
      try {
        const response = await fetch(`/api/audit-logs?book_id=${bookId}`)
        if (response.ok) {
          const data = await response.json()
          setLogs(data.logs || [])
          // Default expand the most recent log if it exists
          if (data.logs && data.logs.length > 0) {
             setExpandedLogs(prev => ({ ...prev, [data.logs[0].id]: true }))
          }
        }
      } catch (error) {
        console.error('Failed to fetch audit logs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [bookId])

  if (loading) {
    return (
      <Card className="animate-pulse border-none shadow-none bg-muted/30">
        <CardContent className="p-6 space-y-3">
          <div className="h-4 bg-muted/50 rounded w-1/3"></div>
          <div className="h-20 bg-muted/50 rounded-lg w-full"></div>
        </CardContent>
      </Card>
    )
  }

  if (logs.length === 0) {
    return (
        <Card className="border-dashed bg-muted/10 border-2">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <div className="space-y-1">
                    <h3 className="font-semibold text-muted-foreground">No Audit History</h3>
                    <p className="text-sm text-muted-foreground/70 max-w-xs mx-auto">
                        No AI analysis records have been generated for this book yet.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
  }

  const toggleLog = (logId: string) => {
    setExpandedLogs(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }))
  }

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                AI Decision History
            </h3>
            <Badge variant="outline" className="text-xs font-normal">
                {logs.length} Records
            </Badge>
        </div>

        <div className="space-y-3">
          {logs.map((log) => {
            const decisionInfo = decisionTypeLabels[log.decision_type] || { 
                label: log.decision_type, 
                icon: Info, 
                color: "text-muted-foreground", 
                bg: "bg-muted/20" 
            }
            const Icon = decisionInfo.icon
            const isExpanded = expandedLogs[log.id]

            return (
              <div key={log.id} className={cn(
                  "border rounded-xl overflow-hidden transition-all duration-200",
                  isExpanded ? "shadow-md ring-1 ring-border" : "hover:border-foreground/20"
              )}>
                <button
                  onClick={() => toggleLog(log.id)}
                  className={cn(
                      "w-full flex items-center justify-between p-4 transition-colors",
                      isExpanded ? "bg-card" : "bg-card/50 hover:bg-card",
                      decisionInfo.bg
                  )}
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shadow-sm bg-background", decisionInfo.color)}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{decisionInfo.label}</div>
                      <div className="text-xs text-muted-foreground font-medium">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {log.warnings_count > 0 && (
                      <Badge variant="destructive" className="text-xs font-bold shadow-sm">
                        {log.warnings_count} Warning{log.warnings_count !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {log.confidence_level && (
                      <Badge variant={log.confidence_level === 'high' ? 'default' : 'secondary'} className="text-xs capitalize">
                        {log.confidence_level} Confidence
                      </Badge>
                    )}
                    <div className={cn("transition-transform duration-200", isExpanded && "rotate-180")}>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="p-5 border-t bg-card space-y-4 animate-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AI Reasoning Analysis</h4>
                      <div className="p-3 rounded-lg bg-muted/30 border text-sm text-foreground leading-relaxed shadow-sm">
                        {log.ai_reasoning}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {log.had_thin_metadata && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900 gap-1">
                          <Info className="h-3 w-3" /> Thin Metadata Detected
                        </Badge>
                      )}
                      {log.used_web_search && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900 gap-1">
                          <Search className="h-3 w-3" /> Deep Web Search Used
                        </Badge>
                      )}
                      {log.description_length !== null && (
                        <Badge variant="secondary" className="font-mono text-xs">
                          Context: {log.description_length} chars
                        </Badge>
                      )}
                    </div>

                    {log.raw_ai_response && (
                      <details className="group">
                        <summary className="flex items-center gap-2 cursor-pointer text-xs font-medium text-muted-foreground hover:text-primary transition-colors select-none">
                          <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                          View Raw AI Response Data
                        </summary>
                        <div className="mt-2 relative">
                            <pre className="p-3 rounded-lg bg-slate-950 text-slate-50 overflow-auto max-h-60 text-[10px] font-mono leading-relaxed shadow-inner">
                            {JSON.stringify(log.raw_ai_response, null, 2)}
                            </pre>
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
    </div>
  )
}
