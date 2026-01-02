#!/usr/bin/env tsx
/**
 * Clean up "Gone Girl" data from database
 * Removes warnings and optionally the book entry
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const ISBN = '9780307588371'

async function cleanGoneGirl() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log(`\n🧹 Cleaning up "Gone Girl" (ISBN: ${ISBN})...\n`)

  // Find the book
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('id, title')
    .eq('isbn', ISBN)
    .single()

  if (bookError || !book) {
    console.log('❌ Book not found in database')
    return
  }

  console.log(`📖 Found book: ${book.title} (ID: ${book.id})\n`)

  // Delete content warnings
  console.log('🗑️  Deleting content warnings...')
  const { error: warningsError, count: warningsCount } = await supabase
    .from('content_warnings')
    .delete()
    .eq('book_id', book.id)
    .select('*', { count: 'exact', head: true })

  if (warningsError) {
    console.error('❌ Error deleting warnings:', warningsError.message)
  } else {
    console.log(`✅ Deleted ${warningsCount || 0} content warning(s)`)
  }

  // Delete audit logs
  console.log('🗑️  Deleting audit logs...')
  const { error: logsError, count: logsCount } = await supabase
    .from('ai_audit_logs')
    .delete()
    .eq('book_id', book.id)
    .select('*', { count: 'exact', head: true })

  if (logsError) {
    console.error('❌ Error deleting audit logs:', logsError.message)
  } else {
    console.log(`✅ Deleted ${logsCount || 0} audit log(s)`)
  }

  // Ask if user wants to delete the book entry too
  const args = process.argv.slice(2)
  if (args.includes('--delete-book')) {
    console.log('🗑️  Deleting book entry...')
    const { error: deleteBookError } = await supabase
      .from('books')
      .delete()
      .eq('id', book.id)

    if (deleteBookError) {
      console.error('❌ Error deleting book:', deleteBookError.message)
    } else {
      console.log('✅ Book entry deleted')
    }
  } else {
    console.log('\n💡 Book entry kept. To delete it too, run:')
    console.log(`   npx tsx scripts/clean-gone-girl.ts --delete-book`)
  }

  console.log('\n✅ Cleanup complete! You can now re-scan the book.')
}

cleanGoneGirl().catch(console.error)

