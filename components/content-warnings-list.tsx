"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AlertTriangle, Shield, CheckCircle, Eye, EyeOff, HelpCircle, ChevronDown, ChevronRight, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThumbsButtons } from "@/components/thumbs-buttons"
import { AIWarningBadge } from "@/components/ai-warning-badge"

interface ContentWarning {
  id: string
  category: string
  description: string
  severity: "mild" | "moderate" | "severe"
  helpful_count: number
  not_helpful_count: number
  user_validation?: boolean | null
  is_author_approved?: boolean
  source?: string
  reasoning?: string
}

interface ContentWarningsListProps {
  warnings: ContentWarning[]
  isAuthorApproved?: boolean
}

const categoryLabels: Record<string, string> = {
  violence: "Violence",
  sexual_content: "Sexual Content",
  substance_abuse: "Substance Abuse",
  mental_health: "Mental Health",
  death: "Death",
  abuse: "Abuse",
  discrimination: "Discrimination",
  other: "Other"
}

export function ContentWarningsList({ warnings, isAuthorApproved }: ContentWarningsListProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!warnings || warnings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Content Warnings
          </CardTitle>
          <CardDescription>No content warnings have been submitted for this book yet</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Separate warnings by type
  const authorApprovedWarnings = warnings.filter(w => w.is_author_approved === true)
  const communityWarnings = warnings.filter(w => w.source === 'user_submitted' || (w.user_id !== null && w.source !== 'ai_generated' && w.is_author_approved !== true))
  const aiWarnings = warnings.filter(w => w.source === 'ai_generated' || w.user_id === null)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Content Warnings</h2>
      </div>

      {/* Author Approved Warnings */}
      {authorApprovedWarnings.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Author-Approved Warnings</CardTitle>
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {authorApprovedWarnings.length} Warning{authorApprovedWarnings.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1"
              >
                {isExpanded ? (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4" />
                    Show Details
                  </>
                )}
              </Button>
            </div>
            <CardDescription>
              Content warnings approved by the author or publisher
            </CardDescription>
          </CardHeader>
          {isExpanded && (
            <CardContent>
              <div className="space-y-3">
                {authorApprovedWarnings.map((warning) => (
                  <div key={warning.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        warning.severity === "severe" && "border-red-500 text-red-700",
                        warning.severity === "moderate" && "border-orange-500 text-orange-700",
                        warning.severity === "mild" && "border-yellow-500 text-yellow-700"
                      )}>
                        {categoryLabels[warning.category] || warning.category}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {warning.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{warning.description}</p>
                    <ThumbsButtons warningId={warning.id} />
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Community Submitted Warnings */}
      {communityWarnings.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Community Warnings</CardTitle>
                <Badge variant="outline" className="border-blue-500 text-blue-700">
                  <Shield className="h-3 w-3 mr-1" />
                  {communityWarnings.length} Warning{communityWarnings.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1"
              >
                {isExpanded ? (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4" />
                    Show Details
                  </>
                )}
              </Button>
            </div>
            <CardDescription>
              Content warnings submitted by community members
            </CardDescription>
          </CardHeader>
          {isExpanded && (
            <CardContent>
              <div className="space-y-3">
                {communityWarnings.map((warning) => (
                  <div key={warning.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        warning.severity === "severe" && "border-red-500 text-red-700",
                        warning.severity === "moderate" && "border-orange-500 text-orange-700",
                        warning.severity === "mild" && "border-yellow-500 text-yellow-700"
                      )}>
                        {categoryLabels[warning.category] || warning.category}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {warning.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{warning.description}</p>
                    <ThumbsButtons warningId={warning.id} />
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* AI Generated Warnings */}
      {aiWarnings.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">AI-Generated Warnings</CardTitle>
                <AIWarningBadge 
                  count={aiWarnings.length} 
                  confidence="high" 
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1"
              >
                {isExpanded ? (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4" />
                    Show Details
                  </>
                )}
              </Button>
            </div>
            <CardDescription>
              Content warnings generated by AI analysis
            </CardDescription>
          </CardHeader>
          {isExpanded && (
            <CardContent>
              <div className="space-y-3">
                {aiWarnings.map((warning) => (
                  <div key={warning.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn(
                          "text-xs",
                          warning.severity === "severe" && "border-red-500 text-red-700",
                          warning.severity === "moderate" && "border-orange-500 text-orange-700",
                          warning.severity === "mild" && "border-yellow-500 text-yellow-700"
                        )}>
                          {categoryLabels[warning.category] || warning.category}
                        </Badge>
                        {warning.reasoning && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
                            </PopoverTrigger>
                            <PopoverContent className="max-w-xs">
                              <p className="text-xs">
                                <strong>AI Reasoning:</strong> {warning.reasoning}
                              </p>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {warning.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{warning.description}</p>
                    <ThumbsButtons warningId={warning.id} />
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}