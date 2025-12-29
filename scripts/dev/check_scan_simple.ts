
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://tawolulyrlnpxjyyxpdw.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhd29sdWx5cmxucHhqeXl4cGR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ5NDM5NywiZXhwIjoyMDc1MDcwMzk3fQ.ige4kgvZav25IO9cINTl6mPgg-ACHDsG8t-hLBiGqSM"

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkScan(isbn: string) {
    console.log(`Checking scan results for ISBN: ${isbn}`)

    // 1. Get Book Details
    const { data: book, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('isbn', isbn)
        .single()

    if (bookError || !book) {
        console.log('❌ Book not found in database.')
        return
    }

    console.log('\n📚 Book Details:')
    console.log(`Title: ${book.title}`)
    console.log(`Author: ${book.author}`)
    console.log(`Description Length: ${book.description?.length || 0} chars`)
    console.log(`Categories: ${book.categories}`)

    // 2. Get Content Warnings
    const { data: warnings } = await supabase
        .from('content_warnings')
        .select('*')
        .eq('book_id', book.id)

    console.log(`\n⚠️ Content Warnings (${warnings?.length || 0}):`)
    warnings?.forEach(w => {
        console.log(`- [${w.severity}] ${w.category}: ${w.description}`)
        console.log(`  Reasoning: ${w.reasoning}`)
    })

    // 3. Get Audit Logs (to see decision making)
    const { data: logs } = await supabase
        .from('ai_audit_logs')
        .select('*')
        .eq('book_id', book.id)
        .order('created_at', { ascending: true })

    console.log(`\n🔍 AI Audit Logs (${logs?.length || 0}):`)
    logs?.forEach(log => {
        console.log(`- [${log.decision_type}] Confidence: ${log.confidence_level}`)
        console.log(`  Reasoning: ${log.ai_reasoning}`)
        console.log(`  Used Web Search: ${log.used_web_search}`)
        console.log('---')
    })
}

const isbn = process.argv[2]
if (!isbn) {
    console.log('Please provide an ISBN')
} else {
    checkScan(isbn)
}
