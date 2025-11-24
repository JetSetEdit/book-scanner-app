
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://tawolulyrlnpxjyyxpdw.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhd29sdWx5cmxucHhqeXl4cGR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ5NDM5NywiZXhwIjoyMDc1MDcwMzk3fQ.ige4kgvZav25IO9cINTl6mPgg-ACHDsG8t-hLBiGqSM"

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateSchema() {
    console.log('🔧 Updating database schema to add new categories...\n')

    // Drop existing constraint
    const { error: dropError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE content_warnings DROP CONSTRAINT IF EXISTS content_warnings_category_check;'
    })

    if (dropError) {
        console.error('❌ Failed to drop constraint:', dropError)
        console.log('\n⚠️  Trying alternative method...\n')
    }

    // Add new constraint
    const { error: addError } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE content_warnings ADD CONSTRAINT content_warnings_category_check 
      CHECK (category IN ('violence', 'sexual_content', 'substance_abuse', 'mental_health', 'death', 'abuse', 'discrimination', 'relationships', 'language', 'other'));`
    })

    if (addError) {
        console.error('❌ Failed to add constraint:', addError)
        console.log('\n📝 Please run this SQL manually in Supabase Dashboard > SQL Editor:\n')
        console.log(`
ALTER TABLE content_warnings DROP CONSTRAINT IF EXISTS content_warnings_category_check;
ALTER TABLE content_warnings ADD CONSTRAINT content_warnings_category_check 
  CHECK (category IN ('violence', 'sexual_content', 'substance_abuse', 'mental_health', 'death', 'abuse', 'discrimination', 'relationships', 'language', 'other'));
    `)
        return
    }

    console.log('✅ Schema updated successfully!')
}

updateSchema()
