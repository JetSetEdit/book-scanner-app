#!/usr/bin/env tsx
/**
 * Delete all books and related data from database
 * WARNING: This will delete ALL books, warnings, and audit logs
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

async function deleteAllBooks() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Safety check
  const args = process.argv.slice(2)
  if (args[0] !== '--confirm') {
    console.error('⚠️  WARNING: This will delete ALL books, warnings, and audit logs!')
    console.error('⚠️  Make sure you have a backup before proceeding!')
    console.error('\nTo proceed, run: npx tsx scripts/delete-all-books.ts --confirm')
    process.exit(1)
  }

  console.log('\n🗑️  Starting deletion of all books and related data...\n')

  // First, get counts
  const { count: booksCount } = await supabase
    .from('books')
    .select('*', { count: 'exact', head: true })

  const { count: warningsCount } = await supabase
    .from('content_warnings')
    .select('*', { count: 'exact', head: true })

  const { count: logsCount } = await supabase
    .from('ai_audit_logs')
    .select('*', { count: 'exact', head: true })

  console.log(`📊 Current data:`)
  console.log(`   Books: ${booksCount || 0}`)
  console.log(`   Content warnings: ${warningsCount || 0}`)
  console.log(`   Audit logs: ${logsCount || 0}\n`)

  // Delete in order (respecting foreign key constraints)
  console.log('🗑️  Deleting content warnings...')
  const { error: warningsError } = await supabase
    .from('content_warnings')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (warningsError) {
    console.error('❌ Error deleting warnings:', warningsError.message)
    process.exit(1)
  }
  console.log('✅ Content warnings deleted')

  console.log('🗑️  Deleting audit logs...')
  const { error: logsError } = await supabase
    .from('ai_audit_logs')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (logsError) {
    console.error('❌ Error deleting audit logs:', logsError.message)
    process.exit(1)
  }
  console.log('✅ Audit logs deleted')

  console.log('🗑️  Deleting books...')
  const { error: booksError } = await supabase
    .from('books')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (booksError) {
    console.error('❌ Error deleting books:', booksError.message)
    process.exit(1)
  }
  console.log('✅ Books deleted')

  console.log('\n✅ All books and related data deleted successfully!')
  console.log('💡 Database is now clean and ready for fresh scans.')
}

deleteAllBooks().catch(console.error)

