#!/usr/bin/env tsx
/**
 * Benchmark scan-mode combinations on a single ISBN.
 *
 * Goal: compare latency + warning quality across up to 10 configs (C0–C9)
 * on the same book, then output a markdown report.
 *
 * NOTE: This script is meant for local/dev benchmarking with service-role access.
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load .env.local FIRST before any other imports
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  dotenv.config()
}

type Severity = 'mild' | 'moderate' | 'severe'

type BenchmarkComboId =
  | 'C0'
  | 'C1'
  | 'C2'
  | 'C3'
  | 'C4'
  | 'C5'
  | 'C6'
  | 'C7'
  | 'C8'
  | 'C9'

type BenchmarkMode = 'deep' | 'quick' | 'hybrid'

/**
 * Minimal option surface for benchmarking.
 * This will be threaded into scan-service -> multi-model-analysis in the next step.
 */
export type BenchmarkAnalysisOptions = {
  mode: BenchmarkMode
  model?: string
  enableGemini?: boolean
  enableAdversarial?: boolean
  enableVerification?: boolean
  enableWebEnrichment?: boolean
  maxWarnings?: number
  includeReasoning?: boolean
  maxDescriptionChars?: number
  // Hybrid: optional “verify” model pass if high-risk detected.
  hybridVerifyModel?: string
  hybridVerifyOnHighRisk?: boolean
}

export type BenchmarkConfig = {
  id: BenchmarkComboId
  label: string
  options: BenchmarkAnalysisOptions
}

/**
 * Fixed list of up to 10 combinations (C0–C9).
 * Keep this list stable so results are comparable over time.
 */
export const BENCHMARK_CONFIGS: BenchmarkConfig[] = [
  {
    id: 'C0',
    label: 'Baseline Deep: OpenAI+Gemini + adversarial + verification + enrichment',
    options: {
      mode: 'deep',
      model: 'gpt-5.2-2025-12-11',
      enableGemini: true,
      enableAdversarial: true,
      enableVerification: true,
      enableWebEnrichment: true,
      maxWarnings: 12,
      includeReasoning: true,
    },
  },
  {
    id: 'C1',
    label: 'Deep minus enrichment',
    options: {
      mode: 'deep',
      model: 'gpt-5.2-2025-12-11',
      enableGemini: true,
      enableAdversarial: true,
      enableVerification: true,
      enableWebEnrichment: false,
      maxWarnings: 12,
      includeReasoning: true,
    },
  },
  {
    id: 'C2',
    label: 'Deep minus verification',
    options: {
      mode: 'deep',
      model: 'gpt-5.2-2025-12-11',
      enableGemini: true,
      enableAdversarial: true,
      enableVerification: false,
      enableWebEnrichment: true,
      maxWarnings: 12,
      includeReasoning: true,
    },
  },
  {
    id: 'C3',
    label: 'Deep minus adversarial',
    options: {
      mode: 'deep',
      model: 'gpt-5.2-2025-12-11',
      enableGemini: true,
      enableAdversarial: false,
      enableVerification: true,
      enableWebEnrichment: true,
      maxWarnings: 12,
      includeReasoning: true,
    },
  },
  {
    id: 'C4',
    label: 'Deep OpenAI-only (no Gemini/adversarial/verification/enrichment)',
    options: {
      mode: 'deep',
      model: 'gpt-5.2-2025-12-11',
      enableGemini: false,
      enableAdversarial: false,
      enableVerification: false,
      enableWebEnrichment: false,
      maxWarnings: 12,
      includeReasoning: true,
    },
  },
  {
    id: 'C5',
    label: 'Quick OpenAI-only, capped to 5 warnings (full description)',
    options: {
      mode: 'quick',
      model: 'gpt-5.2-2025-12-11',
      enableGemini: false,
      enableAdversarial: false,
      enableVerification: false,
      enableWebEnrichment: false,
      maxWarnings: 5,
      includeReasoning: false,
    },
  },
  {
    id: 'C6',
    label: 'Quick OpenAI-only, capped + truncated description',
    options: {
      mode: 'quick',
      model: 'gpt-5.2-2025-12-11',
      enableGemini: false,
      enableAdversarial: false,
      enableVerification: false,
      enableWebEnrichment: false,
      maxWarnings: 5,
      includeReasoning: false,
      maxDescriptionChars: 1000,
    },
  },
  {
    id: 'C7',
    label: 'Quick fast-model (OpenAI), capped + truncated',
    options: {
      mode: 'quick',
      model: 'gpt-5-mini',
      enableGemini: false,
      enableAdversarial: false,
      enableVerification: false,
      enableWebEnrichment: false,
      maxWarnings: 5,
      includeReasoning: false,
      maxDescriptionChars: 1000,
    },
  },
  {
    id: 'C8',
    label: 'Quick Gemini-only, capped + truncated',
    options: {
      mode: 'quick',
      // Model selection is handled inside Gemini client; keep model undefined here.
      enableGemini: true,
      enableAdversarial: false,
      enableVerification: false,
      enableWebEnrichment: false,
      maxWarnings: 5,
      includeReasoning: false,
      maxDescriptionChars: 1000,
    },
  },
  {
    id: 'C9',
    label: 'Hybrid: fast-model quick; verify on high-risk with stronger model',
    options: {
      mode: 'hybrid',
      model: 'gpt-5-mini',
      enableGemini: false,
      enableAdversarial: false,
      enableVerification: false,
      enableWebEnrichment: false,
      maxWarnings: 5,
      includeReasoning: false,
      maxDescriptionChars: 1000,
      hybridVerifyModel: 'gpt-5.2-2025-12-11',
      hybridVerifyOnHighRisk: true,
    },
  },
]

