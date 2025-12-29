import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://tawolulyrlnpxjyyxpdw.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhd29sdWx5cmxucHhqeXl4cGR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ5NDM5NywiZXhwIjoyMDc1MDcwMzk3fQ.ige4kgvZav25IO9cINTl6mPgg-ACHDsG8t-hLBiGqSM"

const supabase = createClient(supabaseUrl, supabaseKey)

async function clearAllBooks() {
    console.log('⚠️  WARNING: This will delete ALL books and related data from the database!')
    console.log('⚠️  This includes:')
    console.log('   - All books')
    console.log('   - All content warnings')
    console.log('   - All AI audit logs')
    console.log('')

    // Get count first
    const { count } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })

    console.log(`📊 Found ${count} books to delete\n`)

    // Delete content warnings first (foreign key constraint)
    console.log('🗑️  Deleting content warnings...')
    const { error: warningsError } = await supabase
        .from('content_warnings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (warningsError) {
        console.error('❌ Error deleting warnings:', warningsError)
        return
    }
    console.log('✅ Content warnings deleted\n')

    // Delete AI audit logs
    console.log('🗑️  Deleting AI audit logs...')
    const { error: logsError } = await supabase
        .from('ai_audit_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (logsError) {
        console.error('❌ Error deleting logs:', logsError)
        return
    }
    console.log('✅ AI audit logs deleted\n')

    // Delete books
    console.log('🗑️  Deleting books...')
    const { error: booksError } = await supabase
        .from('books')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (booksError) {
        console.error('❌ Error deleting books:', booksError)
        return
    }
    console.log('✅ Books deleted\n')

    console.log('═══════════════════════════════════════')
    console.log('✅ Database cleared successfully!')
    console.log(`📊 Deleted ${count} books and all related data`)
    console.log('═══════════════════════════════════════')
}

clearAllBooks()
