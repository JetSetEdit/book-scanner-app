"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Info, Calculator } from "lucide-react"
import { calculateSeverityScore, getSeverityLevelFromScore, CATEGORY_WEIGHTS as CATEGORY_WEIGHTS_EXPORT, SEVERITY_POINTS as SEVERITY_POINTS_EXPORT } from "@/lib/utils/severity-scoring"
import type { ContentWarning } from "@/lib/utils/severity-scoring"

interface SeverityScoreBadgeProps {
  warnings: ContentWarning[]
  bookTitle: string
}


export function SeverityScoreBadge({ warnings, bookTitle }: SeverityScoreBadgeProps) {
  const [showScore, setShowScore] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const handleDevSettingsChange = (event: CustomEvent) => {
      setShowScore(event.detail.showSeverityScore || false)
    }
    
    // Check initial state
    const saved = localStorage.getItem('dev-show-severity-score')
    setShowScore(saved === 'true')
    
    window.addEventListener('dev-settings-changed', handleDevSettingsChange as EventListener)
    return () => {
      window.removeEventListener('dev-settings-changed', handleDevSettingsChange as EventListener)
    }
  }, [])

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted || !showScore) return null

  const score = calculateSeverityScore(warnings)
  const level = getSeverityLevelFromScore(score)
  
  const summary = {
    severe: warnings.filter(w => w.severity === 'severe').length,
    moderate: warnings.filter(w => w.severity === 'moderate').length,
    mild: warnings.filter(w => w.severity === 'mild').length,
  }

  // Calculate breakdown using improved algorithm
  // Get numeric scores for all warnings
  const getWarningScore = (w: ContentWarning): number => {
    if (w.confidence_score != null && w.confidence_score >= 0 && w.confidence_score <= 1) {
      return w.confidence_score
    }
    // Estimate from severity
    const severityScores = { mild: 0.45, moderate: 0.68, severe: 0.90 }
    let baseScore = severityScores[w.severity]
    // Adjust for detail level
    if (w.detail_level === 'graphic') baseScore = Math.min(baseScore + 0.15, 1.0)
    else if (w.detail_level === 'moderate') baseScore = Math.min(baseScore + 0.05, 1.0)
    else if (w.detail_level === 'vague') baseScore = Math.max(baseScore - 0.1, 0.0)
    else if (w.detail_level === 'clinical') baseScore = Math.max(baseScore - 0.05, 0.0)
    // Adjust for presence
    if (w.presence === 'on_page') baseScore = Math.min(baseScore + 0.1, 1.0)
    else if (w.presence === 'off_page') baseScore = Math.max(baseScore - 0.1, 0.0)
    else if (w.presence === 'flashback') baseScore = Math.min(baseScore + 0.05, 1.0)
    else if (w.presence === 'referenced') baseScore = Math.max(baseScore - 0.15, 0.0)
    else if (w.presence === 'implied') baseScore = Math.max(baseScore - 0.1, 0.0)
    return Math.max(0.0, Math.min(1.0, baseScore))
  }

  const warningScores = warnings.map(w => ({
    warning: w,
    score: getWarningScore(w),
    category: w.category_id || w.category || 'other'
  }))

  // Primary score: Linear mapping of highest score
  const maxScore = Math.max(...warningScores.map(ws => ws.score))
  const scores = warningScores.map(ws => ws.score).sort((a, b) => b - a)
  const isOutlier = scores.length > 1 && scores[0] - scores[1] > 0.3
  const effectiveMaxScore = isOutlier ? (scores[0] * 0.7 + scores[1] * 0.3) : maxScore
  const primaryScore = effectiveMaxScore * 100

  // Weighted sum with logarithmic normalization
  let weightedSum = 0
  const breakdown = warningScores.map(({ warning, score: warningScore, category }) => {
    const categoryWeight = CATEGORY_WEIGHTS_EXPORT[category] || 1.0
    const contribution = warningScore * categoryWeight
    weightedSum += contribution
    return {
      warning,
      score: warningScore,
      categoryWeight,
      contribution,
    }
  })

  const maxPossibleSum = 10 * 1.5
  const logNormalized = Math.log(1 + weightedSum) / Math.log(1 + maxPossibleSum) * 50
  const normalizedWeightedSum = Math.min(logNormalized, 50)
  const finalScore = primaryScore + normalizedWeightedSum

  const getScoreColor = () => {
    if (level === 'severe') return 'bg-red-100 text-red-700 border-red-300'
    if (level === 'moderate') return 'bg-orange-100 text-orange-700 border-orange-300'
    if (level === 'mild') return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    return 'bg-slate-100 text-slate-700 border-slate-300'
  }

  return (
    <div 
      onClick={(e) => e.stopPropagation()} 
      onMouseDown={(e) => e.stopPropagation()}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Badge 
            variant="outline" 
            className={`cursor-pointer text-xs font-mono ${getScoreColor()} hover:opacity-80 transition-opacity`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            <Calculator className="h-3 w-3 mr-1" />
            Score: {score.toFixed(1)}
          </Badge>
        </PopoverTrigger>
        <PopoverContent 
          className="w-96" 
          align="start" 
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-1">Severity Score Breakdown</h4>
            <p className="text-xs text-muted-foreground mb-3">{bookTitle}</p>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                <span className="font-medium">Primary Score (Linear Mapping):</span>
                <span className="font-mono font-bold">{primaryScore.toFixed(1)}</span>
                {isOutlier && (
                  <span className="text-xs text-muted-foreground ml-2">(outlier adjusted)</span>
                )}
              </div>
              
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground mb-1">Warning Breakdown:</div>
                {breakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-1.5 bg-slate-50 rounded text-xs">
                    <div className="flex-1">
                      <div className="font-medium capitalize">{item.warning.severity}</div>
                      <div className="text-muted-foreground text-[10px]">
                        {item.warning.category_id || item.warning.category || 'unknown'}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div>{item.score.toFixed(2)} × {item.categoryWeight.toFixed(1)} = {item.contribution.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                <span className="font-medium">Weighted Sum:</span>
                <span className="font-mono">{weightedSum.toFixed(1)}</span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                <span className="font-medium">Normalized (Logarithmic):</span>
                <span className="font-mono">{normalizedWeightedSum.toFixed(1)}</span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-primary/10 rounded border-2 border-primary">
                <span className="font-bold">Final Score:</span>
                <span className="font-mono font-bold text-lg">{finalScore.toFixed(1)}</span>
              </div>
              
              <div className="pt-2 border-t text-[10px] text-muted-foreground">
                <div>Summary: {summary.severe} severe, {summary.moderate} moderate, {summary.mild} mild</div>
                <div>Level: <span className="font-medium capitalize">{level}</span></div>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
      </Popover>
    </div>
  )
}
