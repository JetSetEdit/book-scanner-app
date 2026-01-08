#!/usr/bin/env tsx
/**
 * Export per-ISBN diagnostics for the accuracy spreadsheet:
 * - Title
 * - Current Subtext rating (CLASSIFICATION:... in books.categories)
 * - Latest audit-log "Based on" flags (description_length, used_web_search, pipeline_path, model/taxonomy)
 * - Top warnings (label + severity)
 *
 * Usage:
 *   tsx scripts/export-accuracy-diagnostics.ts --isbns 978...,978...
 *   tsx scripts/export-accuracy-diagnostics.ts --csv "docs/Subtext Accuracy Test - Jan 2026 - Sheet1.csv"
 */
import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import { getCategoryById, getSubcategoryById } from '../lib/config/taxonomy-v2'

dotenv.config({ path: '.env.local' })

function getArgValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag)
  if (idx === -1) return undefined
  return process.argv[idx + 1]
}

function csvEscape(value: unknown): string {
  const s = value == null ? '' : String(value)
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function parseIsbnsFromCsv(csvPath: string): string[] {
  const raw = fs.readFileSync(csvPath, 'utf8')
  const lines = raw.split(/\r?\n/).filter(Boolean)
  if (lines.length <= 1) return []

  // Very simple CSV parse: ISBN is first column, and this sheet doesn't contain commas inside the ISBN column.
  const isbns: string[] = []
  for (let i = 1; i < lines.length; i++) {
    const firstComma = lines[i].indexOf(',')
    const isbn = (firstComma === -1 ? lines[i] : lines[i].slice(0, firstComma)).trim()
    if (isbn && isbn.toLowerCase() !== 'isbn') isbns.push(isbn.replace(/"/g, ''))
  }
  return [...new Set(isbns)]
}

function getClassification(categories: any): string | null {
  const arr: string[] = Array.isArray(categories) ? categories : []
  const entry = arr.find(c => typeof c === 'string' && c.startsWith('CLASSIFICATION:'))
  return entry ? entry.replace('CLASSIFICATION:', '') : null
}

function severityRank(sev: string | null | undefined): number {
  switch ((sev || '').toLowerCase()) {
    case 'severe': return 3
    case 'moderate': return 2
    case 'mild': return 1
    default: return 0
  }
}

function formatWarningLabel(w: any): string {
  const categoryId = w.category_id
  const subcategoryId = w.subcategory_id
  if (typeof categoryId === 'string' && typeof subcategoryId === 'string') {
    const sub = getSubcategoryById(categoryId, subcategoryId)
    if (sub?.userLabel) return sub.userLabel
  }
  if (typeof categoryId === 'string') {
    const cat = getCategoryById(categoryId)
    if (cat?.userLabel) return cat.userLabel
  }
  if (typeof w.description === 'string' && w.description.trim()) return w.description.trim()
  if (typeof subcategoryId === 'string' && subcategoryId.trim()) return subcategoryId
  return 'Unknown Warning'
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const isbnsArg = getArgValue('--isbns')
  const csvArg = getArgValue('--csv')

  const isbns =
    isbnsArg
      ? isbnsArg.split(',').map(s => s.trim()).filter(Boolean)
      : csvArg
        ? parseIsbnsFromCsv(path.resolve(csvArg))
        : []

  if (isbns.length === 0) {
    console.error('No ISBNs provided. Use --isbns or --csv.')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const header = [
    'ISBN',
    'Title',
    'SubtextRating',
    'AuditDecision',
    'DescriptionLenAtAnalysis',
    'UsedWebSearch',
    'PipelinePath',
    'ModelVersion',
    'TaxonomyVersion',
    'WarningsCount',
    'TopWarnings',
    'HasAnyReasoning',
    'HasAnySourceUrl',
  ]
  console.log(header.map(csvEscape).join(','))

  for (const isbn of isbns) {
    // Book
    const { data: book } = await supabase
      .from('books')
      .select('id, title, categories')
      .eq('isbn', isbn)
      .maybeSingle()

    if (!book) {
      console.log([
        isbn, '', '', '', '', '', '', '', '', '', '', '', ''
      ].map(csvEscape).join(','))
      continue
    }

    const rating = getClassification((book as any).categories) || ''

    // Latest audit log (by book_id for reliability)
    const { data: audit } = await supabase
      .from('ai_audit_logs')
      .select('decision_type, description_length, used_web_search, pipeline_path, model_version, taxonomy_version, created_at')
      .eq('book_id', book.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Warnings
    const { data: warnings } = await supabase
      .from('content_warnings')
      .select('*')
      .eq('book_id', book.id)
      .order('created_at', { ascending: false })
      .limit(200)

    const sortedWarnings = (warnings || []).slice().sort((a: any, b: any) => {
      const sev = severityRank(b.severity) - severityRank(a.severity)
      if (sev !== 0) return sev
      return String(b.created_at || '').localeCompare(String(a.created_at || ''))
    })

    const topWarnings = sortedWarnings.slice(0, 5).map((w: any) => {
      const label = formatWarningLabel(w)
      const sev = (w.severity || '').toString()
      return sev ? `${label} (${sev})` : label
    }).join(', ')

    const hasAnyReasoning = sortedWarnings.some((w: any) => typeof w.reasoning === 'string' && w.reasoning.trim().length > 0)
    const hasAnySourceUrl = sortedWarnings.some((w: any) => typeof w.source_url === 'string' && w.source_url.trim().length > 0)

    console.log([
      isbn,
      book.title || '',
      rating,
      audit?.decision_type || '',
      audit?.description_length ?? '',
      audit?.used_web_search ?? '',
      audit?.pipeline_path || '',
      audit?.model_version || '',
      audit?.taxonomy_version || '',
      sortedWarnings.length,
      topWarnings,
      hasAnyReasoning ? 'yes' : 'no',
      hasAnySourceUrl ? 'yes' : 'no',
    ].map(csvEscape).join(','))
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

