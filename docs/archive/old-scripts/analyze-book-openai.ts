#!/usr/bin/env tsx

/**
 * OpenAI Book Analysis Script
 * 
 * Analyzes a book using OpenAI with Taxonomy v2.5.0
 * Uses new enhancements: context modifiers, evidence storage, computed severity
 * 
 * Usage: npx tsx scripts/analyze-book-openai.ts <ISBN>
 */

import OpenAI from 'openai'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { WARNING_CATEGORIES, TAXONOMY_VERSION, MODEL_VERSION } from '../lib/config/taxonomy-v2'
import { ContextModifier, EvidenceSpan, EnhancedContentWarning } from '../lib/config/taxonomy-context'
import { buildSeveritySignals, computeSeverityFromSignals } from '../lib/utils/severity-computation'
import { isActualSexualViolence } from '../lib/utils/sexual-violence-evaluation'
import { normalizeISBN } from '../lib/isbn-validation'
import { fetchCandidatesByISBN } from '../lib/book-api'

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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in environment')
  process.exit(1)
}

interface BookMetadata {
  title: string
  author: string
  description: string
  isbn: string
}

async function fetchBookMetadata(isbn: string): Promise<BookMetadata | null> {
  console.log(`\n📚 Fetching book metadata for ISBN: ${isbn}\n`)
  
  const candidates = await fetchCandidatesByISBN(isbn)
  
  if (candidates.length === 0) {
    console.log('❌ Book not found in external APIs')
    return null
  }
  
  const book = candidates[0]
  console.log(`✅ Found: "${book.title}" by ${book.author}`)
  console.log(`   Source: ${book.source}\n`)
  
  return {
    title: book.title,
    author: book.author || 'Unknown',
    description: book.description || 'No description available',
    isbn: isbn
  }
}

function buildTaxonomyContext(): string {
  const categories = WARNING_CATEGORIES.map(cat => {
    const subcats = cat.subcategories.map(sub => 
      `    - ${cat.id}.${sub.id}: ${sub.userLabel} (${sub.shortDescription}) [Default: ${sub.defaultSeverityHint || 'none'}]`
    ).join('\n')
    
    return `  ${cat.id} (${cat.userLabel}):\n${subcats}`
  }).join('\n\n')
  
  return categories
}

function buildContextModifiersList(): string {
  return `
Context Modifiers (add nuance):
  - historical_context: Content appears in historical setting
  - quoted_or_discussed: Content is quoted/discussed, not directly depicted
  - character_held_bias: Bias held by character, not narrative
  - condemned_by_narrative: Content explicitly condemned
  - endorsed_by_narrative: Content endorsed/normalized (rare)
  - educational_or_analytical: Educational/informational context
  - satire_or_parody: Satirical context
`
}