function severityWeight(sev: Severity): number {
  switch (sev) {
    case 'severe':
      return 3
    case 'moderate':
      return 2
    default:
      return 1
  }
}

function normalizeSubcategoryId(subcategoryId: string | null | undefined): string {
  return (subcategoryId || '').trim()
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const union = new Set([...a, ...b])
  if (union.size === 0) return 1
  let intersection = 0
  for (const x of a) if (b.has(x)) intersection++
  return intersection / union.size
}

function isHighRiskSubcategory(subcategoryId: string): boolean {
  const id = subcategoryId.toLowerCase()
  return (
    id.includes('sexual_violence') ||
    id.includes('self_harm') ||
    id.includes('suic') ||
    id.includes('domestic_violence') ||
    id.includes('child_abuse') ||
    id.includes('rape') ||
    id.includes('torture')
  )
}

function formatMs(ms: number): string {
  if (!isFinite(ms)) return 'n/a'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

type RunResult = {
  id: BenchmarkComboId
  label: string
  totalMs: number
  warnings: any[]
  warningIds: Set<string>
  severityCounts: Record<Severity, number>
  hasHighRisk: boolean
  rating?: string
  reasoning?: string
  jaccardVsBaseline?: number
  notes?: string[]
}

function countSeverities(warnings: any[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { mild: 0, moderate: 0, severe: 0 }
  for (const w of warnings) {
    const s = (w?.severity || 'mild') as Severity
    if (s === 'mild' || s === 'moderate' || s === 'severe') counts[s]++
  }
  return counts
}

function normalizeWarningsForMetrics(warnings: any[]): any[] {
  // Sort for deterministic output (severity desc, then confidence desc)
  const severityRank: Record<string, number> = { severe: 3, moderate: 2, mild: 1 }
  return [...warnings].sort((a, b) => {
    const ar = severityRank[a?.severity] || 0
    const br = severityRank[b?.severity] || 0
    if (br !== ar) return br - ar
    const ac = a?.evidence?.[0]?.confidence ?? 0
    const bc = b?.evidence?.[0]?.confidence ?? 0
    return bc - ac
  })
}

function warningIdSet(warnings: any[]): Set<string> {
  const set = new Set<string>()
  for (const w of warnings) {
    const id = normalizeSubcategoryId(w?.subcategory_id)
    if (id) set.add(id)
  }
  return set
}

async function fetchStableMetadata(isbn: string): Promise<{
  title: string
  author: string
  description: string
  isbn: string
}> {
  const { supabaseAdmin } = await import('../lib/supabase/admin')
  const { data: book } = await supabaseAdmin
    .from('books')
    .select('title, author, description, isbn')
    .eq('isbn', isbn)
    .maybeSingle()

  if (book?.description && book?.title) {
    return {
      title: book.title,
      author: book.author || 'Unknown',
      description: book.description,
      isbn: book.isbn,
    }
  }

  // Fallback: fetch from external API (no DB writes here)
  const { fetchBookByISBN } = await import('../lib/book-api')
  const fetched = await fetchBookByISBN(isbn)
  return {
    title: fetched?.title || 'Unknown',
    author: fetched?.author || 'Unknown',
    description: fetched?.description || '',
    isbn,
  }
}

async function runOneConfig(
  cfg: BenchmarkConfig,
  baseMetadata: { title: string; author: string; description: string; isbn: string }
): Promise<RunResult> {
  const { analyzeBookWithMultiModel } = await import('../lib/services/multi-model-analysis')
  const { calculateAgeRating } = await import('../lib/utils/age-rating')

  const start = performance.now()
  const opts = cfg.options

  // Apply truncation for this run (if requested)
  const meta = opts.maxDescriptionChars
    ? { ...baseMetadata, description: (baseMetadata.description || '').slice(0, opts.maxDescriptionChars) }
    : baseMetadata

  // Run analysis
  const analysisOptions: any = {
    model: opts.model,
    enableOpenAI: opts.enableGemini === true && !opts.model ? false : true, // crude: Gemini-only configs set enableOpenAI false below
    enableGemini: opts.enableGemini ?? false,
    enableAdversarial: opts.enableAdversarial ?? false,
    enableVerification: opts.enableVerification ?? false,
    enableWebEnrichment: opts.enableWebEnrichment ?? false,
    maxWarnings: opts.maxWarnings,
    includeReasoning: opts.includeReasoning ?? true,
    maxDescriptionChars: opts.maxDescriptionChars,
  }

  // Explicit Gemini-only mode: enableGemini true and no model => disable OpenAI
  if (opts.enableGemini === true && !opts.model) {
    analysisOptions.enableOpenAI = false
  }

  let result = await analyzeBookWithMultiModel(meta as any, undefined, analysisOptions)
  let warnings = normalizeWarningsForMetrics(result.warnings || [])

  // Hybrid: if high risk detected, rerun with stronger model (still quick knobs) to validate
  const hasHighRisk = warnings.some(w => isHighRiskSubcategory(String(w?.subcategory_id || '')))
  const notes: string[] = []
  if (opts.mode === 'hybrid' && opts.hybridVerifyOnHighRisk && hasHighRisk && opts.hybridVerifyModel) {
    notes.push(`Hybrid triggered verify-on-high-risk using ${opts.hybridVerifyModel}`)
    const verifyOptions = {
      ...analysisOptions,
      model: opts.hybridVerifyModel,
      enableGemini: false,
      enableAdversarial: false,
      enableVerification: false,
      enableWebEnrichment: false,
    }
    result = await analyzeBookWithMultiModel(meta as any, undefined, verifyOptions)
    warnings = normalizeWarningsForMetrics(result.warnings || [])
  }

  // Compute age rating from warnings
  const age = calculateAgeRating(warnings as any)

  const end = performance.now()
  const totalMs = end - start

  const ids = warningIdSet(warnings)
  const sevCounts = countSeverities(warnings)

  return {
    id: cfg.id,
    label: cfg.label,
    totalMs,
    warnings,
    warningIds: ids,
    severityCounts: sevCounts,
    hasHighRisk,
    rating: age?.rating,
    reasoning: age?.reasoning,
    notes,
  }
}

function toMarkdown(
  results: RunResult[],
  baseline: RunResult,
  context: { isbn: string; title: string; author: string; descriptionLength: number }
): string {
  const lines: string[] = []
  lines.push(`# BENCHMARK_SCAN_MODES`)
  lines.push(``)
  lines.push(`ISBN: \`${context.isbn}\``)
  lines.push(`Book: ${context.title} — ${context.author}`)
  lines.push(`Base description length: ${context.descriptionLength} chars`)
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push(``)
  if (context.descriptionLength === 0) {
    lines.push(
      `Note: base metadata has no description. Configs that disable web enrichment are expected to under-call (often 0 warnings).`
    )
    lines.push(``)
  }

  lines.push(`## Summary table`)
  lines.push(``)
  lines.push(`| Config | Time | Rating | #Warnings | Severe/Mod/Mild | HighRisk | Overlap vs C0 | Notes |`)
  lines.push(`|---|---:|---|---:|---|---|---:|---|`)
  for (const r of results) {
    const overlap = r.jaccardVsBaseline != null ? r.jaccardVsBaseline.toFixed(2) : 'n/a'
    const sev = `${r.severityCounts.severe}/${r.severityCounts.moderate}/${r.severityCounts.mild}`
    const notes = (r.notes || []).join('; ')
    lines.push(
      `| ${r.id} | ${formatMs(r.totalMs)} | ${r.rating || 'n/a'} | ${r.warnings.length} | ${sev} | ${r.hasHighRisk ? 'yes' : 'no'} | ${overlap} | ${notes || ''} |`
    )
  }

  lines.push(``)
  lines.push(`## Details`)
  for (const r of results) {
    lines.push(``)
    lines.push(`### ${r.id}: ${r.label}`)
    lines.push(`- Time: ${formatMs(r.totalMs)}`)
    lines.push(`- Rating: ${r.rating || 'n/a'}`)
    lines.push(`- High risk present: ${r.hasHighRisk ? 'yes' : 'no'}`)
    if (r.jaccardVsBaseline != null) lines.push(`- Overlap vs C0 (Jaccard): ${r.jaccardVsBaseline.toFixed(2)}`)
    if (r.notes && r.notes.length) lines.push(`- Notes: ${r.notes.join('; ')}`)
    lines.push(`- Warnings:`)
    for (const w of r.warnings) {
      const conf = w?.evidence?.[0]?.confidence
      lines.push(`  - ${w?.subcategory_id} (${w?.severity}${conf != null ? `, conf=${Number(conf).toFixed(2)}` : ''})`)
    }
  }

  lines.push(``)
  return lines.join('\n')
}

async function main() {
  const ISBN = '9781408726600'
  console.log(`Benchmarking scan modes on ISBN: ${ISBN}`)
  console.log(`Configs: ${BENCHMARK_CONFIGS.map(c => c.id).join(', ')}`)

  const metadata = await fetchStableMetadata(ISBN)
  console.log(`Using metadata: "${metadata.title}" by ${metadata.author} (desc ${metadata.description.length} chars)`)

  const results: RunResult[] = []

  // Run baseline first (C0)
  const baselineCfg = BENCHMARK_CONFIGS.find(c => c.id === 'C0')
  if (!baselineCfg) throw new Error('Missing baseline config C0')

  console.log(`\nRunning baseline ${baselineCfg.id}...`)
  const baseline = await runOneConfig(baselineCfg, metadata)
  results.push(baseline)

  for (const cfg of BENCHMARK_CONFIGS) {
    if (cfg.id === 'C0') continue
    console.log(`\nRunning ${cfg.id}...`)
    const r = await runOneConfig(cfg, metadata)
    results.push(r)
  }

  // Compute overlaps vs baseline
  for (const r of results) {
    r.jaccardVsBaseline = jaccard(r.warningIds, baseline.warningIds)
  }

  // Sort results by total time ascending (for quick readability)
  const sorted = [...results].sort((a, b) => a.totalMs - b.totalMs)

  const report = toMarkdown(sorted, baseline, {
    isbn: ISBN,
    title: metadata.title,
    author: metadata.author,
    descriptionLength: metadata.description.length,
  })
  fs.writeFileSync(path.resolve(process.cwd(), 'BENCHMARK_SCAN_MODES.md'), report, 'utf-8')

  console.log(`\n✅ Wrote BENCHMARK_SCAN_MODES.md`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})


