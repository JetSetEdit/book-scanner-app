#!/usr/bin/env tsx
/**
 * Diagnostic: Age Rating Impact Analysis
 * 
 * Shows top 5 impacts per book with full breakdown to identify bottlenecks
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { Database } from '../types/supabase'
import { calculateAgeRating } from '../lib/utils/age-rating'
import { EnhancedContentWarning } from '../lib/config/taxonomy-context'
import { getEscalationWeight } from '../lib/config/age-escalation-weights'
import { getCategoryFromSubcategory } from '../lib/utils/get-category-from-subcategory'

// Load .env.local
const envPaths = [
  path.join(__dirname, '..', '.env.local'),
  path.join(process.cwd(), '.env.local'),
  '.env.local'
]

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
    break
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseKey)

/**
 * Recompute raw numeric severity score (0-1) from severity_signals
 */
function getRawSeverityScore(warning: EnhancedContentWarning): number {
  const signals = warning.severity_signals
  if (!signals) {
    // Fallback to bucket if signals missing
    return warning.severity === 'severe' ? 0.85 : 
           warning.severity === 'moderate' ? 0.55 : 0.35
  }
  
  // Recompute using same formula as computeSeverityFromSignals
  const baseScore = (signals.frequency * 0.3) + (signals.explicitness * 0.4)
  const proximityMultiplier = 1 + (signals.proximity * 0.2)
  const centralityMultiplier = 1 + (signals.centrality * 0.2)
  const intensityBonus = Math.min(signals.intensity_markers.length * 0.1, 0.3)
  
  const finalScore = (baseScore * proximityMultiplier * centralityMultiplier) + intensityBonus
  return Math.min(finalScore, 1.0)
}

/**
 * Get presentation multiplier (same as in age-rating.ts)
 */
function getPresentationMultiplier(warning: EnhancedContentWarning): number {
  const explicitness = warning.severity_signals?.explicitness ?? 0.5
  const detailLevelMult = 
    explicitness >= 0.8 ? 1.15 :  // graphic
    explicitness >= 0.5 ? 1.00 :  // moderate
    explicitness >= 0.3 ? 0.90 :  // vague/clinical
    0.85                            // very vague
  
  const proximity = warning.severity_signals?.proximity ?? 0.5
  const presenceMult =
    proximity >= 0.9 ? 1.10 :  // on_page
    proximity >= 0.6 ? 1.00 :  // flashback
    proximity >= 0.4 ? 0.95 :  // off_page
    proximity >= 0.25 ? 0.90 :  // referenced
    0.85                         // implied
  
  return detailLevelMult * presenceMult
}

/**
 * Get presence label from proximity
 */
function getPresenceLabel(proximity: number): string {
  if (proximity >= 0.9) return 'on-page'
  if (proximity >= 0.6) return 'flashback'
  if (proximity >= 0.4) return 'off-page'
  if (proximity >= 0.25) return 'referenced'
  return 'implied'
}

/**
 * Get detail label from explicitness
 */
function getDetailLabel(explicitness: number): string {
  if (explicitness >= 0.8) return 'graphic'
  if (explicitness >= 0.5) return 'moderate'
  if (explicitness >= 0.3) return 'vague'
  return 'very vague'
}

