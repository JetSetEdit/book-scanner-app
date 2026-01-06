#!/usr/bin/env tsx
/**
 * Generate detailed report of GPT-5 model test outputs
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
dotenv.config({ path: '.env.local' })

const TEST_BOOK_ISBN = '9780571334650' // Normal People

const MODELS_TO_CHECK = [
  'gpt-5',
  'gpt-5-2025-08-07',
  'gpt-5.2',
  'gpt-5.2-2025-12-11',
  'gpt-5-mini',
  'gpt-5-mini-2025-08-07',
  'gpt-5.1',
  'gpt-5.1-2025-11-13',
]

interface WarningData {
  subcategory_id: string
  description: string
  severity: string
  presence: string
  detail_level: string
  evidence?: any[]
  severity_signals?: any
  created_at: string
}

interface ModelResults {
  model: string
  warnings: WarningData[]
  rating: string | null
  reasoning: string | null
  timestamp: string | null
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get the book
  const { data: books, error } = await supabase
    .from('books')
    .select('id, title, author, isbn, categories')
    .eq('isbn', TEST_BOOK_ISBN)
    .limit(1)
  
  if (error) {
    console.error('Error fetching book:', error)
    return
  }
  
  const book = books && books.length > 0 ? books[0] : null

  if (!book) {
    console.error(`Book not found with ISBN: ${TEST_BOOK_ISBN}`)
    return
  }
  
  // Extract rating from categories
  const currentRating = book.categories?.find((c: string) => 
    c.startsWith('CLASSIFICATION:')
  )?.replace('CLASSIFICATION:', '') || 'Unknown'

  console.log('📊 GPT-5 Model Test Report')
  console.log('='.repeat(80))
  console.log(`📖 Book: ${book.title} by ${book.author}`)
  console.log(`📚 ISBN: ${TEST_BOOK_ISBN}`)
  console.log(`🆔 Book ID: ${book.id}`)
  console.log('')

  // Get all warnings for this book, grouped by scan_id to identify different model runs
  const { data: allWarnings } = await supabase
    .from('content_warnings')
    .select('*, scan_id, created_at')
    .eq('book_id', book.id)
    .order('created_at', { ascending: false })
    .limit(200)

  if (!allWarnings || allWarnings.length === 0) {
    console.log('No warnings found for this book')
    return
  }

  // Get scans to map scan_id to model_version
  const scanIds = [...new Set(allWarnings.map(w => w.scan_id).filter(Boolean))]
  const { data: scans } = await supabase
    .from('scans')
    .select('id, created_at, model_version')
    .in('id', scanIds)

  const scanMap = new Map<string, { model_version: string | null, created_at: string }>()
  scans?.forEach(scan => {
    scanMap.set(scan.id, { model_version: scan.model_version, created_at: scan.created_at })
  })

  // Group warnings by model version
  const warningsByModel = new Map<string, typeof allWarnings>()
  allWarnings.forEach(warning => {
    const scanInfo = warning.scan_id ? scanMap.get(warning.scan_id) : null
    const model = scanInfo?.model_version || 'unknown'
    
    if (!MODELS_TO_CHECK.includes(model) && model !== 'unknown') {
      return
    }
    
    if (!warningsByModel.has(model)) {
      warningsByModel.set(model, [])
    }
    warningsByModel.get(model)!.push(warning)
  })

  console.log(`Found warnings from ${warningsByModel.size} model(s)`)
  console.log('')

  const results: ModelResults[] = []

  // For each model, get the most recent warnings
  for (const [model, warnings] of warningsByModel.entries()) {
    // Get the most recent scan timestamp for this model
    const modelScans = Array.from(scanMap.values())
      .filter(s => s.model_version === model)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    const mostRecentTimestamp = modelScans.length > 0 
      ? modelScans[0].created_at 
      : warnings[0]?.created_at || null

    // Get the book's current rating from categories
    const { data: currentBook } = await supabase
      .from('books')
      .select('categories, updated_at')
      .eq('id', book.id)
      .single()
    
    const rating = currentBook?.categories?.find((c: string) => 
      c.startsWith('CLASSIFICATION:')
    )?.replace('CLASSIFICATION:', '') || null

    // Remove duplicates by subcategory_id, keeping the most recent
    const uniqueWarnings = new Map<string, typeof allWarnings[0]>()
    warnings.forEach(w => {
      const key = w.subcategory_id || 'unknown'
      const existing = uniqueWarnings.get(key)
      if (!existing || new Date(w.created_at) > new Date(existing.created_at)) {
        uniqueWarnings.set(key, w)
      }
    })

    results.push({
      model,
      warnings: Array.from(uniqueWarnings.values()).sort((a, b) => {
        const severityOrder = { severe: 3, moderate: 2, mild: 1 }
        return (severityOrder[b.severity as keyof typeof severityOrder] || 0) - 
               (severityOrder[a.severity as keyof typeof severityOrder] || 0)
      }),
      rating: rating,
      reasoning: null,
      timestamp: mostRecentTimestamp
    })
  }

  // Sort by model name
  results.sort((a, b) => a.model.localeCompare(b.model))

  // Generate report
  console.log('📋 MODEL COMPARISON')
  console.log('='.repeat(80))
  console.log('')

  // Summary table
  console.log('Summary:')
  console.log('-'.repeat(80))
  console.log(
    'Model'.padEnd(30) +
    'Warnings'.padEnd(12) +
    'Rating'.padEnd(12) +
    'Scan Time'
  )
  console.log('-'.repeat(80))
  
  results.forEach(r => {
    const warnings = r.warnings.length.toString().padEnd(12)
    const rating = (r.rating || 'N/A').padEnd(12)
    const timestamp = r.timestamp 
      ? new Date(r.timestamp).toLocaleString()
      : 'N/A'
    console.log(`${r.model.padEnd(30)}${warnings}${rating}${timestamp}`)
  })

  console.log('')
  console.log('='.repeat(80))
  console.log('')

  // Detailed warnings for each model
  for (const result of results) {
    console.log(`🔍 ${result.model.toUpperCase()}`)
    console.log('='.repeat(80))
    console.log(`Scan Time: ${result.timestamp ? new Date(result.timestamp).toLocaleString() : 'N/A'}`)
    console.log(`Rating: ${result.rating || 'N/A'}`)
    if (result.reasoning) {
      console.log(`Reasoning: ${result.reasoning}`)
    }
    console.log('')
    
    if (result.warnings.length === 0) {
      console.log('  No warnings found')
    } else {
      console.log(`Found ${result.warnings.length} warning(s):`)
      console.log('')
      
      result.warnings.forEach((warning, idx) => {
        console.log(`  ${idx + 1}. ${warning.subcategory_id}`)
        console.log(`     Severity: ${warning.severity.toUpperCase()}`)
        console.log(`     Description: ${warning.description}`)
        console.log(`     Presence: ${warning.presence || 'N/A'}`)
        console.log(`     Detail Level: ${warning.detail_level || 'N/A'}`)
        
        if (warning.severity_signals) {
          const signals = warning.severity_signals
          console.log(`     Signals: proximity=${(signals.proximity || 0).toFixed(2)}, ` +
                     `explicitness=${(signals.explicitness || 0).toFixed(2)}, ` +
                     `frequency=${(signals.frequency || 0).toFixed(2)}`)
        }
        
        if (warning.evidence && warning.evidence.length > 0) {
          const firstEvidence = warning.evidence[0]
          if (firstEvidence.excerpt) {
            const excerpt = firstEvidence.excerpt.substring(0, 100)
            console.log(`     Evidence: "${excerpt}${firstEvidence.excerpt.length > 100 ? '...' : ''}"`)
          }
        }
        
        console.log('')
      })
    }
    
    console.log('')
    console.log('-'.repeat(80))
    console.log('')
  }

  // Comparison matrix
  console.log('📊 WARNING COMPARISON MATRIX')
  console.log('='.repeat(80))
  console.log('')

  // Get all unique subcategories across all models
  const allSubcategories = new Set<string>()
  results.forEach(r => {
    r.warnings.forEach(w => allSubcategories.add(w.subcategory_id))
  })

  const sortedSubcategories = Array.from(allSubcategories).sort()

  // Create matrix
  console.log('Subcategory'.padEnd(40) + results.map(r => r.model.padEnd(15)).join(''))
  console.log('-'.repeat(80))

  sortedSubcategories.forEach(subcat => {
    const line = subcat.padEnd(40)
    const modelPresence = results.map(r => {
      const warning = r.warnings.find(w => w.subcategory_id === subcat)
      if (!warning) return '  -  '.padEnd(15)
      const severity = warning.severity.charAt(0).toUpperCase()
      return `  ${severity}  `.padEnd(15)
    }).join('')
    console.log(line + modelPresence)
  })

  console.log('')
  console.log('Legend: S = Severe, M = Moderate, L = Mild, - = Not found')
  console.log('')

  // Differences analysis
  console.log('🔍 DIFFERENCES ANALYSIS')
  console.log('='.repeat(80))
  console.log('')

  // Find warnings that only appear in some models
  const uniqueWarnings = new Map<string, string[]>()
  sortedSubcategories.forEach(subcat => {
    const modelsWithWarning = results
      .filter(r => r.warnings.some(w => w.subcategory_id === subcat))
      .map(r => r.model)
    
    if (modelsWithWarning.length > 0 && modelsWithWarning.length < results.length) {
      uniqueWarnings.set(subcat, modelsWithWarning)
    }
  })

  if (uniqueWarnings.size > 0) {
    console.log('Warnings that differ across models:')
    console.log('')
    uniqueWarnings.forEach((models, subcat) => {
      const missingModels = results
        .filter(r => !models.includes(r.model))
        .map(r => r.model)
      console.log(`  ${subcat}`)
      console.log(`    Found in: ${models.join(', ')}`)
      console.log(`    Missing in: ${missingModels.join(', ')}`)
      console.log('')
    })
  } else {
    console.log('All models found the same warnings (only severity may differ)')
    console.log('')
  }

  // Severity differences
  console.log('Severity differences for common warnings:')
  console.log('')
  sortedSubcategories.forEach(subcat => {
    const warningsByModel = new Map<string, string>()
    results.forEach(r => {
      const warning = r.warnings.find(w => w.subcategory_id === subcat)
      if (warning) {
        warningsByModel.set(r.model, warning.severity)
      }
    })

    if (warningsByModel.size > 1) {
      const severities = Array.from(new Set(warningsByModel.values()))
      if (severities.length > 1) {
        console.log(`  ${subcat}:`)
        warningsByModel.forEach((severity, model) => {
          console.log(`    ${model}: ${severity}`)
        })
        console.log('')
      }
    }
  })

  console.log('='.repeat(80))
  console.log('✅ Report Complete')
  console.log('='.repeat(80))
}

main().catch(console.error)

