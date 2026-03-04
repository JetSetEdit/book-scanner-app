"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
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
  EyeOff,
  ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThumbsButtons } from "@/components/thumbs-buttons"
import { getCategoryById, getSubcategoryById } from "@/lib/config/taxonomy-v2"
import { TagWithTooltip } from "@/components/tag-with-tooltip"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getWarningContext, getContextInfo, shouldShowWarning } from "@/lib/utils/dark-romance-context"
import { getVariantConfig } from "@/lib/config/variants"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { getWarningPhrase } from "@/lib/services/warning-phraser"
import { SpoilerText } from "@/components/spoiler-text"

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
  evidence?: Array<{ model_source?: 'openai' | 'gemini' | 'both'; [key: string]: any }> | null // For dev mode: track which model generated this
}

interface ContentWarningsListProps {
  warnings: ContentWarning[]
  isAuthorApproved?: boolean
  analysisStatus?: 'complete' | 'unknown'
  isbn?: string // ISBN for analysis requests
  noWarningsReasoning?: string | null // Dev mode: reasoning when no warnings were found
  focusWarningId?: string | null
  /** When set, show author's content warnings link as the first section (author above AI). */
  authorContentWarningsUrl?: string | null
  /** Parsed list of warning strings from author's page; when set, display on site. */
  authorContentWarningsList?: string[] | null
  /** Alternate layout: "cards" = disclosure list (one row per warning, expand for details; sandbox). */
  displayVariant?: 'default' | 'cards'
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

function getCombinedConfidence(warning: Pick<ContentWarning, 'helpful_count' | 'not_helpful_count' | 'evidence'>) {
  const helpful = warning.helpful_count || 0
  const notHelpful = warning.not_helpful_count || 0
  const votes = helpful + notHelpful
  const helpfulRatio = votes > 0 ? helpful / votes : null

  const modelSource = warning.evidence?.[0]?.model_source
  const crossChecked = modelSource === 'both'

  // Community signal buckets (conservative)
  let community: 'none' | 'mixed' | 'positive' | 'contested' = 'none'
  if (votes >= 8 && helpfulRatio != null) {
    if (helpfulRatio >= 0.75) community = 'positive'
    else if (helpfulRatio <= 0.45) community = 'contested'
    else community = 'mixed'
  } else if (votes >= 3) {
    community = 'mixed'
  }

  // Combined confidence: treat cross-check as a floor, but let strong negative feedback pull it down.
  // IMPORTANT: "Low" implies negative feedback. With zero votes, show "New" instead.
  let level: 'New' | 'Low' | 'Medium' | 'High' = votes === 0 ? 'New' : 'Low'
  if (votes === 0) {
    level = 'New'
  } else if (community === 'positive' && crossChecked) level = 'High'
  else if (community === 'positive') level = 'Medium'
  else if (community === 'contested') level = 'Low'
  else if (crossChecked) level = 'Medium'

  const color =
    level === 'High'
      ? 'border-green-500/50 text-green-700 dark:text-green-400'
      : level === 'Medium'
        ? 'border-amber-500/50 text-amber-700 dark:text-amber-400'
        : level === 'New'
          ? 'border-muted-foreground/25 text-muted-foreground'
          : 'border-muted-foreground/40 text-muted-foreground'

  return {
    level,
    color,
    votes,
    helpful,
    notHelpful,
    crossChecked,
  }
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

export function ContentWarningsList({ warnings, isAuthorApproved, analysisStatus = 'unknown', isbn, noWarningsReasoning, focusWarningId, authorContentWarningsUrl, authorContentWarningsList, displayVariant = 'default' }: ContentWarningsListProps) {
  const pathname = usePathname()
  // Sandbox routes always use cards (disclosure rows with severity-colored bar)
  const effectiveDisplayVariant = pathname?.includes("/sandbox/") ? "cards" : displayVariant

  const { preferences } = useUserPreferences()
  const tropeMode = preferences.tropeMode || 'both'
  const [requestSent, setRequestSent] = useState(false)
  const [userState, setUserState] = useState<string | null>(null)
  const [stateServices, setStateServices] = useState<any>(null)
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({})
  const [authorListOpen, setAuthorListOpen] = useState(false)
  const showReasoning = getVariantConfig().flags?.showReasoningInWarnings !== false
  const showSpoilerTags = getVariantConfig().flags?.showSpoilerTags === true

  // Handle focus request
  useEffect(() => {
    if (!focusWarningId) return

    // Find the warning to get its category
    const warning = warnings.find(w => w.id === focusWarningId || w.subcategory_id === focusWarningId) || 
                   warnings.find(w => {
                     // Check if focusWarningId is an anchor ID format (warning-...)
                     const anchorId = w.subcategory_id 
                       ? `warning-${w.subcategory_id.replace(/[^a-zA-Z0-9]/g, '-')}`
                       : `warning-${w.id}`
                     return anchorId === focusWarningId || w.subcategory_id === focusWarningId
                   })

    if (warning) {
      const categoryId = warning.category_id || 'other'
      
      // Open the category
      setOpenCategories(prev => ({
        ...prev,
        [categoryId]: true
      }))

      // Scroll to element after a delay to allow expansion animation (standard duration is ~300ms)
      setTimeout(() => {
        const anchorId = warning.subcategory_id 
          ? `warning-${warning.subcategory_id.replace(/[^a-zA-Z0-9]/g, '-')}`
          : `warning-${warning.id}`
        
        const element = document.getElementById(anchorId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          
          // Layout-safe highlight: ring + rounded corners (no negative margins to avoid overextension)
          element.classList.add('ring-2', 'ring-primary/30', 'ring-offset-2', 'rounded-2xl', 'transition-all', 'duration-1000')
          
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary/30', 'ring-offset-2', 'rounded-2xl', 'transition-all', 'duration-1000')
          }, 2000)
        }
      }, 350)
    }
  }, [focusWarningId, warnings])
  
