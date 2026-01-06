/**
 * Check book 9781405965439
 */

import 'dotenv/config'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function checkBook() {
  const isbn = '9781405965439'
  
  const { data: book, error } = await supabaseAdmin
    .from('books')
    .select('*')
    .eq('isbn', isbn)
    .single()

  if (error || !book) {
    console.log('❌ Book not found in database')
    console.log('Error:', error)
    return
  }

  console.log('📚 Book Information:')
  console.log('='.repeat(80))
  console.log(`Title: ${book.title}`)
  console.log(`Author: ${book.author || '(unknown)'}`)
  console.log(`ISBN: ${book.isbn}`)
  console.log(`Cover URL: ${book.cover_url || '(none)'}`)
  console.log(`Has cover: ${!!book.cover_url}`)
  console.log(`Description: ${book.description ? `${book.description.length} chars` : '(none)'}`)
  console.log(`Categories: ${book.categories?.join(', ') || '(none)'}`)
  console.log(`Created: ${book.created_at}`)
  console.log(`Updated: ${book.updated_at || '(never)'}`)
  console.log()

  // Check content warnings
  const { data: warnings } = await supabaseAdmin
    .from('content_warnings')
    .select('*')
    .eq('book_id', book.id)

  console.log(`Content Warnings: ${warnings?.length || 0}`)
  if (warnings && warnings.length > 0) {
    warnings.forEach((w, i) => {
      console.log(`  ${i+1}. ${w.category_id}.${w.subcategory_id || 'none'} - ${w.severity}`)
      console.log(`     ${w.description}`)
    })
  } else {
    console.log('  (No warnings found)')
  }
  console.log()

  // Check audit logs
  const { data: auditLogs } = await supabaseAdmin
    .from('ai_audit_logs')
    .select('decision_type, metadata_issues, created_at')
    .eq('book_id', book.id)
    .order('created_at', { ascending: false })
    .limit(5)

  console.log(`Audit Logs: ${auditLogs?.length || 0}`)
  if (auditLogs && auditLogs.length > 0) {
    auditLogs.forEach((log, i) => {
      console.log(`  ${i+1}. ${log.decision_type} - ${log.created_at}`)
      if ((log as any).metadata_issues) {
        console.log(`     Issues: ${JSON.stringify((log as any).metadata_issues)}`)
      }
    })
  }
  console.log()

  // Check scans
  const { data: scans } = await supabaseAdmin
    .from('scans')
    .select('*')
    .eq('isbn', isbn)
    .order('created_at', { ascending: false })
    .limit(5)

  console.log(`Scans: ${scans?.length || 0}`)
  if (scans && scans.length > 0) {
    scans.forEach((scan, i) => {
      console.log(`  ${i+1}. ${scan.created_at}`)
    })
  }

  // Validate cover URL if it exists
  if (book.cover_url) {
    console.log()
    console.log('🔍 Validating cover URL...')
    try {
      const response = await fetch(book.cover_url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'Book-Scanner-App/1.0' }
      })

      if (!response.ok) {
        console.log(`   ❌ HTTP ${response.status}: ${response.statusText}`)
      } else {
        const buffer = await response.arrayBuffer()
        const size = buffer.byteLength
        console.log(`   ✅ HTTP ${response.status}`)
        console.log(`   Size: ${(size / 1024).toFixed(2)} KB`)
        console.log(`   Content-Type: ${response.headers.get('content-type') || '(not set)'}`)
        
        if (size < 1000) {
          console.log(`   ⚠️  WARNING: Image is very small (${size} bytes) - likely placeholder`)
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`)
    }
  }
}

checkBook().catch(console.error)

