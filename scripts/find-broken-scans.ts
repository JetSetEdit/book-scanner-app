
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://tawolulyrlnpxjyyxpdw.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhd29sdWx5cmxucHhqeXl4cGR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ5NDM5NywiZXhwIjoyMDc1MDcwMzk3fQ.ige4kgvZav25IO9cINTl6mPgg-ACHDsG8t-hLBiGqSM"

const supabase = createClient(supabaseUrl, supabaseKey)

async function findBrokenScans() {
    console.log('🔍 Finding books with "warnings_generated" but 0 actual warnings...\n')

    // Get all books
    const { data: books } = await supabase
        .from('books')
        .select('id, isbn, title, author')

    if (!books) {
        console.log('No books found')
        return
    }

    const brokenBooks = []

    for (const book of books) {
        // Check if there's a "warnings_generated" audit log
        const { data: logs } = await supabase
            .from('ai_audit_logs')
            .select('*')
            .eq('book_id', book.id)
            .eq('decision_type', 'warnings_generated')

        if (logs && logs.length > 0) {
            // Check actual warnings count
            const { data: warnings } = await supabase
                .from('content_warnings')
                .select('id')
                .eq('book_id', book.id)

            if (!warnings || warnings.length === 0) {
                brokenBooks.push({
                    isbn: book.isbn,
                    title: book.title,
                    author: book.author,
                    audit_reasoning: logs[0].ai_reasoning
                })
            }
        }
    }

    if (brokenBooks.length === 0) {
        console.log('✅ No broken scans found!')
    } else {
        console.log(`❌ Found ${brokenBooks.length} books with missing warnings:\n`)
        brokenBooks.forEach(book => {
            console.log(`📖 ${book.title} by ${book.author}`)
            console.log(`   ISBN: ${book.isbn}`)
            console.log(`   Audit Log: ${book.audit_reasoning}`)
            console.log('---')
        })
    }
}

findBrokenScans()