  // Filter warnings based on trope mode
  const filteredWarnings = warnings.filter(warning => {
    const context = getWarningContext(warning.category_id, warning.subcategory_id, warning.description)
    return shouldShowWarning(context, tropeMode)
  })
  
  // Check for sensitive topics to show resources (use filtered warnings)
  const hasMentalHealth = filteredWarnings.some(w =>
    ['mental_health', 'suicide', 'self_harm'].includes(w.category) ||
    // Top-level category (any mental_health warning should show mental health resources)
    w.category_id === 'mental_health' ||
    // Mental health subcategories (disordered_eating, anxiety, depression, etc. are subcategories of 'mental_health')
    (w.category_id === 'mental_health' && w.subcategory_id && [
      'disordered_eating', 'anxiety', 'depression', 'ptsd',
      'self_harm', 'suicidal_ideation', 'suicide_minor', 'casual_suicidal_ideation',
      'workplace_burnout', 'academic_pressure'
    ].includes(w.subcategory_id)) ||
    // Fallback: check description for keywords
    w.description.toLowerCase().includes('suicide') ||
    w.description.toLowerCase().includes('depression') ||
    w.description.toLowerCase().includes('self-harm') ||
    w.description.toLowerCase().includes('self harm') ||
    w.description.toLowerCase().includes('anxiety') ||
    w.description.toLowerCase().includes('ptsd') ||
    w.description.toLowerCase().includes('trauma') ||
    w.description.toLowerCase().includes('eating disorder')
  );

  const hasAbuseOrViolence = filteredWarnings.some(w =>
    ['abuse', 'violence'].includes(w.category) ||
    // Top-level categories
    (w.category_id && ['violence', 'emotional_abuse_or_toxic_relationships', 'bullying_or_social_cruelty'].includes(w.category_id)) ||
    // Violence subcategories (domestic_violence, torture, etc. are subcategories of 'violence')
    (w.category_id === 'violence' && w.subcategory_id && [
      'domestic_violence', 'graphic_violence', 'violence_against_women', 
      'violence_against_children', 'torture', 'kidnapping_confinement', 'human_trafficking',
      'infanticide_or_intentional_child_harm', 'physical_violence'
    ].includes(w.subcategory_id)) ||
    // Fallback: check description for keywords
    w.description.toLowerCase().includes('domestic violence') ||
    w.description.toLowerCase().includes('abuse') ||
    w.description.toLowerCase().includes('assault') ||
    w.description.toLowerCase().includes('torture') ||
    w.description.toLowerCase().includes('kidnapping') ||
    w.description.toLowerCase().includes('trafficking')
  );

  const hasSexualAssault = filteredWarnings.some(w =>
    // sexual_violence is a subcategory of 'sexual_content'
    (w.category_id === 'sexual_content' && w.subcategory_id === 'sexual_violence') ||
    // Fallback: check description for keywords
    w.description.toLowerCase().includes('sexual assault') ||
    w.description.toLowerCase().includes('rape') ||
    w.description.toLowerCase().includes('sexual violence')
  );

  const hasLGBTIQAIssues = filteredWarnings.some(w =>
    // Check for LGBTQIA+ specific discrimination subcategories
    (w.category_id === 'discrimination' && w.subcategory_id && ['queerphobia', 'homophobia', 'transphobia', 'lesbophobia', 'biphobia', 'acephobia', 'misgendering'].includes(w.subcategory_id)) ||
    // Check for standalone LGBTQIA+ category IDs (if they exist as top-level categories)
    (w.category_id && ['queerphobia', 'homophobia', 'transphobia', 'lesbophobia', 'biphobia', 'acephobia', 'misgendering'].includes(w.category_id)) ||
    // Fallback: check description for LGBTQIA+ keywords
    w.description.toLowerCase().includes('queerphobia') ||
    w.description.toLowerCase().includes('homophobia') ||
    w.description.toLowerCase().includes('transphobia') ||
    w.description.toLowerCase().includes('lgbt') ||
    w.description.toLowerCase().includes('lgbtq') ||
    w.description.toLowerCase().includes('lgbtqia') ||
    w.description.toLowerCase().includes('queer') ||
    w.description.toLowerCase().includes('gay') ||
    w.description.toLowerCase().includes('lesbian') ||
    w.description.toLowerCase().includes('transgender') ||
    w.description.toLowerCase().includes('trans')
  );

  const hasSubstanceUse = filteredWarnings.some(w =>
    ['substance_abuse'].includes(w.category) ||
    (w.category_id && ['substance_use_or_alcohol'].includes(w.category_id)) ||
    w.description.toLowerCase().includes('addiction') ||
    w.description.toLowerCase().includes('drug') ||
    w.description.toLowerCase().includes('alcohol') ||
    w.description.toLowerCase().includes('overdose') ||
    w.description.toLowerCase().includes('substance')
  );

