import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function backfillMissingISBNs() {
  console.log('🔍 Finding feedback entries with missing ISBNs...\n')

  // Find feedback with missing or N/A ISBNs
  const { data: feedbackEntries, error: fetchError } = await supabase
    .from('manual_handling_scans')
    .select('id, isbn, metadata')
    .eq('reason', 'user_feedback')
    .or('isbn.is.null,isbn.eq.N/A')
    .order('created_at', { ascending: false })

  if (fetchError) {
    console.error('Error fetching feedback:', fetchError)
    return
  }

  if (!feedbackEntries || feedbackEntries.length === 0) {
    console.log('✅ No feedback entries with missing ISBNs found.')
    return
  }

  console.log(`Found ${feedbackEntries.length} feedback entry(ies) with missing ISBNs\n`)

  let updated = 0
  let skipped = 0

  for (const entry of feedbackEntries) {
    const metadata = entry.metadata as any || {}
    const pageUrl = metadata.page_url as string | undefined

    if (!pageUrl) {
      console.log(`⏭️  Skipping entry ${entry.id}: No page_url in metadata`)
      skipped++
      continue
    }

    // Extract ISBN from URL
    const bookPageMatch = pageUrl.match(/\/book\/([0-9X-]+)/)
    if (!bookPageMatch) {
      console.log(`⏭️  Skipping entry ${entry.id}: No ISBN found in URL: ${pageUrl}`)
      skipped++
      continue
    }

    const extractedIsbn = bookPageMatch[1].replace(/-/g, '')

    // Update the entry
    const { error: updateError } = await supabase
      .from('manual_handling_scans')
      .update({ isbn: extractedIsbn })
      .eq('id', entry.id)

    if (updateError) {
      console.error(`❌ Error updating entry ${entry.id}:`, updateError)
      skipped++
    } else {
      console.log(`✅ Updated entry ${entry.id}: ISBN ${extractedIsbn} (from ${pageUrl})`)
      updated++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Total: ${feedbackEntries.length}`)
}

backfillMissingISBNs().catch(console.error)
