"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Sparkles,
  Phone,
  ExternalLink,
  Shield,
  Brain,
  Flame,
  Skull,
  Pill,
  Wine,
  Ban,
  MessageSquareWarning,
  HelpCircle,
  Sword,
  HeartCrack,
  Users,
  Activity,
  Hash,
  Eye,
  EyeOff
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThumbsButtons } from "@/components/thumbs-buttons"
import { getCategoryById, getSubcategoryById } from "@/lib/config/taxonomy-v2"
import { TagWithTooltip } from "@/components/tag-with-tooltip"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getWarningContext, getContextInfo, shouldShowWarning } from "@/lib/utils/dark-romance-context"
import { useUserPreferences } from "@/hooks/use-user-preferences"

interface ContentWarning {
  id: string
  category: string
  category_id?: string | null
  subcategory_id?: string | null
  confidence_score?: number | null
  description: string
  severity: "mild" | "moderate" | "severe"
  helpful_count: number
  not_helpful_count: number
  user_validation?: boolean | null
  user_id?: string | null
  is_author_approved?: boolean
  source?: string
  reasoning?: string | null
  is_author_verified?: boolean
  source_url?: string | null
  is_spoiler?: boolean
}

interface ContentWarningsListProps {
  warnings: ContentWarning[]
  isAuthorApproved?: boolean
  analysisStatus?: 'complete' | 'unknown'
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

// Icon Mapping
const CategoryIcon = ({ id, legacyCategory, className }: { id?: string | null, legacyCategory: string, className?: string }) => {
  // Granular ID mapping
  if (id) {
    switch (id) {
      case 'mental_health': return <Brain className={className} />;
      case 'sexual_content': return <Flame className={className} />;
      case 'emotional_abuse_or_toxic_relationships': return <HeartCrack className={className} />;
      case 'bullying_or_social_cruelty': return <Users className={className} />;
      case 'violence': return <Sword className={className} />;
      case 'substance_use_or_alcohol': return <Wine className={className} />;
      case 'self_harm_or_suicidal_ideation': return <Activity className={className} />;
      case 'death_or_grief': return <Skull className={className} />;
      case 'discrimination': return <Ban className={className} />;
      case 'language': return <Hash className={className} />;
    }
  }

  // Legacy/Fallback mapping
  switch (legacyCategory) {
    case 'mental_health': return <Brain className={className} />;
    case 'sexual_content': return <Flame className={className} />;
    case 'abuse': return <HeartCrack className={className} />; // Fallback for general abuse
    case 'violence': return <Sword className={className} />;
    case 'substance_abuse': return <Pill className={className} />;
    case 'death': return <Skull className={className} />;
    case 'discrimination': return <Ban className={className} />;
    default: return <AlertTriangle className={className} />;
  }
};

export function ContentWarningsList({ warnings, isAuthorApproved, analysisStatus = 'unknown' }: ContentWarningsListProps) {
  const { preferences } = useUserPreferences()
  const tropeMode = preferences.tropeMode || 'both'
  const [requestSent, setRequestSent] = useState(false)
  
  // Filter warnings based on trope mode
  const filteredWarnings = warnings.filter(warning => {
    const context = getWarningContext(warning.category_id, warning.subcategory_id, warning.description)
    return shouldShowWarning(context, tropeMode)
  })
  
  // Check for sensitive topics to show resources (use filtered warnings)
  const showMentalHealthResources = filteredWarnings.some(w =>
    ['mental_health', 'suicide', 'self_harm', 'abuse', 'substance_abuse'].includes(w.category) ||
    (w.category_id && ['mental_health', 'substance_use_or_alcohol', 'emotional_abuse_or_toxic_relationships'].includes(w.category_id)) ||
    w.description.toLowerCase().includes('suicide') ||
    w.description.toLowerCase().includes('depression')
  );

  const handleRequestAnalysis = () => {
    setRequestSent(true)
    toast.success("Analysis requested! We've added this to our priority queue.")
  }

  // Handle empty warnings - distinguish between "Safe" (analyzed, no warnings) and "Unknown" (not analyzed)
  if (!filteredWarnings || filteredWarnings.length === 0) {
    // If analysis status is unknown, show "not analyzed" message
    if (analysisStatus === 'unknown') {
      return (
        <div className="py-12 text-center border-y border-border">
          <div className="flex justify-center mb-4">
            <HelpCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-serif font-medium text-foreground mb-1">This book hasn't been analyzed yet</h3>
          <p className="text-muted-foreground text-sm mb-6">We haven't analyzed this book for content warnings. Scan the ISBN to generate an analysis.</p>
          <Button
            variant="outline"
            onClick={handleRequestAnalysis}
            disabled={requestSent}
            className="mt-2"
          >
            {requestSent ? "Request Sent" : "Request Analysis"}
          </Button>
        </div>
      )
    }
    
    // If analysis is complete and no warnings, show "Safe" message with positive framing
    return (
      <div className="py-12 text-center border-y border-border">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500" />
        </div>
        <h3 className="text-lg font-serif font-medium text-foreground mb-1">✨ Comfort Read</h3>
        <p className="text-muted-foreground text-sm">We analyzed this book and found no concerning content. This appears to be a safe, cozy read.</p>
      </div>
    )
  }

  // Separate warnings by type (using filtered warnings)
  const authorApprovedWarnings = filteredWarnings.filter(w => w.is_author_approved === true)
  const communityWarnings = filteredWarnings.filter(w => w.source === 'user_submitted' || (w.user_id !== null && w.source !== 'ai_generated' && w.is_author_approved !== true))
  const aiWarnings = filteredWarnings.filter(w => w.source === 'ai_generated' || w.user_id === null)
  const officialVerifiedWarnings = filteredWarnings.filter(w => w.is_author_verified === true)
  const standardAiWarnings = aiWarnings.filter(w => w.is_author_verified !== true)

  return (
    <TooltipProvider>
      <div className="space-y-16">
      {showMentalHealthResources && (
        <div className="bg-muted p-6 rounded-none border-l-2 border-border">
          <div className="flex items-start gap-4">
            <Phone className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-foreground uppercase tracking-widest text-xs mb-2">Support Resources</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed font-serif italic">
                If the themes in this book are affecting you, help is available.
              </p>
              <div className="flex flex-wrap gap-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <a href="https://www.lifeline.org.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                  Lifeline <span className="text-muted-foreground/60 ml-1">13 11 14</span>
                </a>
                <a href="https://www.beyondblue.org.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                  Beyond Blue <span className="text-muted-foreground/60 ml-1">1300 22 4636</span>
                </a>
                <a href="https://kidshelpline.com.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                  Kids Helpline <span className="text-muted-foreground/60 ml-1">1800 55 1800</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Author/Publisher Warnings (Gold Standard) */}
      {officialVerifiedWarnings.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px bg-border flex-1"></div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
              <CheckCircle className="h-4 w-4" />
              <h3 className="font-bold uppercase tracking-widest text-xs">Official Author Notes</h3>
            </div>
            <div className="h-px bg-border flex-1"></div>
          </div>

          <div className="space-y-0">
            {officialVerifiedWarnings.map((warning) => (
              <WarningItem key={warning.id} warning={warning} isVerified={true} />
            ))}
          </div>
        </section>
      )}

      {/* AI Generated Warnings */}
      {standardAiWarnings.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px bg-border flex-1"></div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              <h3 className="font-bold uppercase tracking-widest text-xs">AI Analysis</h3>
            </div>
            <div className="h-px bg-border flex-1"></div>
          </div>

          <div className="space-y-0">
            {standardAiWarnings.map((warning) => (
              <WarningItem key={warning.id} warning={warning} isAi={true} />
            ))}
          </div>
        </section>
      )}

      {/* Community Submitted Warnings */}
      {communityWarnings.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px bg-border flex-1"></div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-4 w-4" />
              <h3 className="font-bold uppercase tracking-widest text-xs">Community Reports</h3>
            </div>
            <div className="h-px bg-border flex-1"></div>
          </div>

          <div className="space-y-0">
            {communityWarnings.map((warning) => (
              <WarningItem key={warning.id} warning={warning} />
            ))}
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <div className="mt-12 pt-8 border-t border-border">
        <p className="text-[10px] text-muted-foreground leading-relaxed text-center italic max-w-xl mx-auto">
          All warnings include source citations and reasoning for transparency. Author-provided warnings are prioritized and shown first. Severity is subjective—varying by individual sensitivity—so use your own judgment.
        </p>
      </div>
      </div>
    </TooltipProvider>
  )
}

function WarningItem({ warning, isAi = false, isVerified = false }: { warning: ContentWarning, isAi?: boolean, isVerified?: boolean }) {
  const [isRevealed, setIsRevealed] = useState(false)
  const isSpoiler = warning.is_spoiler === true

  // Safely get category label with fallbacks
  let categoryLabel: string;
  try {
    categoryLabel = (warning.category_id ? getCategoryById(warning.category_id)?.userLabel : null) || categoryLabels[warning.category] || warning.category || 'Unknown Category';
  } catch (error) {
    console.error('Error getting category label:', error);
    categoryLabel = categoryLabels[warning.category] || warning.category || 'Unknown Category';
  }

  // Safely get subcategory label
  let subcategoryLabel: string | null = null;
  try {
    if (warning.category_id && warning.subcategory_id) {
      subcategoryLabel = getSubcategoryById(warning.category_id, warning.subcategory_id)?.userLabel || null;
    }
  } catch (error) {
    console.error('Error getting subcategory label:', error);
    subcategoryLabel = null;
  }

  // Generate a safe anchor ID from warning subcategory_id or id
  const anchorId = warning.subcategory_id 
    ? `warning-${warning.subcategory_id.replace(/[^a-zA-Z0-9]/g, '-')}`
    : `warning-${warning.id}`

  return (
    <div 
      id={anchorId}
      className={cn(
        "group py-6 border-b border-border last:border-0 transition-colors scroll-mt-20",
        isVerified ? "hover:border-amber-200 dark:hover:border-amber-800" : "hover:border-border"
      )}
    >
      <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-8">

        {/* Left: Icon & Category */}
        <div className="md:w-1/3 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              "p-1.5 rounded-full",
              warning.severity === "severe" && "bg-red-50 text-red-600",
              warning.severity === "moderate" && "bg-orange-50 text-orange-600",
              warning.severity === "mild" && "bg-yellow-50 text-yellow-600"
            )}>
              <CategoryIcon
                id={warning.category_id}
                legacyCategory={warning.category}
                className="h-4 w-4"
              />
            </div>
            <div className="flex flex-col gap-1">
              <TagWithTooltip 
                label={categoryLabel} 
                className="font-bold text-foreground text-sm uppercase tracking-wide" 
              />
              {subcategoryLabel && (
                <TagWithTooltip 
                  label={subcategoryLabel} 
                  className="text-xs text-muted-foreground font-medium" 
                />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1 pl-9">
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              warning.severity === "severe" && "text-red-600 dark:text-red-500",
              warning.severity === "moderate" && "text-orange-600 dark:text-orange-500",
              warning.severity === "mild" && "text-yellow-600 dark:text-yellow-500"
            )}>
              {warning.severity} Intensity
            </span>
            {isSpoiler && isRevealed && (
              <button
                onClick={() => setIsRevealed(false)}
                className="text-[10px] text-muted-foreground/60 hover:text-foreground font-medium flex items-center gap-1 transition-colors cursor-pointer w-fit"
              >
                <EyeOff className="h-3 w-3" />
                <span>Hide spoiler</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Description & Actions */}
        <div className="flex-1">
          {/* Context Badge for Dark Romance */}
          {(() => {
            const context = getWarningContext(warning.category_id, warning.subcategory_id, warning.description)
            const contextInfo = getContextInfo(context)
            if (contextInfo.label) {
              return (
                <div className="mb-2">
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs font-medium", contextInfo.color)}
                    title={contextInfo.description}
                  >
                    {contextInfo.label}
                  </Badge>
                </div>
              )
            }
            return null
          })()}
          
          <div className="mb-3">
            {isSpoiler && !isRevealed ? (
              <div className="relative">
                <div className="bg-muted/50 border border-border rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-3 font-serif italic">
                    This warning contains spoilers about plot elements, character outcomes, or major story reveals.
                  </p>
                  <button
                    onClick={() => setIsRevealed(true)}
                    className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-2 mx-auto transition-colors underline underline-offset-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Reveal spoiler warning</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-base leading-relaxed font-serif">
                {warning.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 opacity-40 group-hover:opacity-100 transition-opacity">
            <ThumbsButtons
              warningId={warning.id}
              helpfulCount={warning.helpful_count}
              notHelpfulCount={warning.not_helpful_count}
              userValidation={warning.user_validation}
            />

            {/* Reasoning / Sources - Always show if available */}
            {(warning.reasoning || warning.source_url) && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 px-2">
                    <Info className="h-3 w-3 mr-1" /> {warning.reasoning ? 'Reasoning' : 'Source'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="max-w-xs p-4 text-xs bg-popover border border-border shadow-xl text-popover-foreground">
                  {warning.reasoning && (
                    <>
                      <p className="font-bold text-foreground mb-1 uppercase tracking-wider text-[10px]">
                        {isAi ? 'AI Reasoning' : 'Justification'}
                      </p>
                      <p className="mb-3">{warning.reasoning}</p>
                    </>
                  )}
                  {warning.source_url && (
                    <div className={warning.reasoning ? "mt-3 pt-3 border-t border-border" : ""}>
                      <p className="font-bold text-foreground mb-1 uppercase tracking-wider text-[10px]">Source</p>
                      <a
                        href={warning.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 break-all"
                      >
                        {warning.source_url}
                      </a>
                    </div>
                  )}
                  {!warning.reasoning && !warning.source_url && (
                    <p className="text-muted-foreground italic">No source notes added yet.</p>
                  )}
                </PopoverContent>
              </Popover>
            )}

            {/* Fallback: Show source link if no reasoning popover */}
            {!warning.reasoning && warning.source_url && (
              <a
                href={warning.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1"
              >
                Source <ExternalLink className="h-3 w-3" />
              </a>
            )}

            {isVerified && warning.source_url && (
              <a
                href={warning.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-[10px] font-bold uppercase tracking-widest text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                Source <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