  const hasGrief = filteredWarnings.some(w =>
    ['death'].includes(w.category) ||
    // Top-level category (any death_or_grief warning should show grief resources)
    w.category_id === 'death_or_grief' ||
    // Fallback: check description for keywords
    w.description.toLowerCase().includes('grief') ||
    w.description.toLowerCase().includes('bereavement') ||
    w.description.toLowerCase().includes('mourning') ||
    w.description.toLowerCase().includes('funeral') ||
    w.description.toLowerCase().includes('death') ||
    w.description.toLowerCase().includes('terminal')
  );

  const hasBullying = filteredWarnings.some(w =>
    (w.category_id && ['bullying_or_social_cruelty'].includes(w.category_id)) ||
    w.description.toLowerCase().includes('bullying') ||
    w.description.toLowerCase().includes('hazing') ||
    w.description.toLowerCase().includes('cyberbullying')
  );

  const hasRacism = filteredWarnings.some(w =>
    // racism, cultural_appropriation, antisemitism, islamophobia are subcategories of 'discrimination'
    (w.category_id === 'discrimination' && w.subcategory_id && [
      'racism', 'cultural_appropriation', 'antisemitism', 'islamophobia'
    ].includes(w.subcategory_id)) ||
    // Fallback: check description for keywords
    w.description.toLowerCase().includes('racism') ||
    w.description.toLowerCase().includes('racial') ||
    w.description.toLowerCase().includes('antisemitism') ||
    w.description.toLowerCase().includes('islamophobia')
  );

  const showSupportResources = hasMentalHealth || hasAbuseOrViolence || hasSexualAssault || hasLGBTIQAIssues || hasSubstanceUse || hasGrief || hasBullying || hasRacism;

  // Fetch user location and state-specific services
  useEffect(() => {
    if (!showSupportResources) return

    // Fetch user location
    fetch('/api/user-location')
      .then(res => res.json())
      .then(data => {
        if (data.region && data.region !== 'Unknown') {
          setUserState(data.region)
          // Fetch state-specific services
          return fetch(`/api/state-services?state=${data.region}`)
            .then(res => res.json())
            .then(services => {
              if (services && !services.error) {
                setStateServices(services)
              }
            })
            .catch(err => {
              console.error('Failed to fetch state services:', err)
            })
        }
      })
      .catch(err => {
        console.error('Failed to fetch user location:', err)
      })
  }, [showSupportResources])

