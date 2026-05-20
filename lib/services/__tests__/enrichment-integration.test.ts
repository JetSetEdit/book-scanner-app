/**
 * Real integration tests for enrichment → analysis (no mocks).
 * Run with API keys and Supabase set (see env.example). Load .env.local for local runs.
 * Tests that hit external APIs are skipped when keys are missing.
 * We dynamic-import analyzeBookWithMultiModel only in analysis tests so the first test can run without Supabase.
 */

import { describe, it, expect } from 'vitest'
import { enrichWithWebSearch } from '../web-search-enrichment'

const hasOpenAI = !!process.env.OPENAI_API_KEY
const hasSupabase =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY

// Known book that has community content warnings (death, grief, mental health)
const KLUNE_METADATA = {
  title: 'Under the Whispering Door',
  author: 'TJ Klune',
  description: '',
  isbn: '9781250217349',
}

describe('Enrichment result shape (real enrichWithWebSearch)', () => {
  it('returns combinedText and hadResults on result', async () => {
    const result = await enrichWithWebSearch(
      { ...KLUNE_METADATA, title: KLUNE_METADATA.title, author: KLUNE_METADATA.author, description: '', isbn: KLUNE_METADATA.isbn },
      0
    )
    expect(result).toHaveProperty('combinedText')
    expect(result).toHaveProperty('hadResults')
    expect(typeof result.combinedText).toBe('string')
    expect(typeof result.hadResults).toBe('boolean')
    if (result.hadResults) {
      expect(result.combinedText.length).toBeGreaterThan(0)
    } else {
      expect(result.combinedText).toBe('')
    }
  }, 30_000)
})

describe('Analysis with minimal description (real analyzeBookWithMultiModel)', () => {
  it('uses enrichment so we get warnings or analyzed no-warnings reasoning for a known book (no short-circuit)', async () => {
    if (!hasOpenAI || !hasSupabase) {
      console.warn('Skipping: OPENAI_API_KEY or Supabase env not set')
      return
    }
    const { analyzeBookWithMultiModel } = await import('../multi-model-analysis')
    const result = await analyzeBookWithMultiModel(
      {
        title: KLUNE_METADATA.title,
        author: KLUNE_METADATA.author,
        description: '',
        isbn: KLUNE_METADATA.isbn,
      },
      undefined,
      {
        enableWebEnrichment: true,
        enableVerification: false,
        enableAdversarial: false,
        geminiFirst: false,
        enableOpenAI: true,
        enableGemini: false,
      }
    )
    // Should not short-circuit without trying enrichment: pipeline returns web_enrichment when enrichment runs.
    const shortCircuitReasoning = 'No content warnings found because there was no description or external context to analyze'
    expect(result.web_enrichment?.attempted).toBe(true)
    if (result.warnings.length === 0) {
      expect(result.noWarningsReasoning).toBeDefined()
      expect(result.noWarningsReasoning).not.toBe(shortCircuitReasoning)
    } else {
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.noWarningsReasoning).toBeUndefined()
    }

    // Audit-diagnostics blob (what gets persisted to ai_audit_logs.raw_ai_response).
    expect(result.audit_diagnostics).toBeDefined()
    const diag = result.audit_diagnostics
    expect(Object.keys(diag).sort()).toEqual(
      ['adversarial', 'options', 'prompts', 'raw_responses', 'scan_started_at', 'taxonomy_version', 'timings', 'verification'].sort()
    )
    // OpenAI enabled, Gemini disabled in this test config.
    expect(diag.options.enableOpenAI).toBe(true)
    expect(diag.options.enableGemini).toBe(false)
    expect(typeof diag.prompts.openai).toBe('string')
    expect(diag.prompts.openai!.length).toBeGreaterThan(100)
    expect(diag.prompts.gemini).toBeNull()
    expect(diag.raw_responses.openai).not.toBeNull()
    if (diag.raw_responses.openai && diag.raw_responses.openai.status === 'ok') {
      expect(Array.isArray(diag.raw_responses.openai.warnings)).toBe(true)
    }
    expect(diag.raw_responses.gemini).toBeNull()
    expect(typeof diag.timings.total_ms).toBe('number')
    expect(diag.taxonomy_version).toMatch(/^\d+\.\d+\.\d+$/)
    expect(typeof diag.scan_started_at).toBe('string')
  }, 60_000)
})

describe('Short-circuit when no description and no enrichment (real)', () => {
  it('returns zero warnings and no-input reasoning when enrichment finds nothing', async () => {
    if (!hasOpenAI || !hasSupabase) {
      console.warn('Skipping: OPENAI_API_KEY or Supabase env not set')
      return
    }
    const { analyzeBookWithMultiModel } = await import('../multi-model-analysis')
    // Use a title unlikely to return any enrichment so we hit the short-circuit path
    const result = await analyzeBookWithMultiModel(
      {
        title: 'XqZzY Nonexistent Book 999',
        author: 'Unknown',
        description: '',
        isbn: '0000000000000',
      },
      undefined,
      {
        enableWebEnrichment: true,
        enableVerification: false,
        enableAdversarial: false,
        geminiFirst: false,
        enableOpenAI: true,
        enableGemini: false,
      }
    )
    expect(result.warnings).toHaveLength(0)
    expect(result.web_enrichment?.attempted).toBe(true)
    // Copy evolves with the model; assert substantive "no usable input" semantics.
    expect(result.noWarningsReasoning?.toLowerCase()).toMatch(
      /no .*book description|blurb|textual|enrichment context|without any textual/
    )
  }, 45_000)
})
