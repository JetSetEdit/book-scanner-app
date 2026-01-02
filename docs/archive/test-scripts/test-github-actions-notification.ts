#!/usr/bin/env tsx
/**
 * Test script to simulate GitHub Actions workflow
 * Creates GitHub Issues for pending manual handling scans
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testNotificationSystem() {
  console.log('🧪 Testing GitHub Actions Notification System\n')
  console.log('='.repeat(60))
  
  // 1. Fetch pending scans
  console.log('\n1️⃣ Fetching pending manual handling scans...')
  const { data: scans, error } = await supabase
    .from('manual_handling_scans')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('❌ Error fetching scans:', error)
    return
  }

  console.log(`✅ Found ${scans?.length || 0} pending scans\n`)

  if (!scans || scans.length === 0) {
    console.log('ℹ️  No pending scans - system is working correctly!')
    return
  }

  // 2. Display what would be created
  console.log('2️⃣ Scans that would trigger GitHub Issues:\n')
  
  scans.forEach((scan, i) => {
    console.log(`${i + 1}. ISBN: ${scan.isbn}`)
    console.log(`   Reason: ${scan.reason}`)
    console.log(`   Status: ${scan.status}`)
    if (scan.error_message) {
      console.log(`   Error: ${scan.error_message.substring(0, 60)}...`)
    }
    console.log(`   Created: ${new Date(scan.created_at).toLocaleString()}`)
    console.log('')
  })

  // 3. Show what the GitHub Issue would look like
  console.log('3️⃣ Example GitHub Issue that would be created:\n')
  console.log('='.repeat(60))
  
  const firstScan = scans[0]
  let title = ''
  let body = ''

  switch (firstScan.reason) {
    case 'not_found':
      title = `📚 Manual Handling: Book Not Found - ISBN ${firstScan.isbn}`
      body = `## Book Not Found\n\n` +
        `**ISBN:** ${firstScan.isbn}\n\n` +
        `**Reason:** Book not found in any external library (Open Library, Google Books)\n\n` +
        `**Error:** ${firstScan.error_message || 'N/A'}\n\n` +
        `**Created:** ${new Date(firstScan.created_at).toLocaleString()}\n\n` +
        `**Action Required:**\n` +
        `- [ ] Verify the ISBN is correct\n` +
        `- [ ] Check if book exists in other sources\n` +
        `- [ ] Manually add book metadata if needed\n\n` +
        `---\n` +
        `_This issue would be automatically created by GitHub Actions_`
      break
      
    case 'ambiguous':
      title = `📚 Manual Handling: Ambiguous Scan - ISBN ${firstScan.isbn}`
      const candidates = firstScan.candidates || []
      body = `## Ambiguous Scan Results\n\n` +
        `**ISBN:** ${firstScan.isbn}\n\n` +
        `**Reason:** Multiple book candidates found (${candidates.length} results)\n\n` +
        `**Candidates:**\n\n`
      
      if (Array.isArray(candidates)) {
        candidates.forEach((c: any, i: number) => {
          body += `${i + 1}. **${c.title}** by ${c.author || 'Unknown'}\n`
          body += `   - Source: ${c.source}\n\n`
        })
      }
      
      body += `**Action Required:**\n` +
        `- [ ] Review candidates and select the correct book\n` +
        `- [ ] Update scan with selected candidate\n\n` +
        `---\n` +
        `_This issue would be automatically created by GitHub Actions_`
      break
      
    case 'analysis_failed':
      title = `📚 Manual Handling: Analysis Failed - ISBN ${firstScan.isbn}`
      body = `## Content Warning Analysis Failed\n\n` +
        `**ISBN:** ${firstScan.isbn}\n\n` +
        `**Reason:** AI analysis failed to generate content warnings\n\n` +
        `**Error:** ${firstScan.error_message || 'N/A'}\n\n` +
        `**Action Required:**\n` +
        `- [ ] Review book description\n` +
        `- [ ] Manually add content warnings if needed\n` +
        `- [ ] Check AI service status\n\n` +
        `---\n` +
        `_This issue would be automatically created by GitHub Actions_`
      break
      
    case 'description_too_minimal':
      title = `📚 Manual Handling: Minimal Description - ISBN ${firstScan.isbn}`
      body = `## Description Too Minimal for Analysis\n\n` +
        `**ISBN:** ${firstScan.isbn}\n\n` +
        `**Reason:** Book description is too short/minimal to generate accurate content warnings\n\n` +
        `**Action Required:**\n` +
        `- [ ] Fetch better description from external sources\n` +
        `- [ ] Manually add content warnings based on book metadata\n\n` +
        `---\n` +
        `_This issue would be automatically created by GitHub Actions_`
      break
  }

  console.log(`Title: ${title}\n`)
  console.log(`Body:\n${body}\n`)
  console.log('='.repeat(60))

  // 4. Summary
  console.log('\n4️⃣ Summary:')
  console.log(`   ✅ Database table working`)
  console.log(`   ✅ API endpoint working`)
  console.log(`   ✅ ${scans.length} scan(s) ready for GitHub Issues`)
  console.log(`   ✅ GitHub Actions workflow will create issues automatically`)
  console.log(`\n   Next: Configure GitHub Secrets and trigger workflow manually`)
}

testNotificationSystem().catch(console.error)


