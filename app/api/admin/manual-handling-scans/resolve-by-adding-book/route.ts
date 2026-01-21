import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { normalizeISBN, validateISBN } from '@/lib/isbn-validation'
import { processIsbnScan } from '@/lib/services/scan-service'
import { MODEL_VERSION } from '@/lib/config/taxonomy-v2'

export const runtime = 'nodejs'

function requireAdmin(req: NextRequest): NextResponse | null {
  const secret = req.headers.get('x-admin-secret')
  const adminSecret = process.env.ADMIN_SECRET
  const debugSecret = process.env.DEBUG_IP_SECRET
  if (!adminSecret && !debugSecret) {
    return NextResponse.json(
      { ok: false, error: { code: 'ADMIN_NOT_CONFIGURED', message: 'Admin auth not configured (set ADMIN_SECRET or DEBUG_IP_SECRET and pass x-admin-secret).' } },
      { status: 503 }
    )
  }
  if (!secret || (secret !== adminSecret && secret !== debugSecret)) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid x-admin-secret.' } },
      { status: 401 }
    )
  }
  return null
}

async function validateCoverUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'GET', cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (!res.ok) return false
    const ct = res.headers.get('content-type') || ''
    if (!ct.startsWith('image/')) return false
    const buf = await res.arrayBuffer()
    if (buf.byteLength < 1000) return false
    return true
  } catch {
    return false
  }
}

/**
 * POST /api/admin/manual-handling-scans/resolve-by-adding-book
 * For a user-reported not_found row: create books row, trigger scan, mark resolved.
 * Requires x-admin-secret header (ADMIN_SECRET or DEBUG_IP_SECRET).
 */
export async function POST(req: NextRequest) {
  const auth = requireAdmin(req)
  if (auth) return auth

  try {
    const body = await req.json().catch(() => ({}))
    const { id } = body
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { ok: false, error: { code: 'BAD_REQUEST', message: 'Body must be { id: string }.' } },
        { status: 400 }
      )
    }

    const { data: row, error: fetchErr } = await supabaseAdmin
      .from('manual_handling_scans')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !row) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Scan not found.' } },
        { status: 404 }
      )
    }

    if (row.reason !== 'not_found' || row.status !== 'pending') {
      return NextResponse.json(
        { ok: false, error: { code: 'BAD_REQUEST', message: 'Only pending not_found user reports can be resolved this way.' } },
        { status: 400 }
      )
    }

    const meta = row.metadata || {}
    const isUserReport = meta.source === 'user_report' || meta.user_reported === true || !!meta.user_provided_title
    if (!isUserReport) {
      return NextResponse.json(
        { ok: false, error: { code: 'BAD_REQUEST', message: 'User-reported title is required to add the book.' } },
        { status: 400 }
      )
    }

    const cleanIsbn = normalizeISBN(row.isbn || '')
    if (!cleanIsbn || !validateISBN(cleanIsbn)) {
      return NextResponse.json(
        { ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid or empty ISBN.' } },
        { status: 400 }
      )
    }

    const { data: existing } = await supabaseAdmin
      .from('books')
      .select('id')
      .eq('isbn', cleanIsbn)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { ok: false, error: { code: 'CONFLICT', message: 'Book already exists for this ISBN.' } },
        { status: 409 }
      )
    }

    const title = (meta.user_provided_title || 'Unknown').trim() || 'Unknown'
    const author = (meta.user_provided_author || '').trim() || null

    const olCover = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`
    const coverOk = await validateCoverUrl(olCover)
    const coverUrl = coverOk ? olCover : null

    const now = new Date().toISOString()
    const { data: book, error: insertErr } = await supabaseAdmin
      .from('books')
      .insert({
        isbn: cleanIsbn,
        title,
        author,
        description: null,
        cover_url: coverUrl,
        publisher: null,
        published_date: null,
        page_count: null,
        categories: null,
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single()

    if (insertErr || !book) {
      console.error('resolve-by-adding-book: insert books failed', insertErr)
      return NextResponse.json(
        { ok: false, error: { code: 'DB_ERROR', message: 'Failed to create book.' } },
        { status: 500 }
      )
    }

    let scanTriggered = true
    let scanError: string | undefined

    try {
      await processIsbnScan(
        cleanIsbn,
        undefined,
        undefined,
        false,
        MODEL_VERSION,
        undefined,
        'quick',
        null
      )
    } catch (e) {
      scanTriggered = false
      scanError = e instanceof Error ? e.message : String(e)
      console.warn('resolve-by-adding-book: scan failed', e)
    }

    const resolutionNotes = scanTriggered
      ? `Added book from user report; book_id=${book.id}. Scan triggered.`
      : `Added book from user report; book_id=${book.id}. Scan failed: ${scanError}`

    const { error: updateErr } = await supabaseAdmin
      .from('manual_handling_scans')
      .update({
        status: 'resolved',
        resolved_at: now,
        resolution_notes: resolutionNotes,
        updated_at: now,
      })
      .eq('id', id)

    if (updateErr) {
      console.error('resolve-by-adding-book: update manual_handling_scans failed', updateErr)
      // Book was created and possibly scanned; we still return 200
    }

    return NextResponse.json({
      ok: true,
      book_id: book.id,
      isbn: cleanIsbn,
      scan_triggered: scanTriggered,
      ...(scanError && { scan_error: scanError }),
    })
  } catch (e) {
    console.error('resolve-by-adding-book', e)
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL', message: 'Internal server error.' } },
      { status: 500 }
    )
  }
}
