/**
 * Test script to verify description text matches computed severity
 * Tests the updateDescriptionForSeverity function
 */

import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { supabaseAdmin } from '@/lib/supabase/admin'

async function testDescriptionSeverityFix() {
  console.log('Testing description/severity alignment...\n')

  // Test with "Verity" (ISBN: 9781408726600)
  const testIsbn = '9781408726600'
  
  const { data: book, error: bookError } = await supabaseAdmin
    .from('books')
    .select('id, title, isbn')
    .eq('isbn', testIsbn)
    .single()

  if (bookError || !book) {
    console.error('Book not found:', bookError)
    return
  }

  const { data: warnings, error: warningsError } = await supabaseAdmin
    .from('content_warnings')
    .select('*')
    .eq('book_id', book.id)
    .order('severity', { ascending: false })

  if (warningsError) {
    console.error('Error fetching warnings:', warningsError)
    return
  }

  console.log(`Found ${warnings.length} warnings for "${book.title}"\n`)

  let mismatchCount = 0
  for (const warning of warnings) {
    const description = warning.description || ''
    const severity = warning.severity

    // Check if description intensity matches severity
    const hasStrong = /^Strong\s+/i.test(description)
    const hasModerate = /^Moderate\s+/i.test(description)
    const hasMild = /^Mild\s+/i.test(description)

    let expectedIntensity: string
    let actualIntensity: string | null = null

    if (hasStrong) actualIntensity = 'Strong'
    else if (hasModerate) actualIntensity = 'Moderate'
    else if (hasMild) actualIntensity = 'Mild'

    if (severity === 'severe') expectedIntensity = 'Strong'
    else if (severity === 'moderate') expectedIntensity = 'Moderate'
    else if (severity === 'mild') expectedIntensity = 'Mild'
    else expectedIntensity = 'Unknown'

    const matches = actualIntensity?.toLowerCase() === expectedIntensity.toLowerCase()

    if (!matches) {
      mismatchCount++
      console.log(`❌ MISMATCH:`)
      console.log(`   Severity: ${severity.toUpperCase()}`)
      console.log(`   Description: "${description}"`)
      console.log(`   Expected: "${expectedIntensity}"`)
      console.log(`   Actual: "${actualIntensity || 'None'}"`)
      console.log()
    } else {
      console.log(`✅ Match: ${severity.toUpperCase()} - "${description}"`)
    }
  }

  console.log(`\n${mismatchCount === 0 ? '✅ All descriptions match severity!' : `⚠️  Found ${mismatchCount} mismatch(es)`}`)
}

testDescriptionSeverityFix().catch(console.error)

