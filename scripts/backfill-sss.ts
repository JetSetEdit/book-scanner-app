/**
 * Backfill SSS (Subtext Suitability Scale) for books that have been analyzed
 * but have null sss_level (e.g. scanned before SSS was in the pipeline).
 *
 * Usage:
 *   npx tsx scripts/backfill-sss.ts [--dry-run] [--limit=N]
 *
 * Requires: OPENAI_API_KEY (for assignSSS), Supabase env vars in .env.local
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { assignSSS, S0_NO_INPUT_SSS_RESULT } from '@/lib/services/sss-assignment'
import type { EnhancedContentWarning } from '@/lib/config/taxonomy-context'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const limitArg = args.find((a) => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined

interface CwRow {
  subcategory_id?: string | null
  category_id?: string | null
  category?: string
  severity: 'mild' | 'moderate' | 'severe'
  description: string
  reasoning?: string | null
}

function toEnhancedWarnings(rows: CwRow[]): EnhancedContentWarning[] {
  return rows.map((row) => ({
    subcategory_id: row.subcategory_id ?? row.category_id ?? row.category ?? 'other',
    severity: row.severity,
    description: row.description,
    reasoning: row.reasoning ?? undefined,
    modifiers: [],
    evidence: [],
    taxonomy_version: '',
  }))
}

async function main() {
  console.log('🔍 Finding books with null sss_level that have been analyzed...\n')

  // Books that have an audit log (analyzed) but sss_level is null
  const { data: auditBookIds, error: auditError } = await supabase
    .from('ai_audit_logs')
    .select('book_id')
    .in('decision_type', ['warnings_generated', 'no_warnings'])

  if (auditError) {
    console.error('Error fetching audit logs:', auditError)
    process.exit(1)
  }

  const analyzedBookIds = [...new Set((auditBookIds ?? []).map((r) => r.book_id).filter(Boolean))] as string[]
  if (analyzedBookIds.length === 0) {
    console.log('No analyzed books found.')
    return
  }

  const { data: books, error: booksError } = await supabase
    .from('books')
    .select('id, title, author, description')
    .in('id', analyzedBookIds)
    .is('sss_level', null)
    .limit(limit ?? 1e6)

  if (booksError) {
    console.error('Error fetching books:', booksError)
    process.exit(1)
  }

  const toProcess = books ?? []
  if (toProcess.length === 0) {
    console.log('✅ No books with null sss_level need backfill.')
    return
  }

  console.log(`📚 Found ${toProcess.length} books to backfill${limit != null ? ` (limit ${limit})` : ''}.`)
  if (dryRun) {
    console.log('🔸 Dry run – no updates will be written.\n')
  }

  let updated = 0
  let failed = 0

  for (let i = 0; i < toProcess.length; i++) {
    const book = toProcess[i]
    const desc = (book.title ?? 'Unknown') + (book.author ? ` by ${book.author}` : '')
    console.log(`[${i + 1}/${toProcess.length}] ${desc}`)

    const { data: cwRows } = await supabase
      .from('content_warnings')
      .select('subcategory_id, category_id, category, severity, description, reasoning')
      .eq('book_id', book.id)

    const warnings = toEnhancedWarnings((cwRows ?? []) as CwRow[])
    const description =
      (book.description && book.description.trim()) || `${book.title ?? 'Unknown'} by ${book.author ?? 'Unknown'}`

    let result
    if (warnings.length === 0 && !book.description?.trim()) {
      result = S0_NO_INPUT_SSS_RESULT
    } else {
      try {
        result = await assignSSS({
          warnings,
          title: book.title ?? 'Unknown',
          author: book.author,
          description,
        })
      } catch (err) {
        console.error(`  ❌ assignSSS failed:`, err)
        failed++
        continue
      }
    }

    if (!dryRun) {
      const { error: updateErr } = await supabase
        .from('books')
        .update({ sss_level: result.sss_level, sss_notes: result.sss_notes })
        .eq('id', book.id)

      if (updateErr) {
        console.error(`  ❌ Update failed: ${updateErr.message}`)
        failed++
        continue
      }
    }

    console.log(`  → ${result.sss_level}`)
    updated++
  }

  console.log(
    `\n${dryRun ? '🔸 Dry run complete. ' : ''}Updated: ${updated}${failed ? `, failed: ${failed}` : ''}.`
  )
}

main().catch(console.error)
