import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function resetInvite(code: string) {
  const { data, error } = await supabase
    .from('vip_codes')
    .update({ is_used: false })
    .eq('code', code)
    .select('code, is_used')
    .single()

  if (error) {
    console.error('Error resetting invite:', error)
    process.exit(1)
  }

  if (!data) {
    console.error('No invite found with that code.')
    process.exit(1)
  }

  console.log('✅ Invite reset successfully!')
  console.log(`Code: ${data.code} (is_used: ${data.is_used})`)
  console.log('\nShare this link (one-time use):')
  console.log(`https://www.subtextscanner.com.au/api/invite/${data.code}`)
}

const code = process.argv[2]
if (!code) {
  console.error('Usage: npx tsx scripts/reset-invite.ts <code>')
  process.exit(1)
}

resetInvite(code)
