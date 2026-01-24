import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkFeedbackISBNs() {
  // Check for feedback with missing or N/A ISBNs
  const { data: missingIsbn } = await supabase
    .from('manual_handling_scans')
    .select('*')
    .eq('reason', 'user_feedback')
    .or('isbn.is.null,isbn.eq.N/A')
    .order('created_at', { ascending: false })
    .limit(20)

  console.log('📋 Feedback with missing or N/A ISBN:')
  console.log('='.repeat(100))
  if (!missingIsbn || missingIsbn.length === 0) {
    console.log('   ✅ None found - all feedback has ISBNs')
  } else {
    console.log(`   Found ${missingIsbn.length} feedback entry(ies) with missing ISBN\n`)
    missingIsbn.forEach((fb: any, idx: number) => {
      const metadata = fb.metadata as any || {}
      console.log(`${idx + 1}. ${metadata.feedback_type || 'Unknown'} [${fb.status}]`)
      console.log(`   📅 Submitted: ${new Date(fb.created_at).toLocaleString()}`)
      console.log(`   📖 Book: "${fb.book_title || 'N/A'}" by ${fb.book_author || 'N/A'}`)
      console.log(`   💬 Message: ${(metadata.message || '').substring(0, 150)}...`)
      if (metadata.page_url) {
        console.log(`   🌐 URL: ${metadata.page_url}`)
      }
      console.log('')
    })
  }

  // Check for feedback about the feedback system itself
  const { data: allFeedback } = await supabase
    .from('manual_handling_scans')
    .select('*')
    .eq('reason', 'user_feedback')
    .order('created_at', { ascending: false })
    .limit(50)

  const feedbackSystemIssues = allFeedback?.filter((fb: any) => {
    const message = (fb.metadata?.message || '').toLowerCase()
    return (
      message.includes('feedback') && (
        message.includes('not work') ||
        message.includes("didn't submit") ||
        message.includes("couldn't submit") ||
        message.includes('submit') ||
        message.includes('broken') ||
        message.includes('error submitting') ||
        message.includes('issue with feedback')
      )
    )
  }) || []

  console.log('\n\n🔍 Feedback about feedback system issues:')
  console.log('='.repeat(100))
  if (feedbackSystemIssues.length === 0) {
    console.log('   ✅ None found - no feedback about feedback system problems')
  } else {
    console.log(`   Found ${feedbackSystemIssues.length} feedback entry(ies) about feedback system\n`)
    feedbackSystemIssues.forEach((fb: any, idx: number) => {
      const metadata = fb.metadata as any || {}
      console.log(`${idx + 1}. ${metadata.feedback_type || 'Unknown'} [${fb.status}]`)
      console.log(`   📅 Submitted: ${new Date(fb.created_at).toLocaleString()}`)
      console.log(`   💬 Message: ${metadata.message || ''}`)
      if (fb.isbn && fb.isbn !== 'N/A') {
        console.log(`   📖 ISBN: ${fb.isbn}`)
      }
      console.log('')
    })
  }
}

checkFeedbackISBNs().catch(console.error)
