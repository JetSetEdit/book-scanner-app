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

async function main() {
  const ISBN = '9781408726600'
  console.log(`Benchmarking scan modes on ISBN: ${ISBN}`)
  console.log('Configs:', BENCHMARK_CONFIGS.map(c => c.id).join(', '))

  console.log('\nNext step: wire BenchmarkAnalysisOptions into scan-service -> multi-model-analysis,')
  console.log('then implement actual execution + report generation here.\n')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})


