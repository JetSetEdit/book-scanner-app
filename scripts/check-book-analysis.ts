import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBook(isbn: string) {
  console.log(`\n🔍 Checking book: ${isbn}\n`)
  
  // Get book
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('id, title, author, isbn, description')
    .eq('isbn', isbn)
    .single()
  
  if (bookError || !book) {
    console.log('❌ Book not found in database')
    return
  }
  
  console.log(`📚 Book: ${book.title} by ${book.author}`)
  console.log(`   ID: ${book.id}`)
  console.log(`   Description Length: ${book.description?.length || 0} chars`)
  
  // Get warnings
  const { data: warnings } = await supabase
    .from('content_warnings')
    .select('id, category, severity, description')
    .eq('book_id', book.id)
  
  console.log(`\n⚠️  Content Warnings: ${warnings?.length || 0}`)
  if (warnings && warnings.length > 0) {
    warnings.forEach(w => {
      console.log(`   - [${w.severity}] ${w.category}: ${w.description?.substring(0, 60)}...`)
    })
  }
  
  // Get audit logs
  const { data: auditLogs } = await supabase
    .from('ai_audit_logs')
    .select('*')
    .eq('book_id', book.id)
    .order('created_at', { ascending: false })
  
  console.log(`\n📋 Audit Logs: ${auditLogs?.length || 0}`)
  if (auditLogs && auditLogs.length > 0) {
    auditLogs.forEach((log, i) => {
      console.log(`\n   Log ${i + 1}:`)
      console.log(`   - Decision: ${log.decision_type}`)
      console.log(`   - Warnings Count: ${log.warnings_count}`)
      console.log(`   - Created: ${log.created_at}`)
      console.log(`   - Confidence: ${log.confidence_level || 'N/A'}`)
      console.log(`   - Had Thin Metadata: ${log.had_thin_metadata}`)
      console.log(`   - Used Web Search: ${log.used_web_search}`)
      console.log(`   - Reasoning: ${log.ai_reasoning?.substring(0, 200)}...`)
    })
  } else {
    console.log('   ❌ No audit logs found - book has NOT been analyzed by AI')
  }
}

async function main() {
  // Check Verity (9781408726600) and Book Lovers (9780593440872)
  await checkBook('9781408726600')
  await checkBook('9780593440872')
}

main().catch(console.error)

