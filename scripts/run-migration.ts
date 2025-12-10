import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function runMigration() {
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/20251210_create_rlhf_comparisons.sql')
  const sql = fs.readFileSync(migrationPath, 'utf-8')

  console.log('📦 Running migration: 20251210_create_rlhf_comparisons.sql\n')

  // Execute SQL using Supabase REST API (via a function or direct)
  // Since we can't execute raw SQL directly, we'll use the admin client
  // which has more permissions
  
  // Split into statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'))

  // Check if table exists first
  const { data: existingTable } = await supabase
    .from('rlhf_comparisons')
    .select('id')
    .limit(1)

  if (existingTable !== null) {
    console.log('✅ Table rlhf_comparisons already exists!')
    return
  }

  console.log('⚠️  Cannot execute DDL via Supabase JS client')
  console.log('📋 Please run this migration manually:\n')
  console.log('1. Go to your Supabase Dashboard')
  console.log('2. Navigate to SQL Editor')
  console.log('3. Copy and paste the contents of:')
  console.log('   supabase/migrations/20251210_create_rlhf_comparisons.sql')
  console.log('4. Click "Run"\n')
  
  console.log('Or use psql:')
  console.log(`psql "${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', 'postgresql://postgres:')}" -f ${migrationPath}`)
}

runMigration().catch(console.error)