async function analyzeWithOpenAI(metadata: BookMetadata): Promise<EnhancedContentWarning[]> {
  console.log('🤖 Analyzing with OpenAI...\n')
  console.log(`   Model: ${MODEL_VERSION}`)
  console.log(`   Taxonomy: v${TAXONOMY_VERSION}\n`)
  
  const taxonomyContext = buildTaxonomyContext()
  const modifiersList = buildContextModifiersList()
  
  const prompt = `Analyze this book for content warnings using Taxonomy v${TAXONOMY_VERSION}.

Book Information:
- Title: ${metadata.title}
- Author: ${metadata.author}
- ISBN: ${metadata.isbn}

Description:
${metadata.description}

Available Categories and Subcategories:
${taxonomyContext}
${modifiersList}

Instructions:
1. For each content warning found, provide:
   - subcategory_id (format: category.subcategory, e.g., "violence.graphic_violence")
   - description (brief, clear description)
   - presence (on_page, off_page, flashback, referenced, implied)
   - detail_level (graphic, moderate, vague, clinical)
   - context_modifiers (array of applicable modifiers, if any)
   - frequency_hint (single, repeated, theme)
   - centrality_hint (throwaway, minor, central)
   - evidence (array with at least one evidence span containing: source: "text", excerpt: short quote, confidence: 0-1)

2. Be specific and evidence-based. Only include warnings you can identify from the description.

3. For sexual content, carefully distinguish:
   - sexual_violence: Requires strong signals (force, threat, non-consent, victim framing)
   - consent_ambiguity (dub-con): Unclear consent in dark romance
   - cnc: Consensual non-consent play
   - explicit_sexual_content: Explicit but consensual

4. Return as JSON with this structure:
{
  "warnings": [
    {
      "subcategory_id": "category.subcategory",
      "description": "...",
      "presence": "on_page",
      "detail_level": "moderate",
      "context_modifiers": [],
      "frequency_hint": "theme",
      "centrality_hint": "central",
      "evidence": [
        {
          "source": "text",
          "excerpt": "...",
          "confidence": 0.8
        }
      ]
    }
  ]
}`

  try {
    const response = await openai.chat.completions.create({
      model: MODEL_VERSION,
      messages: [
        {
          role: 'system',
          content: `You are a content warning analyzer using Taxonomy v${TAXONOMY_VERSION}. Always use the hierarchical category.subcategory format. Be precise, evidence-based, and avoid over-tagging.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    const analysis = JSON.parse(content)
    return processWarnings(analysis.warnings || [])
  } catch (error) {
    console.error('❌ OpenAI API Error:', error)
    throw error
  }
}

function processWarnings(rawWarnings: any[]): EnhancedContentWarning[] {
  console.log(`\n📊 Processing ${rawWarnings.length} warnings...\n`)
  
  return rawWarnings.map((w, index) => {
    // Build severity signals
    const signals = buildSeveritySignals({
      presence: w.presence,
      detail_level: w.detail_level,
      description: w.description,
      category_id: w.subcategory_id?.split('.')[0],
      frequency_hint: w.frequency_hint,
      centrality_hint: w.centrality_hint
    })
    
    // Compute severity from signals
    const severity = computeSeverityFromSignals(signals)
    
    // Validate sexual violence if applicable
    let subcategoryId = w.subcategory_id
    if (subcategoryId?.includes('sexual')) {
      const violenceCheck = isActualSexualViolence({
        subcategory_id: subcategoryId,
        description: w.description,
        reasoning: w.reasoning || ''
      } as any)
      
      if (!violenceCheck.isViolence && subcategoryId === 'sexual_content.sexual_violence') {
        console.log(`   ⚠️  Warning ${index + 1}: Reclassifying sexual_violence → consent_ambiguity`)
        subcategoryId = 'sexual_content.consent_ambiguity'
      }
    }
    
    const processed: EnhancedContentWarning = {
      subcategory_id: subcategoryId,
      severity,
      modifiers: (w.context_modifiers || []) as ContextModifier[],
      evidence: (w.evidence || []) as EvidenceSpan[],
      severity_signals: signals,
      taxonomy_version: TAXONOMY_VERSION,
    }
    
    return processed
  })
}

function displayResults(warnings: EnhancedContentWarning[]) {
  console.log('\n' + '═'.repeat(80))
  console.log('📋 ANALYSIS RESULTS')
  console.log('═'.repeat(80) + '\n')
  
  if (warnings.length === 0) {
    console.log('✅ No content warnings identified.\n')
    return
  }
  
  // Group by severity
  const bySeverity = {
    severe: warnings.filter(w => w.severity === 'severe'),
    moderate: warnings.filter(w => w.severity === 'moderate'),
    mild: warnings.filter(w => w.severity === 'mild'),
  }
  
  console.log(`Total Warnings: ${warnings.length}`)
  console.log(`  🔴 Severe: ${bySeverity.severe.length}`)
  console.log(`  🟠 Moderate: ${bySeverity.moderate.length}`)
  console.log(`  🟡 Mild: ${bySeverity.mild.length}\n`)
  
  // Display each warning
  warnings.forEach((w, i) => {
    const severityEmoji = w.severity === 'severe' ? '🔴' : w.severity === 'moderate' ? '🟠' : '🟡'
    console.log(`${i + 1}. ${severityEmoji} ${w.subcategory_id}`)
    console.log(`   Severity: ${w.severity.toUpperCase()}`)
    
    if (w.modifiers.length > 0) {
      console.log(`   Modifiers: ${w.modifiers.join(', ')}`)
    }
    
    if (w.evidence.length > 0) {
      const evidence = w.evidence[0]
      console.log(`   Evidence: "${evidence.excerpt}" (confidence: ${(evidence.confidence * 100).toFixed(0)}%)`)
    }
    
    if (w.severity_signals) {
      console.log(`   Signals: frequency=${w.severity_signals.frequency.toFixed(2)}, ` +
                  `explicitness=${w.severity_signals.explicitness.toFixed(2)}, ` +
                  `proximity=${w.severity_signals.proximity.toFixed(2)}, ` +
                  `centrality=${w.severity_signals.centrality.toFixed(2)}`)
    }
    
    console.log('')
  })
  
  console.log('═'.repeat(80))
  console.log(`✅ Analysis complete using Taxonomy v${TAXONOMY_VERSION}\n`)
}

async function main() {
  const isbn = process.argv[2]
  
  if (!isbn) {
    console.error('Usage: npx tsx scripts/analyze-book-openai.ts <ISBN>')
    process.exit(1)
  }
  
  const cleanIsbn = normalizeISBN(isbn)
  if (!cleanIsbn) {
    console.error('❌ Invalid ISBN format')
    process.exit(1)
  }
  
  try {
    // Fetch book metadata
    const metadata = await fetchBookMetadata(cleanIsbn)
    if (!metadata) {
      process.exit(1)
    }
    
    // Analyze with OpenAI
    const warnings = await analyzeWithOpenAI(metadata)
    
    // Display results
    displayResults(warnings)
    
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()


