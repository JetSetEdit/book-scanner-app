"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AlertTriangle, Shield, CheckCircle, ChevronDown, ChevronRight, Info, Sparkles, Phone, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThumbsButtons } from "@/components/thumbs-buttons"

interface ContentWarning {
  id: string
  category: string
  description: string
  severity: "mild" | "moderate" | "severe"
  helpful_count: number
  not_helpful_count: number
  user_validation?: boolean | null
  user_id?: string | null
  is_author_approved?: boolean
  source?: string
  reasoning?: string | null
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
  // Default expanded state: Author approved and AI warnings are expanded by default if they exist
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'author-approved': true,
    'ai-generated': true,
    'community': true
  })
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Check for sensitive topics to show resources
  const showMentalHealthResources = warnings.some(w => 
    ['mental_health', 'suicide', 'self_harm', 'abuse', 'substance_abuse'].includes(w.category) || 
    w.description.toLowerCase().includes('suicide') ||
    w.description.toLowerCase().includes('depression')
  );

  if (!warnings || warnings.length === 0) {
    return (
      <div className="bg-muted/30 rounded-lg p-8 text-center border border-dashed">
        <div className="flex justify-center mb-4">
             <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-muted-foreground" />
             </div>
        </div>
        <h3 className="text-lg font-semibold mb-1">No Content Warnings</h3>
        <p className="text-muted-foreground">This book hasn't been flagged for any sensitive content yet.</p>
      </div>
    )
  }

  // Separate warnings by type
  const authorApprovedWarnings = warnings.filter(w => w.is_author_approved === true)
  const communityWarnings = warnings.filter(w => w.source === 'user_submitted' || (w.user_id !== null && w.source !== 'ai_generated' && w.is_author_approved !== true))
  const aiWarnings = warnings.filter(w => w.source === 'ai_generated' || w.user_id === null)
  const officialVerifiedWarnings = warnings.filter(w => w.is_author_verified === true) // New category for author-site verified

  // Filter out official warnings from AI warnings to avoid duplicates if we merge logic later
  // (Current logic: verified warnings might come from AI agent but with is_author_verified=true flag)
  const standardAiWarnings = aiWarnings.filter(w => w.is_author_verified !== true)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-bold">Content Analysis</h2>
         </div>
         <Badge variant="outline" className="ml-auto font-mono text-xs">
            {warnings.length} Total
         </Badge>
      </div>

      {showMentalHealthResources && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-4 mb-6">
            {/* ... resources content ... */}
            <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <Phone className="h-4 w-4" />
                </div>
                <div>
                    <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">Support Resources Available</h3>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 mb-2">
                        If the themes in this book are affecting you, help is available.
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs">
                        <a href="https://www.lifeline.org.au/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center font-medium text-blue-600 dark:text-blue-400 hover:underline">
                            Lifeline (13 11 14) <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                        <span className="text-blue-300 dark:text-blue-700">|</span>
                        <a href="https://www.beyondblue.org.au/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center font-medium text-blue-600 dark:text-blue-400 hover:underline">
                            Beyond Blue (1300 22 4636) <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                         <span className="text-blue-300 dark:text-blue-700">|</span>
                        <a href="https://kidshelpline.com.au/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center font-medium text-blue-600 dark:text-blue-400 hover:underline">
                            Kids Helpline (1800 55 1800) <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Official Author/Publisher Warnings (Gold Standard) */}
      {officialVerifiedWarnings.length > 0 && (
        <div className="border-2 border-amber-400/50 rounded-xl overflow-hidden bg-card shadow-md ring-4 ring-amber-400/10">
          <div 
            className="flex items-center justify-between p-4 bg-amber-50/50 dark:bg-amber-950/10 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
            onClick={() => toggleSection('official-verified')}
          >
            <div className="flex items-center gap-3">
               <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 animate-pulse">
                  <CheckCircle className="h-4 w-4" />
               </div>
               <div>
                  <h3 className="font-bold text-sm text-amber-800 dark:text-amber-200">Official Author Content Notes</h3>
                  <p className="text-xs text-muted-foreground">Verified directly from author's website</p>
               </div>
            </div>
            {expandedSections['official-verified'] ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
          
          {expandedSections['official-verified'] && (
            <div className="p-4 space-y-3 border-t border-amber-100 dark:border-amber-900/30 bg-amber-50/10">
              {officialVerifiedWarnings.map((warning) => (
                <WarningItem key={warning.id} warning={warning} isVerified={true} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Author Approved Warnings (Legacy / Manual Approval) */}
      {authorApprovedWarnings.length > 0 && (
        <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
          <div 
            className="flex items-center justify-between p-4 bg-green-50/50 dark:bg-green-950/10 cursor-pointer hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
            onClick={() => toggleSection('author-approved')}
          >
            <div className="flex items-center gap-3">
               <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
               </div>
               <div>
                  <h3 className="font-semibold text-sm">Community Approved</h3>
                  <p className="text-xs text-muted-foreground">Validated by community consensus</p>
               </div>
            </div>
            {expandedSections['author-approved'] ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
          
          {expandedSections['author-approved'] && (
            <div className="p-4 space-y-3 border-t">
              {authorApprovedWarnings.map((warning) => (
                <WarningItem key={warning.id} warning={warning} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Generated Warnings */}
      {standardAiWarnings.length > 0 && (
        <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
          <div 
            className="flex items-center justify-between p-4 bg-purple-50/50 dark:bg-purple-950/10 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors"
            onClick={() => toggleSection('ai-generated')}
          >
            <div className="flex items-center gap-3">
               <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Sparkles className="h-4 w-4" />
               </div>
               <div>
                  <h3 className="font-semibold text-sm">AI Analysis</h3>
                  <p className="text-xs text-muted-foreground">Generated by intelligent content scanning</p>
               </div>
            </div>
            {expandedSections['ai-generated'] ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
          
          {expandedSections['ai-generated'] && (
            <div className="p-4 space-y-3 border-t">
              {standardAiWarnings.map((warning) => (
                <WarningItem key={warning.id} warning={warning} isAi={true} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Community Submitted Warnings */}
      {communityWarnings.length > 0 && (
        <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
          <div 
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => toggleSection('community')}
          >
            <div className="flex items-center gap-3">
               <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Shield className="h-4 w-4" />
               </div>
               <div>
                  <h3 className="font-semibold text-sm">Community Reports</h3>
                  <p className="text-xs text-muted-foreground">Submitted by other readers</p>
               </div>
            </div>
            {expandedSections['community'] ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
          
          {expandedSections['community'] && (
            <div className="p-4 space-y-3 border-t">
              {communityWarnings.map((warning) => (
                <WarningItem key={warning.id} warning={warning} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function WarningItem({ warning, isAi = false, isVerified = false }: { warning: ContentWarning, isAi?: boolean, isVerified?: boolean }) {
    return (
        <div className={cn(
            "p-4 rounded-lg border transition-colors",
            isVerified 
              ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-200/50 hover:bg-amber-50 dark:hover:bg-amber-950/20" 
              : "bg-muted/30 hover:bg-muted/50"
        )}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={cn(
                        "text-xs font-medium border px-2 py-0.5",
                        warning.severity === "severe" && "border-red-200 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900",
                        warning.severity === "moderate" && "border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900",
                        warning.severity === "mild" && "border-yellow-200 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900"
                    )}>
                        {categoryLabels[warning.category] || warning.category}
                    </Badge>
                    
                    <span className={cn(
                        "text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded",
                        warning.severity === "severe" && "text-red-600 bg-red-100 dark:bg-red-950",
                        warning.severity === "moderate" && "text-orange-600 bg-orange-100 dark:bg-orange-950",
                        warning.severity === "mild" && "text-yellow-600 bg-yellow-100 dark:bg-yellow-950"
                    )}>
                        {warning.severity}
                    </span>

                    {isVerified && warning.source_url && (
                        <a 
                           href={warning.source_url} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400 hover:underline"
                        >
                            <CheckCircle className="h-3 w-3" /> Verified Source
                        </a>
                    )}

                    {isAi && warning.reasoning && (
                        <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 -ml-1 text-muted-foreground hover:text-primary">
                                <Info className="h-3 w-3" />
                                <span className="sr-only">View Reasoning</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="max-w-xs p-3 text-xs bg-card/95 backdrop-blur shadow-xl border-primary/20">
                            <p><strong>AI Reasoning:</strong> {warning.reasoning}</p>
                        </PopoverContent>
                        </Popover>
                    )}
                </div>
            </div>
            
            <p className="text-sm text-muted-foreground leading-snug mb-3">
                {warning.description}
            </p>
            
            <div className="flex items-center gap-4">
                 <ThumbsButtons 
                      warningId={warning.id}
                      helpfulCount={warning.helpful_count}
                      notHelpfulCount={warning.not_helpful_count}
                      userValidation={warning.user_validation}
                 />
            </div>
        </div>
    )
}
