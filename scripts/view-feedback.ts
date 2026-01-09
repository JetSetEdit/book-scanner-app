#!/usr/bin/env tsx
/**
 * View user feedback with full context details
 * Usage: tsx scripts/view-feedback.ts [--status=pending] [--type=content_issue] [--limit=10]
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
dotenv.config({ path: '.env.local' })

interface FeedbackFilters {
  status?: string
  feedbackType?: string
  limit?: number
  bookId?: string
}

async function viewFeedback(filters: FeedbackFilters = {}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = supabase
    .from('manual_handling_scans')
    .select('*')
    .eq('reason', 'user_feedback')
    .order('created_at', { ascending: false })

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.bookId) {
    query = query.eq('book_id', filters.bookId)
  }

  if (filters.limit) {
    query = query.limit(filters.limit)
  } else {
    query = query.limit(50)
  }

  const { data: feedbacks, error } = await query

  if (error) {
    console.error('Error fetching feedback:', error)
    return
  }

  if (!feedbacks || feedbacks.length === 0) {
    console.log('📭 No feedback found matching criteria.')
    return
  }

  console.log(`📋 Found ${feedbacks.length} feedback entry(ies)\n`)
  console.log('='.repeat(100))
  console.log('')

  feedbacks.forEach((fb, idx) => {
    const metadata = fb.metadata as any || {}
    const contextData = (fb as any).context_data as any || {}
    const status = fb.status || 'pending'
    const createdAt = new Date(fb.created_at).toLocaleString()

    console.log(`\n${idx + 1}. ${metadata.feedback_type || 'Unknown Type'} [${status.toUpperCase()}]`)
    console.log('─'.repeat(100))
    console.log(`   📅 Submitted: ${createdAt}`)
    
    // Book context
    if ((fb as any).book_title) {
      console.log(`   📖 Book: "${(fb as any).book_title}"`)
      if ((fb as any).book_author) {
        console.log(`      Author: ${(fb as any).book_author}`)
      }
      if ((fb as any).isbn && (fb as any).isbn !== 'N/A') {
        console.log(`      ISBN: ${(fb as any).isbn}`)
      }
      if ((fb as any).book_id) {
        console.log(`      Book ID: ${(fb as any).book_id}`)
      }
    }

    // Context data
    if (contextData.warnings_count !== null && contextData.warnings_count !== undefined) {
      console.log(`   ⚠️  Warnings Count: ${contextData.warnings_count}`)
    }
    if (contextData.analysis_status) {
      console.log(`   🔍 Analysis Status: ${contextData.analysis_status}`)
    }
    if (contextData.metadata_issues) {
      const issues = contextData.metadata_issues as any
      const issueList: string[] = []
      if (issues.missingCover) issueList.push('Missing Cover')
      if (issues.missingDescription) issueList.push('Missing Description')
      if (issueList.length > 0) {
        console.log(`   📋 Metadata Issues: ${issueList.join(', ')}`)
      }
    }
    if (contextData.pathname) {
      console.log(`   🔗 Path: ${contextData.pathname}`)
    }

    // User info
    if (metadata.email) {
      console.log(`   📧 Email: ${metadata.email}`)
    }
    if (metadata.page_url) {
      console.log(`   🌐 Page URL: ${metadata.page_url}`)
    }
    if ((fb as any).app_version) {
      console.log(`   📱 App Version: ${(fb as any).app_version}`)
    }
    if ((fb as any).user_agent) {
      const ua = (fb as any).user_agent as string
      // Extract browser info
      const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/)
      if (browserMatch) {
        console.log(`   🌍 Browser: ${browserMatch[0]}`)
      }
    }

    // Message
    if (metadata.message) {
      console.log(`\n   💬 Message:`)
      console.log(`   ${metadata.message.split('\n').map((line: string) => `   ${line}`).join('\n')}`)
    }

    if (metadata.submission_count && metadata.submission_count > 1) {
      console.log(`\n   🔄 Submission Count: ${metadata.submission_count}`)
    }

    console.log('')
  })

  // Summary by type
  console.log('\n' + '='.repeat(100))
  console.log('📊 SUMMARY BY TYPE')
  console.log('='.repeat(100))
  const typeCounts: Record<string, number> = {}
  const statusCounts: Record<string, number> = {}
  
  feedbacks.forEach((fb) => {
    const metadata = fb.metadata as any || {}
    const type = metadata.feedback_type || 'unknown'
    const status = fb.status || 'pending'
    typeCounts[type] = (typeCounts[type] || 0) + 1
    statusCounts[status] = (statusCounts[status] || 0) + 1
  })

  console.log('\nBy Feedback Type:')
  Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`)
    })

  console.log('\nBy Status:')
  Object.entries(statusCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`)
    })
  console.log('')
}

// Parse command line arguments
const args = process.argv.slice(2)
const filters: FeedbackFilters = {}

args.forEach(arg => {
  if (arg.startsWith('--status=')) {
    filters.status = arg.split('=')[1]
  } else if (arg.startsWith('--type=')) {
    filters.feedbackType = arg.split('=')[1]
  } else if (arg.startsWith('--limit=')) {
    filters.limit = parseInt(arg.split('=')[1], 10)
  } else if (arg.startsWith('--book-id=')) {
    filters.bookId = arg.split('=')[1]
  }
})

viewFeedback(filters).catch(console.error)