async function diagnoseBook(isbn: string) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`📚 DIAGNOSING: ${isbn}`)
  console.log('='.repeat(80))
  
  // Get book
  const { data: book, error: bookError } = await supabaseAdmin
    .from('books')
    .select('id, title, author, isbn, categories')
    .eq('isbn', isbn)
    .single()

  if (bookError || !book) {
    console.error(`   ❌ Book not found`)
    return null
  }

  console.log(`   Title: ${book.title}`)
  console.log(`   Author: ${book.author}`)

  // Get warnings with severity_signals
  const { data: warnings, error: warningsError } = await supabaseAdmin
    .from('content_warnings')
    .select('subcategory_id, severity, description, category, category_id, severity_signals, context_modifiers, evidence, taxonomy_version, is_spoiler, reasoning')
    .eq('book_id', book.id)

  if (warningsError) {
    console.error(`   ❌ Error fetching warnings:`, warningsError)
    return null
  }
  
  if (!warnings || warnings.length === 0) {
    console.log(`   ⚠️  No warnings found`)
    return null
  }

  // Get current rating
  const currentRating = book.categories?.find((c: string) => 
    c.startsWith('CLASSIFICATION:')
  )?.replace('CLASSIFICATION:', '') || 'Unknown'

  console.log(`   Current Rating: ${currentRating}`)

  // Convert to EnhancedContentWarning format
  const enhancedWarnings: EnhancedContentWarning[] = warnings.map(w => ({
    subcategory_id: w.subcategory_id || undefined,
    severity: w.severity as 'mild' | 'moderate' | 'severe',
    modifiers: (w.context_modifiers || []) as any[],
    evidence: (w.evidence || []) as any[],
    severity_signals: (w.severity_signals as any) || {
      frequency: 0.5,
      explicitness: 0.5,
      proximity: 0.5,
      centrality: 0.5,
      intensity_markers: []
    },
    taxonomy_version: w.taxonomy_version || '2.5.0',
    is_spoiler: w.is_spoiler || false,
    description: w.description,
    reasoning: w.reasoning || undefined
  }))

  // Calculate impact for each warning (moderate+severe)
  const warningImpacts = enhancedWarnings
    .filter(w => w.severity === 'severe' || w.severity === 'moderate')
    .map(w => {
      // Get category from subcategory using taxonomy lookup
      const categoryId = getCategoryFromSubcategory(w.subcategory_id)
      const subcategoryId = w.subcategory_id
      
      const escalationWeight = getEscalationWeight(categoryId, subcategoryId)
      const presentationMult = getPresentationMultiplier(w)
      const rawSeverityScore = getRawSeverityScore(w)
      
      // Calculate impact with RAW severity score
      const impact = rawSeverityScore * escalationWeight * presentationMult
      
      return {
        warning: w,
        impact,
        categoryId,
        subcategoryId,
        escalationWeight,
        presentationMult,
        rawSeverityScore,
        severityBucket: w.severity
      }
    })

  // Get max impact
  const maxImpact = warningImpacts.length > 0 
    ? Math.max(...warningImpacts.map(w => w.impact), 0)
    : 0
  const topWarning = warningImpacts.find(w => w.impact === maxImpact)
  
  // Debug: Check explicit flag for sexual content warnings
  const sexualWarnings = enhancedWarnings.filter(w => {
    const cat = getCategoryFromSubcategory(w.subcategory_id)
    return cat === 'sexual_content'
  })
  if (sexualWarnings.length > 0) {
    console.log(`\n   🔍 EXPLICIT FLAG CHECK:`)
    sexualWarnings.forEach(w => {
      const signals = w.severity_signals
      const proximity = signals?.proximity ?? 0.5
      const explicitness = signals?.explicitness ?? 0.5
      const frequency = signals?.frequency ?? 0.5
      const isExplicit = proximity >= 0.9 && explicitness >= 0.6 && frequency >= 0.5
      console.log(`      ${w.subcategory_id}: proximity=${proximity.toFixed(2)}, explicitness=${explicitness.toFixed(2)}, frequency=${frequency.toFixed(2)} → explicit=${isExplicit}`)
    })
  }

  // Calculate new rating
  const newRating = calculateAgeRating(enhancedWarnings)

  console.log(`\n   📊 RATING ANALYSIS`)
  console.log(`   Current: ${currentRating}`)
  console.log(`   New: ${newRating.rating}`)
  console.log(`   Max Impact: ${maxImpact.toFixed(3)}`)
  console.log(`   Reasoning: ${newRating.reasoning}`)

  // --fix: persist recalculated rating to DB
  const shouldFix = process.argv.includes('--fix')
  if (shouldFix && newRating.rating !== currentRating) {
    const currentCategories = (book.categories as string[]) || []
    const categoriesWithoutRating = currentCategories.filter((c: string) => !c.startsWith('CLASSIFICATION:'))
    const updatedCategories = [...categoriesWithoutRating, `CLASSIFICATION:${newRating.rating}`]
    const { error: updateError } = await supabaseAdmin
      .from('books')
      .update({ categories: updatedCategories })
      .eq('id', book.id)
    if (updateError) {
      console.error(`\n   ❌ Failed to update rating:`, updateError)
    } else {
      console.log(`\n   ✅ Updated stored rating: ${currentRating} → ${newRating.rating}`)
    }
  } else if (shouldFix && newRating.rating === currentRating) {
    console.log(`\n   (No change: stored rating already ${currentRating})`)
  }

  // Show top 5 impacts
  const top5 = warningImpacts
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 5)

  console.log(`\n   🔝 TOP 5 IMPACTS:`)
  console.log(`   ${'-'.repeat(78)}`)
  top5.forEach((w, idx) => {
    const signals = w.warning.severity_signals
    const proximity = signals?.proximity ?? 0.5
    const explicitness = signals?.explicitness ?? 0.5
    
    console.log(`\n   ${idx + 1}. ${w.subcategoryId || 'unknown'}`)
    console.log(`      Severity: ${w.severityBucket} (raw: ${w.rawSeverityScore.toFixed(3)})`)
    console.log(`      Escalation: ${w.escalationWeight.toFixed(2)}`)
    console.log(`      Presentation: ${w.presentationMult.toFixed(3)} (${getDetailLabel(explicitness)} detail, ${getPresenceLabel(proximity)})`)
    console.log(`      Impact: ${w.impact.toFixed(3)} = ${w.rawSeverityScore.toFixed(3)} × ${w.escalationWeight.toFixed(2)} × ${w.presentationMult.toFixed(3)}`)
  })

  // Show if explicit sexual content is present
  const explicitSexWarnings = enhancedWarnings.filter(w => 
    w.subcategory_id?.includes('explicit_sexual_content')
  )
  const spiceWarnings = enhancedWarnings.filter(w => 
    w.subcategory_id?.includes('intense_romance_or_spice')
  )

  if (explicitSexWarnings.length > 0 || spiceWarnings.length > 0) {
    console.log(`\n   🔍 SEXUAL CONTENT CHECK:`)
    if (explicitSexWarnings.length > 0) {
      console.log(`      ✅ Explicit sexual content found: ${explicitSexWarnings.length} warning(s)`)
      explicitSexWarnings.forEach(w => {
        const impact = warningImpacts.find(wi => wi.warning === w)
        if (impact) {
          console.log(`         - ${w.subcategory_id}: impact ${impact.impact.toFixed(3)} (rank ${top5.findIndex(t => t.warning === w) + 1 || 'not in top 5'})`)
        }
      })
    }
    if (spiceWarnings.length > 0) {
      console.log(`      ✅ Intense romance/spice found: ${spiceWarnings.length} warning(s)`)
      spiceWarnings.forEach(w => {
        const impact = warningImpacts.find(wi => wi.warning === w)
        if (impact) {
          console.log(`         - ${w.subcategory_id}: impact ${impact.impact.toFixed(3)} (rank ${top5.findIndex(t => t.warning === w) + 1 || 'not in top 5'})`)
        }
      })
    }
  } else {
    console.log(`\n   ⚠️  No explicit sexual content or spice warnings found`)
  }

  return {
    isbn,
    title: book.title,
    currentRating,
    newRating: newRating.rating,
    maxImpact,
    top5: top5.map(w => ({
      subcategory: w.subcategoryId,
      severity: w.severityBucket,
      rawSeverityScore: w.rawSeverityScore,
      escalationWeight: w.escalationWeight,
      presentationMult: w.presentationMult,
      impact: w.impact
    }))
  }
}

async function main() {
  console.log('🔬 Age Rating Impact Diagnostic')
  console.log('='.repeat(80))

  const isbnArg = process.argv[2]
  const testBooks = isbnArg
    ? [isbnArg]
    : [
        '9780571334650', // Normal People
        '9781619634442', // A Court of Thorns and Roses (ACOTAR)
        '9781649374042', // Fourth Wing
        '9780439023481', // The Hunger Games
        '9780593336823', // The Love Hypothesis
        '9780062678416', // The Woman in the Window
      ]

  const results = []

  for (const isbn of testBooks) {
    const result = await diagnoseBook(isbn)
    if (result) {
      results.push(result)
    }
  }

  console.log(`\n${'='.repeat(80)}`)
  console.log('📋 SUMMARY')
  console.log('='.repeat(80))

  results.forEach(r => {
    console.log(`\n${r.title}`)
    console.log(`   Rating: ${r.currentRating} → ${r.newRating}`)
    console.log(`   Max Impact: ${r.maxImpact.toFixed(3)}`)
    console.log(`   Top Impact: ${r.top5[0]?.subcategory} (${r.top5[0]?.impact.toFixed(3)})`)
  })
}

main().catch(console.error)

