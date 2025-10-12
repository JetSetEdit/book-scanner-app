"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Shield, CheckCircle, Eye, EyeOff, HelpCircle, ChevronDown, ChevronRight } from "lucide-react"
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
  language: "Language",
  other: "Other",
}

const severityColors = {
  mild: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  moderate: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  severe: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

// Function to parse content type indicators from description
function parseContentType(description: string) {
  const cleanDescription = description
    .replace(/\(implied off page and post-recounting\)/gi, '')
    .replace(/\(implied, off page\)/gi, '')
    .replace(/\(implied for a secondary character, off page\)/gi, '')
    .replace(/\(implied off page\)/gi, '')
    .trim()

  let contentType = 'on-page' // default
  let contentTypeIcon = Eye
  let contentTypeColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'

  if (description.toLowerCase().includes('off page')) {
    contentType = 'off-page'
    contentTypeIcon = EyeOff
    contentTypeColor = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  } else if (description.toLowerCase().includes('implied')) {
    contentType = 'implied'
    contentTypeIcon = HelpCircle
    contentTypeColor = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  }

  return { cleanDescription, contentType, contentTypeIcon, contentTypeColor }
}

export function ContentWarningsList({ warnings, isAuthorApproved = false }: ContentWarningsListProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (warnings.length === 0) {
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

  // Count warnings by severity
  const severeCount = warnings.filter(w => w.severity === 'severe').length
  const moderateCount = warnings.filter(w => w.severity === 'moderate').length
  const mildCount = warnings.filter(w => w.severity === 'mild').length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle>Content Warnings</CardTitle>
            {isAuthorApproved && (
              <Badge variant="default" className="ml-2 bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Author-Approved
              </Badge>
            )}
            <AIWarningBadge 
              count={warnings.filter(w => w.source === 'ai_generated').length} 
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
          {isAuthorApproved 
            ? "Author-approved content warnings from the publisher" 
            : warnings.some(w => w.source === 'ai_generated')
              ? "AI-generated and community-submitted content warnings for this book"
              : "Community-submitted content warnings for this book"
          }
        </CardDescription>
        
        {/* Summary when collapsed */}
        {!isExpanded && (
          <div className="mt-3 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-4 text-sm">
              {severeCount > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-medium">{severeCount} Severe</span>
                </div>
              )}
              {moderateCount > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="font-medium">{moderateCount} Moderate</span>
                </div>
              )}
              {mildCount > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="font-medium">{mildCount} Mild</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Click "Show Details" to see specific warnings
            </p>
          </div>
        )}
      </CardHeader>
      
      {/* Detailed content - only show when expanded */}
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Group warnings by severity */}
          {['severe', 'moderate', 'mild'].map((severity) => {
            const severityWarnings = warnings.filter(w => w.severity === severity)
            if (severityWarnings.length === 0) return null
            
            return (
              <div key={severity} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={cn("capitalize text-xs", severityColors[severity as keyof typeof severityColors])}>
                    {severity}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {severityWarnings.length} warning{severityWarnings.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="space-y-2 pl-4">
                  {severityWarnings.map((warning) => {
                    const { cleanDescription, contentType, contentTypeIcon: ContentTypeIcon, contentTypeColor } = parseContentType(warning.description)
                    
                    return (
                      <div key={warning.id} className="flex items-start justify-between gap-3 py-2 border-l-2 border-muted pl-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {categoryLabels[warning.category]}
                            </Badge>
                            <Badge variant="secondary" className={cn("text-xs flex items-center gap-1", contentTypeColor)}>
                              <ContentTypeIcon className="h-3 w-3" />
                              {contentType === 'on-page' ? 'On-Page' : contentType === 'off-page' ? 'Off-Page' : 'Implied'}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">
                            {cleanDescription}
                          </p>
                        </div>
                        
                        <div className="flex-shrink-0">
                          <ThumbsButtons
                            warningId={warning.id}
                            helpfulCount={warning.helpful_count}
                            notHelpfulCount={warning.not_helpful_count}
                            userValidation={warning.user_validation}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </CardContent>
      )}
    </Card>
  )
}
