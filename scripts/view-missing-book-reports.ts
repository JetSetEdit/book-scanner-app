#!/usr/bin/env tsx
/**
 * View missing book reports (user-reported books that weren't found)
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
dotenv.config({ path: '.env.local' })

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('📚 Missing Book Reports (User-Reported)')
  console.log('='.repeat(80))
  console.log('')

  // Get user-reported missing books
  const { data: reports, error } = await supabase
    .from('manual_handling_scans')
    .select('*')
    .eq('reason', 'not_found')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching reports:', error)
    return
  }

  // Filter for user-reported only
  const userReports = (reports || []).filter(scan => {
    const meta = scan.metadata as any || {}
    return meta.source === 'user_report' || 
           meta.user_reported === true || 
           !!meta.user_provided_title
  })

  if (userReports.length === 0) {
    console.log('   ✅ No pending user-reported missing books found.')
    console.log('')
    return
  }

  console.log(`   Found ${userReports.length} user-reported missing book(s):\n`)

  userReports.forEach((report, idx) => {
    const metadata = report.metadata as any || {}
    const createdAt = new Date(report.created_at).toLocaleString()
    
    console.log(`${idx + 1}. ISBN: ${report.isbn || 'N/A'}`)
    console.log(`   Status: ${report.status}`)
    console.log(`   Reported: ${createdAt}`)
    
    if (metadata.user_provided_title) {
      console.log(`   Title: "${metadata.user_provided_title}"`)
    }
    if (metadata.user_provided_author) {
      console.log(`   Author: ${metadata.user_provided_author}`)
    }
    if (metadata.user_additional_info) {
      console.log(`   Additional Info: ${metadata.user_additional_info}`)
    }
    
    if (report.error_message) {
      console.log(`   Error: ${report.error_message}`)
    }
    
    if (report.resolved_at) {
      console.log(`   Resolved: ${new Date(report.resolved_at).toLocaleString()}`)
    }
    if (report.resolution_notes) {
      console.log(`   Resolution: ${report.resolution_notes}`)
    }
    
    console.log(`   ID: ${report.id}`)
    console.log('')
  })

  console.log('')
  console.log('='.repeat(80))
  console.log('📊 Summary')
  console.log('='.repeat(80))
  console.log(`   Total Pending User Reports: ${userReports.length}`)
  console.log('')
  console.log('💡 To resolve a report:')
  console.log('   POST /api/admin/manual-handling-scans/resolve-by-adding-book')
  console.log('   Body: { "id": "<report-id>" }')
  console.log('   Headers: { "x-admin-secret": "<ADMIN_SECRET>" }')
  console.log('')
}

main().catch(console.error)
