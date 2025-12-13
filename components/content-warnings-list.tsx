"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  Hash
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThumbsButtons } from "@/components/thumbs-buttons"
import { getCategoryById } from "@/lib/config/taxonomy"

interface ContentWarning {
  id: string
  category: string
  category_id?: string | null
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

export function ContentWarningsList({ warnings, isAuthorApproved }: ContentWarningsListProps) {
  // Check for sensitive topics to show resources
  const showMentalHealthResources = warnings.some(w =>
    ['mental_health', 'suicide', 'self_harm', 'abuse', 'substance_abuse'].includes(w.category) ||
    (w.category_id && ['mental_health', 'self_harm_or_suicidal_ideation', 'substance_use_or_alcohol', 'emotional_abuse_or_toxic_relationships'].includes(w.category_id)) ||
    w.description.toLowerCase().includes('suicide') ||
    w.description.toLowerCase().includes('depression')
  );

  if (!warnings || warnings.length === 0) {
    return (
      <div className="py-12 text-center border-y border-slate-100">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-serif font-medium text-slate-900 mb-1">No Content Warnings</h3>
        <p className="text-slate-400 text-sm">This book hasn't been flagged for any sensitive content yet.</p>
      </div>
    )
  }

  // Separate warnings by type
  const authorApprovedWarnings = warnings.filter(w => w.is_author_approved === true)
  const communityWarnings = warnings.filter(w => w.source === 'user_submitted' || (w.user_id !== null && w.source !== 'ai_generated' && w.is_author_approved !== true))
  const aiWarnings = warnings.filter(w => w.source === 'ai_generated' || w.user_id === null)
  const officialVerifiedWarnings = warnings.filter(w => w.is_author_verified === true)
  const standardAiWarnings = aiWarnings.filter(w => w.is_author_verified !== true)

  return (
    <div className="space-y-16">
      {showMentalHealthResources && (
        <div className="bg-slate-50 p-6 rounded-none border-l-2 border-slate-900">
          <div className="flex items-start gap-4">
            <Phone className="h-5 w-5 text-slate-900 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs mb-2">Support Resources</h3>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed font-serif italic">
                If the themes in this book are affecting you, help is available.
              </p>
              <div className="flex flex-wrap gap-6 text-xs font-medium uppercase tracking-wider text-slate-500">
                <a href="https://www.lifeline.org.au/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">
                  Lifeline <span className="text-slate-300 ml-1">13 11 14</span>
                </a>
                <a href="https://www.beyondblue.org.au/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">
                  Beyond Blue <span className="text-slate-300 ml-1">1300 22 4636</span>
                </a>
                <a href="https://kidshelpline.com.au/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">
                  Kids Helpline <span className="text-slate-300 ml-1">1800 55 1800</span>
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
  )
}

function WarningItem({ warning, isAi = false, isVerified = false }: { warning: ContentWarning, isAi?: boolean, isVerified?: boolean }) {
  const categoryLabel = (warning.category_id ? getCategoryById(warning.category_id)?.userLabel : null) || categoryLabels[warning.category] || warning.category;

  return (
    <div className={cn(
      "group py-6 border-b border-border last:border-0 transition-colors",
      isVerified ? "hover:border-amber-200 dark:hover:border-amber-800" : "hover:border-border"
    )}>
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
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
              {categoryLabel}
            </h4>
          </div>

          <div className="flex items-center gap-2 pl-9">
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              warning.severity === "severe" && "text-red-600",
              warning.severity === "moderate" && "text-orange-600",
              warning.severity === "mild" && "text-yellow-600"
            )}>
              {warning.severity} Intensity
            </span>
          </div>
        </div>

        {/* Right: Description & Actions */}
        <div className="flex-1">
          <p className="text-slate-600 text-base leading-relaxed font-serif mb-3">
            {warning.description}
          </p>

          <div className="flex items-center gap-4 opacity-40 group-hover:opacity-100 transition-opacity">
            <ThumbsButtons
              warningId={warning.id}
              helpfulCount={warning.helpful_count}
              notHelpfulCount={warning.not_helpful_count}
              userValidation={warning.user_validation}
            />

            {isAi && warning.reasoning && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-slate-400 hover:text-purple-600 px-2">
                    <Info className="h-3 w-3 mr-1" /> Reasoning
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="max-w-xs p-4 text-xs bg-white border border-slate-100 shadow-xl text-slate-600">
                  <p className="font-bold text-slate-900 mb-1 uppercase tracking-wider text-[10px]">AI Reasoning</p>
                  {warning.reasoning}
                  {warning.source_url && (
                    <>
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="font-bold text-slate-900 mb-1 uppercase tracking-wider text-[10px]">Source</p>
                        <a
                          href={warning.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700 break-all"
                        >
                          {warning.source_url}
                        </a>
                      </div>
                    </>
                  )}
                </PopoverContent>
              </Popover>
            )}

            {isAi && !warning.reasoning && warning.source_url && (
              <a
                href={warning.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-purple-600 flex items-center gap-1"
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