  const handleRequestAnalysis = async () => {
    if (requestSent) return
    
    setRequestSent(true)
    
    try {
      // Get ISBN from prop, or fallback to URL
      let bookIsbn = isbn
      if (!bookIsbn && typeof window !== 'undefined') {
        const currentUrl = window.location.pathname
        const isbnMatch = currentUrl.match(/\/book\/([^\/]+)/)
        bookIsbn = isbnMatch ? isbnMatch[1] : null
      }
      
      if (!bookIsbn) {
        toast.error("Unable to determine book ISBN. Please try scanning the book again.")
        setRequestSent(false)
        return
      }

      const response = await fetch('/api/request-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isbn: bookIsbn,
          pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.alreadyAnalyzed) {
          toast.info("This book has already been analyzed. Refreshing page...")
          // Refresh the page to show updated analysis
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.location.reload()
            }
          }, 1500)
        } else {
          throw new Error(data.error || 'Failed to submit analysis request')
        }
      } else {
        toast.success(data.message || "Analysis requested! We've added this to our priority queue.")
      }
    } catch (error) {
      console.error('Error requesting analysis:', error)
      toast.error(error instanceof Error ? error.message : "Failed to submit analysis request. Please try again.")
      setRequestSent(false)
    }
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
    const isDevMode = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    
    return (
      <div className="py-12 text-center border-y border-border">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-forest" />
        </div>
        <h3 className="text-lg font-serif font-medium text-foreground mb-1">✨ Comfort Read</h3>
        <p className="text-muted-foreground text-sm mb-4">We analyzed this book and found no concerning content. This appears to be a safe, cozy read.</p>
        
        {/* Dev Mode: Show AI reasoning for why no warnings were generated */}
        {isDevMode && noWarningsReasoning && (
          <div className="mt-6 p-4 bg-muted/50 border border-border rounded-lg max-w-2xl mx-auto text-left">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Dev Mode: Reasoning (No Warnings)
              </p>
            </div>
            <p className="text-sm text-muted-foreground font-serif leading-relaxed">
              {noWarningsReasoning}
            </p>
          </div>
        )}
      </div>
    )
  }

  // Separate warnings by type (using filtered warnings)
  const authorApprovedWarnings = filteredWarnings.filter(w => w.is_author_approved === true)
  const communityWarnings = filteredWarnings.filter(w => w.source === 'user_submitted' || (w.user_id !== null && w.source !== 'ai_generated' && w.is_author_approved !== true))
  const aiWarnings = filteredWarnings.filter(w => w.source === 'ai_generated' || w.user_id === null)
  const officialVerifiedWarnings = filteredWarnings.filter(w => w.is_author_verified === true)
  const standardAiWarnings = aiWarnings.filter(w => w.is_author_verified !== true)

  // Helper function to group warnings by category
  function groupWarningsByCategory(warnings: ContentWarning[]) {
    const grouped = new Map<string, { category: string; categoryLabel: string; warnings: ContentWarning[] }>()
    
    for (const warning of warnings) {
      const categoryId = warning.category_id || 'other'
      const category = getCategoryById(categoryId)
      const categoryLabel = category?.userLabel || categoryLabels[warning.category] || warning.category || 'Other'
      
      if (!grouped.has(categoryId)) {
        grouped.set(categoryId, {
          category: categoryId,
          categoryLabel,
          warnings: []
        })
      }
      
      grouped.get(categoryId)!.warnings.push(warning)
    }
    
    return Array.from(grouped.values()).sort((a, b) => a.categoryLabel.localeCompare(b.categoryLabel))
  }

  return (
    <TooltipProvider>
      <div className="space-y-16">
      {showSupportResources && (
        <div className="bg-muted/50 dark:bg-muted/30 p-6 rounded-xl border border-border relative" role="region" aria-label="Support resources">
          <div className="flex items-start gap-4">
            <Phone className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-foreground uppercase tracking-widest text-xs mb-2">Support Resources</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed font-serif italic">
                If the themes in this book are affecting you, help is available.
              </p>
              
              {/* Mental Health Resources */}
              {hasMentalHealth && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">
                    Mental Health & Crisis Support
                    {userState && stateServices?.mentalHealth && (
                      <span className="text-muted-foreground/60 ml-2 normal-case">({userState} services available)</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
                    {/* State-specific services first */}
                    {userState && stateServices?.mentalHealth && stateServices.mentalHealth.map((service: any, idx: number) => (
                      <a key={idx} href={service.url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                        {service.name}{service.phone && <span className="ml-1 font-semibold text-foreground tabular-nums">{service.phone}</span>}
                      </a>
                    ))}
                    {/* National services */}
                    <a href="https://www.lifeline.org.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                      Lifeline <span className="ml-1 font-semibold text-foreground tabular-nums">13 11 14</span>
                    </a>
                    <a href="https://www.beyondblue.org.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                      Beyond Blue <span className="ml-1 font-semibold text-foreground tabular-nums">1300 22 4636</span>
                    </a>
                    <a href="https://kidshelpline.com.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                      Kids Helpline <span className="ml-1 font-semibold text-foreground tabular-nums">1800 55 1800</span>
                    </a>
                    <a href="https://mensline.org.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                      MensLine <span className="ml-1 font-semibold text-foreground tabular-nums">1300 78 99 78</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Domestic Violence & Sexual Assault Resources */}
              {(hasAbuseOrViolence || hasSexualAssault) && (
                <div className={hasMentalHealth ? "border-t border-border pt-4" : ""}>
                  <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">
                    Domestic Violence & Sexual Assault
                    {userState && stateServices?.domesticViolence && (
                      <span className="text-muted-foreground/60 ml-2 normal-case">({userState} services available)</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
                    {userState && stateServices?.domesticViolence && stateServices.domesticViolence.map((service: any, idx: number) => (
                      <a key={idx} href={service.url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                        {service.name}{service.phone && <span className="ml-1 font-semibold text-foreground tabular-nums">{service.phone}</span>}
                      </a>
                    ))}
                    <a href="https://www.1800respect.org.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                      1800RESPECT <span className="ml-1 font-semibold text-foreground tabular-nums">1800 737 732</span>
                    </a>
                    <a href="https://www.dvconnect.org/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                      DVConnect <span className="ml-1 font-semibold text-foreground tabular-nums">1800 811 811</span>
                    </a>
                    <a href="https://www.safesteps.org.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                      Safe Steps <span className="ml-1 font-semibold text-foreground tabular-nums">1800 015 188</span>
                    </a>
                  </div>
                </div>
              )}

              {/* LGBTIQA+ Support Resources */}
              {hasLGBTIQAIssues && (
                <div className={(hasMentalHealth || hasAbuseOrViolence || hasSexualAssault) ? "border-t border-border pt-4" : ""}>
                  <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">
                    LGBTIQA+ Support
                    {userState && stateServices?.lgbtqia && (
                      <span className="text-muted-foreground/60 ml-2 normal-case">({userState} services available)</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
                    {userState && stateServices?.lgbtqia && stateServices.lgbtqia.map((service: any, idx: number) => (
                      <a key={idx} href={service.url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                        {service.name}{service.phone && <span className="ml-1 font-semibold text-foreground tabular-nums">{service.phone}</span>}
                      </a>
                    ))}
                    <a href="https://qlife.org.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                      QLife <span className="ml-1 font-semibold text-foreground tabular-nums">1800 184 527</span>
                    </a>
                    <a href="https://www.minus18.org.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                      Minus18 <span className="ml-1 text-muted-foreground/80">Youth Support</span>
                    </a>
                    <a href="https://switchboard.org.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                      Switchboard <span className="ml-1 font-semibold text-foreground tabular-nums">1800 184 527</span>
                    </a>
                    <a href="https://www.transhub.org.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                      TransHub <span className="ml-1 text-muted-foreground/80">Resources</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Substance Use / Addiction Support */}
              {hasSubstanceUse && (
                <div className={(hasMentalHealth || hasAbuseOrViolence || hasSexualAssault || hasLGBTIQAIssues) ? "border-t border-border pt-4" : ""}>
                  <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">
                    Substance Use & Addiction
                    {userState && stateServices?.substanceUse && (
                      <span className="text-muted-foreground/60 ml-2 normal-case">({userState} services available)</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
                    {userState && stateServices?.substanceUse && stateServices.substanceUse.map((service: any, idx: number) => (
                      <a key={idx} href={service.url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                        {service.name}{service.phone && <span className="ml-1 font-semibold text-foreground tabular-nums">{service.phone}</span>}
                      </a>
                    ))}
                    <a href="https://adf.org.au/help-support/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                      Alcohol & Drug Foundation <span className="ml-1 font-semibold text-foreground tabular-nums">1300 85 85 84</span>
                    </a>
                    <a href="https://www.directline.org.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                      DirectLine <span className="ml-1 font-semibold text-foreground tabular-nums">1800 888 236</span>
                    </a>
                    <a href="https://www.counsellingonline.org.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                      Counselling Online <span className="ml-1 text-muted-foreground/80">24/7 Support</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Grief & Bereavement Support */}
              {hasGrief && (
                <div className={(hasMentalHealth || hasAbuseOrViolence || hasSexualAssault || hasLGBTIQAIssues || hasSubstanceUse) ? "border-t border-border pt-4" : ""}>
                  <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Grief & Bereavement</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
                    <a href="https://www.griefline.org.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                      GriefLine <span className="ml-1 font-semibold text-foreground tabular-nums">1300 845 745</span>
                    </a>
                    <a href="https://www.grief.org.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                      Australian Centre for Grief <span className="ml-1 font-semibold text-foreground tabular-nums">1800 642 066</span>
                    </a>
                    <a href="https://www.lifeline.org.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                      Lifeline <span className="ml-1 font-semibold text-foreground tabular-nums">13 11 14</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Bullying Support */}
              {hasBullying && (
                <div className={(hasMentalHealth || hasAbuseOrViolence || hasSexualAssault || hasLGBTIQAIssues || hasSubstanceUse || hasGrief) ? "border-t border-border pt-4" : ""}>
                  <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Bullying Support</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
                    <a href="https://kidshelpline.com.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                      Kids Helpline <span className="ml-1 font-semibold text-foreground tabular-nums">1800 55 1800</span>
                    </a>
                    <a href="https://www.esafety.gov.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                      eSafety <span className="ml-1 text-muted-foreground/80">Online Safety</span>
                    </a>
                    <a href="https://bullyingnoway.gov.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                      Bullying No Way <span className="ml-1 text-muted-foreground/80">Resources</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Racism & Discrimination Support */}
              {hasRacism && (
                <div className={(hasMentalHealth || hasAbuseOrViolence || hasSexualAssault || hasLGBTIQAIssues || hasSubstanceUse || hasGrief || hasBullying) ? "border-t border-border pt-4" : ""}>
                  <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Racism & Discrimination</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
                    <a href="https://humanrights.gov.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                      Australian Human Rights <span className="ml-1 font-semibold text-foreground tabular-nums">1300 656 419</span>
                    </a>
                    <a href="https://www.lifeline.org.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                      Lifeline <span className="ml-1 font-semibold text-foreground tabular-nums">13 11 14</span>
                    </a>
                    <a href="https://www.beyondblue.org.au/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline focus-visible:underline py-2.5 -my-2.5 px-1 -mx-1 rounded min-h-[44px] inline-flex items-center transition-colors">
                      Beyond Blue <span className="ml-1 font-semibold text-foreground tabular-nums">1300 22 4636</span>
                    </a>
                  </div>
              </div>
              )}

              {/* General Support Note */}
              <p className="text-xs text-muted-foreground mt-4">
                All services are available 24/7. In an emergency, <strong className="text-foreground">call 000</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Author's own content warnings page (shown first: author above AI) */}
      {authorContentWarningsUrl && authorContentWarningsUrl.trim() !== "" && (
        <section>
          <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-500">
            <CheckCircle className="h-4 w-4" />
            <h3 className="font-semibold text-sm uppercase tracking-wide">Author&apos;s content warnings</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            The author provides their own content warnings for this book (may contain spoilers).
          </p>
          {authorContentWarningsList && authorContentWarningsList.length > 0 ? (
            <Collapsible open={authorListOpen} onOpenChange={setAuthorListOpen} className="space-y-2">
              <CollapsibleTrigger className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-1 -mx-1">
                Show list ({authorContentWarningsList.length} items; may contain spoilers)
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", authorListOpen && "rotate-180")} aria-hidden />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="list-disc pl-5 space-y-1.5 text-sm text-foreground mt-3 mb-3">
                  {authorContentWarningsList.map((item, i) => (
                    <li key={i}>
                      {showSpoilerTags ? <SpoilerText text={item} /> : item}
                    </li>
                  ))}
                </ul>
                <a
                  href={authorContentWarningsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Source: author&apos;s page
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <a
              href={authorContentWarningsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              View author&apos;s content warnings
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
        </section>
      )}

      {/* Official Author/Publisher Warnings (Gold Standard) */}
      {officialVerifiedWarnings.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-500">
            <CheckCircle className="h-4 w-4" />
            <h3 className="font-semibold text-sm uppercase tracking-wide">Official Author Notes</h3>
          </div>

          <div className="space-y-0">
            {officialVerifiedWarnings.map((warning) => (
              <WarningItem key={warning.id} warning={warning} isVerified={true} showReasoningInWarnings={showReasoning} />
            ))}
          </div>
        </section>
      )}

      {/* Automated / system-generated warnings — always show section in cards (sandbox) variant */}
      {(standardAiWarnings.length > 0 || effectiveDisplayVariant === 'cards') && (
        <section id="detailed-content-warnings" aria-labelledby="detailed-content-warnings-heading">
          <div className="flex items-center gap-2 mb-4 text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <h3 id="detailed-content-warnings-heading" className="font-semibold text-sm uppercase tracking-wide">Detailed content warnings</h3>
          </div>

          {effectiveDisplayVariant === 'cards' ? (
            <div className="space-y-3">
              {standardAiWarnings.length > 0 ? (
                (() => {
                  const groups = groupWarningsByCategory(standardAiWarnings)
                  return groups.map((group) => {
                    const maxSeverity = group.warnings.some((w) => (w.severity ?? '').toString().toLowerCase() === 'severe')
                      ? 'severe'
                      : group.warnings.some((w) => (w.severity ?? '').toString().toLowerCase() === 'moderate')
                        ? 'moderate'
                        : 'mild'
                    const severityBorder =
                      maxSeverity === 'severe'
                        ? 'border-l-red-500'
                        : maxSeverity === 'moderate'
                          ? 'border-l-orange-500'
                          : 'border-l-amber-500'
                    const severityBg =
                      maxSeverity === 'severe'
                        ? 'bg-red-500/5 dark:bg-red-500/10'
                        : maxSeverity === 'moderate'
                          ? 'bg-orange-500/5 dark:bg-orange-500/10'
                          : 'bg-amber-500/5 dark:bg-amber-500/10'
                    return (
                      <Collapsible key={group.category} className="group/parent">
                        <CollapsibleTrigger
                          className={cn(
                            "w-full flex items-center gap-3 rounded-tr-lg border border-border border-l-4 px-4 py-3.5 text-left transition-colors",
                            severityBorder,
                            "cursor-pointer list-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            "bg-muted/30 hover:bg-muted/50 dark:bg-muted/20 dark:hover:bg-muted/40",
                            severityBg
                          )}
                        >
                          <CategoryIcon id={group.category} legacyCategory={group.category} className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="flex-1 text-sm font-medium text-foreground">
                            <TagWithTooltip label={group.categoryLabel} className="inline-flex" showIcon={true} />
                          </span>
                          <Badge variant="secondary" className="text-xs font-normal shrink-0">
                            {group.warnings.length}
                          </Badge>
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 group-data-[state=open]/parent:rotate-180" aria-hidden />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="bg-muted/10 dark:bg-muted/5 pt-2 pb-3 px-3 space-y-2">
                            {group.warnings.map((warning) => (
                              <WarningDisclosure key={warning.id} warning={warning} isAi showReasoningInWarnings={showReasoning} />
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )
                  })
                })()
              ) : (
                <p className="text-sm text-muted-foreground py-2">No automated warnings for this book.</p>
              )}
            </div>
          ) : (
            standardAiWarnings.length > 0 && (
              <div className="space-y-2">
                {groupWarningsByCategory(standardAiWarnings).map((group) => (
                  <Collapsible 
                    key={group.category} 
                    open={openCategories[group.category] || false}
                    onOpenChange={(isOpen) => setOpenCategories(prev => ({ ...prev, [group.category]: isOpen }))}
                  >
                    <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-muted/5 hover:bg-muted/40 transition-colors text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <div className="flex items-center gap-3">
                        <CategoryIcon
                          id={group.category}
                          legacyCategory={group.category}
                          className="h-4 w-4 text-muted-foreground"
                        />
                        <span className="font-medium text-sm">{group.categoryLabel}</span>
                        <Badge variant="secondary" className="text-xs">
                          {group.warnings.length}
                        </Badge>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="min-w-0">
                      <div className="space-y-0 border-t border-border/80 mt-2 pt-3">
                        {group.warnings.map((warning) => (
                          <WarningItem key={warning.id} warning={warning} isAi={true} showReasoningInWarnings={showReasoning} />
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            )
          )}
        </section>
      )}

      {/* Community Submitted Warnings */}
      {communityWarnings.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4 text-muted-foreground">
            <Shield className="h-4 w-4" />
            <h3 className="font-semibold text-sm uppercase tracking-wide">Community Reports</h3>
          </div>

          {effectiveDisplayVariant === 'cards' ? (
            <div className="space-y-1">
              {communityWarnings.map((warning) => (
                <WarningDisclosure key={warning.id} warning={warning} showReasoningInWarnings={showReasoning} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {groupWarningsByCategory(communityWarnings).map((group) => (
                <Collapsible 
                  key={group.category} 
                  open={openCategories[group.category] || false}
                  onOpenChange={(isOpen) => setOpenCategories(prev => ({ ...prev, [group.category]: isOpen }))}
                >
                  <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-muted/5 hover:bg-muted/40 transition-colors text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <div className="flex items-center gap-3">
                      <CategoryIcon
                        id={group.category}
                        legacyCategory={group.category}
                        className="h-4 w-4 text-muted-foreground"
                      />
                      <span className="font-medium text-sm">{group.categoryLabel}</span>
                      <Badge variant="secondary" className="text-xs">
                        {group.warnings.length}
                      </Badge>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="min-w-0">
                    <div className="space-y-0 border-t border-border/80 mt-2 pt-3">
                      {group.warnings.map((warning) => (
                        <WarningItem key={warning.id} warning={warning} showReasoningInWarnings={showReasoning} />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Disclaimer (hidden in lite) */}
      {showReasoning && (
      <div className="mt-12 pt-8 border-t border-border">
        <p className="text-[10px] text-muted-foreground leading-relaxed text-center italic max-w-xl mx-auto">
          All warnings include source citations and reasoning for transparency. Author-provided warnings are prioritized and shown first. Severity is subjective—varying by individual sensitivity—so use your own judgment.
        </p>
      </div>
      )}
      </div>
    </TooltipProvider>
  )
}

/**
 * Disclosure layout for displayVariant="cards" (sandbox). Approved design: one row per warning.
 * Row = severity-colored left bar (red/orange/amber) + category icon + category name + chevron.
 * Do not add "Content warning: … — Severity" or a horizontal dash line; keep icon + category only.
 * Expand opens: description, Why?, thumbs. See docs/SANDBOX_BOOK_PAGE_CONTENT.md.
 */
function WarningDisclosure({ warning, isAi = false, showReasoningInWarnings = true }: { warning: ContentWarning; isAi?: boolean; showReasoningInWarnings?: boolean }) {
  const [isRevealed, setIsRevealed] = useState(false)
  const isSpoiler = warning.is_spoiler === true

  let categoryLabel: string
  let subcategoryLabel: string | null = null
  try {
    categoryLabel = (warning.category_id ? getCategoryById(warning.category_id)?.userLabel : null) || categoryLabels[warning.category] || warning.category || "Unknown"
    if (warning.category_id && warning.subcategory_id) {
      subcategoryLabel = getSubcategoryById(warning.category_id, warning.subcategory_id)?.userLabel ?? null
    }
  } catch {
    categoryLabel = categoryLabels[warning.category] || warning.category || "Unknown"
  }

  const severity = (warning.severity ?? "mild").toString().toLowerCase() as "mild" | "moderate" | "severe"
  const severityLabel = severity === "severe" ? "Severe" : severity === "moderate" ? "Moderate" : "Mild"
  const descriptionText = (() => {
    const phrase = getWarningPhrase(warning.category_id)
    if (warning.description.match(/^(Contains|Includes|Explores|Features|Addresses|Touches)/i)) return warning.description
    return `${phrase.replace("…", "")} ${warning.description.toLowerCase()}`
  })()

  const severityBorder =
    severity === "severe"
      ? "border-l-red-500"
      : severity === "moderate"
        ? "border-l-orange-500"
        : "border-l-amber-500"
  const severityBg =
    severity === "severe"
      ? "bg-red-500/5 dark:bg-red-500/10"
      : severity === "moderate"
        ? "bg-orange-500/5 dark:bg-orange-500/10"
        : "bg-amber-500/5 dark:bg-amber-500/10"

  return (
    <Collapsible className="group">
      <CollapsibleTrigger
        className={cn(
          "w-full flex items-center gap-3 rounded-tr-lg border border-border border-l-4 px-4 py-3.5 text-left transition-colors",
          severityBorder,
          "cursor-pointer list-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "bg-muted/30 hover:bg-muted/50 dark:bg-muted/20 dark:hover:bg-muted/40",
          severityBg
        )}
      >
        {/* E-style: severity-colored bar + icon + category/subcategory (with definition tooltip) + chevron */}
        <CategoryIcon id={warning.category_id} legacyCategory={warning.category} className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="flex-1 text-sm font-medium text-foreground min-w-0">
          {subcategoryLabel ? (
            <>
              <span className="text-muted-foreground">{categoryLabel}</span>
              <span className="mx-1.5 text-muted-foreground/70" aria-hidden>—</span>
              <TagWithTooltip label={subcategoryLabel} className="inline-flex" showIcon={true} />
            </>
          ) : (
            <TagWithTooltip label={categoryLabel} className="inline-flex" showIcon={true} />
          )}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className={cn("rounded-br-lg border-x border-b border-border border-l-4 px-4 py-4 space-y-3", severityBorder, "bg-muted/20 dark:bg-muted/10")}>
          {isSpoiler && !isRevealed ? (
            <div className="rounded-md bg-muted/50 border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground mb-2">This warning contains spoilers.</p>
              <button type="button" onClick={() => setIsRevealed(true)} className="text-xs text-primary hover:underline font-medium">
                Reveal
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground font-serif leading-relaxed">{descriptionText}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {showReasoningInWarnings && warning.reasoning && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 px-2">
                    <Info className="h-3 w-3 mr-1" /> Why?
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="max-w-xs p-4 text-xs">
                  <p>{warning.reasoning}</p>
                </PopoverContent>
              </Popover>
            )}
            <ThumbsButtons
              warningId={warning.id}
              helpfulCount={warning.helpful_count}
              notHelpfulCount={warning.not_helpful_count}
              userValidation={warning.user_validation}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function WarningItem({ warning, isAi = false, isVerified = false, showReasoningInWarnings = true }: { warning: ContentWarning, isAi?: boolean, isVerified?: boolean, showReasoningInWarnings?: boolean }) {
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
        "group py-7 border-b border-border/70 last:border-0 transition-colors scroll-mt-20",
        isVerified ? "hover:border-amber-200 dark:hover:border-amber-800" : "hover:border-border"
      )}
    >
      <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-8">

        {/* Left: Icon & Category */}
        <div className="md:w-1/3 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              "p-1 rounded-full",
              warning.severity === "severe" && "bg-red-50 text-red-600",
              warning.severity === "moderate" && "bg-orange-50 text-orange-600",
              warning.severity === "mild" && "bg-yellow-50 text-yellow-600"
            )}>
              <CategoryIcon
                id={warning.category_id}
                legacyCategory={warning.category}
                className="h-3.5 w-3.5"
              />
            </div>
            <div className="flex flex-col gap-1">
              <TagWithTooltip 
                label={categoryLabel} 
                className="font-semibold text-foreground text-sm uppercase tracking-wide" 
              />
              {subcategoryLabel && (
                <TagWithTooltip 
                  label={subcategoryLabel} 
                  className="text-xs text-muted-foreground font-medium" 
                />
              )}
              <span className={cn(
                "text-xs",
                warning.severity === "severe" && "text-red-600 dark:text-red-500",
                warning.severity === "moderate" && "text-orange-600 dark:text-orange-500",
                warning.severity === "mild" && "text-yellow-600 dark:text-yellow-500"
              )}>
                {warning.severity === "severe" ? "Severe" : warning.severity === "moderate" ? "Moderate" : "Mild"}
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
        </div>

        {/* Right: Description & Actions */}
        <div className="flex-1 min-w-0">
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
          
          <div className="mb-4">
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
                {(() => {
                  const phrase = getWarningPhrase(warning.category_id)
                  // If description already starts with a phrase-like pattern, use it as-is
                  if (warning.description.match(/^(Contains|Includes|Explores|Features|Addresses|Touches)/i)) {
                    return warning.description
                  }
                  // Otherwise, prepend the rotated phrase
                  const cleanPhrase = phrase.replace('…', '')
                  return `${cleanPhrase} ${warning.description.toLowerCase()}`
                })()}
              </p>
            )}
          </div>

          {/* On mobile there is no hover, so keep actions fully visible. */}
          <div className="flex flex-wrap items-center gap-4 transition-opacity md:opacity-40 md:group-hover:opacity-100">
            {/* Dev Mode: Show which model generated this warning (localhost only) */}
            {typeof window !== 'undefined' && window.location.hostname === 'localhost' && warning.evidence && warning.evidence[0]?.model_source && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] font-mono uppercase tracking-wider",
                  warning.evidence[0].model_source === 'openai' && "border-blue-500/50 text-blue-600 dark:text-blue-400",
                  warning.evidence[0].model_source === 'gemini' && "border-purple-500/50 text-purple-600 dark:text-purple-400",
                  warning.evidence[0].model_source === 'both' && "border-green-500/50 text-green-600 dark:text-green-400"
                )}
                title={`Generated by: ${
                  warning.evidence[0].model_source === 'both'
                    ? 'Cross-checked by multiple models'
                    : 'Automated analysis'
                }`}
              >
                {warning.evidence[0].model_source === 'both'
                  ? 'X'
                  : warning.evidence[0].model_source === 'openai'
                    ? 'P'
                    : 'S'}
              </Badge>
            )}

            {showReasoningInWarnings && (() => {
              const c = getCombinedConfidence(warning)
              return (
                <Popover>
                  <PopoverTrigger asChild>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] font-medium uppercase tracking-wider cursor-default", c.color)}
                      title="Confidence is based on automated verification and community feedback"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      {c.level}
                    </Badge>
                  </PopoverTrigger>
                  <PopoverContent className="max-w-xs p-4 text-xs bg-popover border border-border shadow-xl text-popover-foreground">
                    <div className="space-y-2">
                      <div className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                        Confidence signal
                      </div>
                      <div className="text-sm font-medium text-foreground">
                        {c.level} confidence
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Verification: {c.crossChecked ? 'Verified by multiple checks' : 'Single analysis'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Community feedback: {c.votes === 0 ? 'No votes yet' : `${c.helpful} helpful • ${c.notHelpful} not helpful (${c.votes} total)`}
                      </div>
                      <div className="text-[10px] text-muted-foreground leading-relaxed">
                        Confidence is based on automated verification and community feedback. It is not a guarantee and can change as more people vote.
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )
            })()}
            
            <ThumbsButtons
              warningId={warning.id}
              helpfulCount={warning.helpful_count}
              notHelpfulCount={warning.not_helpful_count}
              userValidation={warning.user_validation}
            />

            {/* Reasoning / Sources (hidden in lite) */}
            {showReasoningInWarnings && (
              <Popover>
                <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 px-2"
                >
                  <Info className="h-3 w-3 mr-1" /> {warning.reasoning ? 'Why?' : warning.source_url ? 'Details' : 'Why?'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="max-w-xs p-4 text-xs bg-popover border border-border shadow-xl text-popover-foreground">
                  {warning.reasoning && (
                    <>
                      <p className="font-bold text-foreground mb-1 uppercase tracking-wider text-[10px]">
                        {isAi ? 'Reasoning' : 'Justification'}
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
                  <div className="space-y-2">
                    <p className="text-muted-foreground italic">No details available for this warning yet.</p>
                    <p className="text-[10px] text-muted-foreground">
                      If this seems inaccurate, use the thumbs feedback (or “Found an error? Report this book.”) to help improve results.
                    </p>
                  </div>
                  )}
                </PopoverContent>
              </Popover>
            )}

            {/* Fallback: Show source link if no reasoning popover (hidden in lite) */}
            {showReasoningInWarnings && !warning.reasoning && warning.source_url && (
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
