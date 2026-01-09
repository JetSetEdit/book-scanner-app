#!/usr/bin/env tsx
/**
 * Check the analysis request and feedback queue
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
dotenv.config({ path: '.env.local' })

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('📋 Checking Analysis Request & Feedback Queue')
  console.log('='.repeat(80))
  console.log('')

  // Get analysis requests
  const { data: analysisRequests, error: analysisError } = await supabase
    .from('manual_handling_scans')
    .select('*')
    .eq('reason', 'analysis_request')
    .order('created_at', { ascending: false })
    .limit(50)

  // Get user feedback
  const { data: userFeedback, error: feedbackError } = await supabase
    .from('manual_handling_scans')
    .select('*')
    .eq('reason', 'user_feedback')
    .order('created_at', { ascending: false })
    .limit(50)

  // Get rate limit feedback
  const { data: rateLimitFeedback, error: rateLimitError } = await supabase
    .from('manual_handling_scans')
    .select('*')
    .eq('reason', 'rate_limit_feedback')
    .order('created_at', { ascending: false })
    .limit(50)

  if (analysisError) {
    console.error('Error fetching analysis requests:', analysisError)
  }
  if (feedbackError) {
    console.error('Error fetching user feedback:', feedbackError)
  }
  if (rateLimitError) {
    console.error('Error fetching rate limit feedback:', rateLimitError)
  }

  // Analysis Requests
  console.log('🔍 ANALYSIS REQUESTS')
  console.log('='.repeat(80))
  if (!analysisRequests || analysisRequests.length === 0) {
    console.log('   No analysis requests found.')
  } else {
    console.log(`   Found ${analysisRequests.length} request(s):\n`)
    analysisRequests.forEach((req, idx) => {
      const metadata = req.metadata as any || {}
      const status = req.status || 'pending'
      const createdAt = new Date(req.created_at).toLocaleString()
      
      console.log(`   ${idx + 1}. ${metadata.book_title || 'Unknown Book'}`)
      console.log(`      ISBN: ${req.isbn}`)
      console.log(`      Status: ${status}`)
      console.log(`      Requested: ${createdAt}`)
      if (metadata.request_count) {
        console.log(`      Request Count: ${metadata.request_count}`)
      }
      if (metadata.email) {
        console.log(`      Email: ${metadata.email}`)
      }
      if (metadata.page_url) {
        console.log(`      Page: ${metadata.page_url}`)
      }
      console.log('')
    })
  }

  console.log('')
  console.log('💬 USER FEEDBACK')
  console.log('='.repeat(80))
  if (!userFeedback || userFeedback.length === 0) {
    console.log('   No user feedback found.')
  } else {
    console.log(`   Found ${userFeedback.length} feedback entry(ies):\n`)
    userFeedback.forEach((fb, idx) => {
      const metadata = fb.metadata as any || {}
      const contextData = (fb as any).context_data as any || {}
      const status = fb.status || 'pending'
      const createdAt = new Date(fb.created_at).toLocaleString()
      
      console.log(`   ${idx + 1}. ${metadata.feedback_type || 'Unknown Type'}`)
      console.log(`      Status: ${status}`)
      console.log(`      Submitted: ${createdAt}`)
      
      // Show book context if available
      if ((fb as any).book_title) {
        console.log(`      Book: "${(fb as any).book_title}"`)
        if ((fb as any).book_author) {
          console.log(`      Author: ${(fb as any).book_author}`)
        }
        if ((fb as any).isbn && (fb as any).isbn !== 'N/A') {
          console.log(`      ISBN: ${(fb as any).isbn}`)
        }
      }
      
      if (metadata.message) {
        const messagePreview = metadata.message.length > 100 
          ? metadata.message.substring(0, 100) + '...'
          : metadata.message
        console.log(`      Message: ${messagePreview}`)
      }
      if (metadata.email) {
        console.log(`      Email: ${metadata.email}`)
      }
      if (metadata.page_url) {
        console.log(`      Page: ${metadata.page_url}`)
      }
      if ((fb as any).app_version) {
        console.log(`      App Version: ${(fb as any).app_version}`)
      }
      if (contextData.warnings_count !== null && contextData.warnings_count !== undefined) {
        console.log(`      Warnings Count: ${contextData.warnings_count}`)
      }
      if (contextData.analysis_status) {
        console.log(`      Analysis Status: ${contextData.analysis_status}`)
      }
      if (metadata.submission_count) {
        console.log(`      Submission Count: ${metadata.submission_count}`)
      }
      console.log('')
    })
  }

  console.log('')
  console.log('⏱️  RATE LIMIT FEEDBACK')
  console.log('='.repeat(80))
  if (!rateLimitFeedback || rateLimitFeedback.length === 0) {
    console.log('   No rate limit feedback found.')
  } else {
    console.log(`   Found ${rateLimitFeedback.length} rate limit feedback entry(ies):\n`)
    rateLimitFeedback.forEach((fb, idx) => {
      const metadata = fb.metadata as any || {}
      const status = fb.status || 'pending'
      const createdAt = new Date(fb.created_at).toLocaleString()
      
      console.log(`   ${idx + 1}. ${metadata.feedback_type || 'Unknown Type'}`)
      console.log(`      Status: ${status}`)
      console.log(`      Submitted: ${createdAt}`)
      if (metadata.message) {
        const messagePreview = metadata.message.length > 100 
          ? metadata.message.substring(0, 100) + '...'
          : metadata.message
        console.log(`      Message: ${messagePreview}`)
      }
      if (metadata.email) {
        console.log(`      Email: ${metadata.email}`)
      }
      if (metadata.use_case) {
        console.log(`      Use Case: ${metadata.use_case}`)
      }
      console.log('')
    })
  }

  // Summary
  console.log('')
  console.log('='.repeat(80))
  console.log('📊 SUMMARY')
  console.log('='.repeat(80))
  console.log(`   Analysis Requests: ${analysisRequests?.length || 0}`)
  console.log(`   User Feedback: ${userFeedback?.length || 0}`)
  console.log(`   Rate Limit Feedback: ${rateLimitFeedback?.length || 0}`)
  console.log(`   Total Pending Items: ${(analysisRequests?.length || 0) + (userFeedback?.length || 0) + (rateLimitFeedback?.length || 0)}`)
  console.log('')
}

main().catch(console.error)

