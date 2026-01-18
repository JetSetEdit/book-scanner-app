import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function deleteInvite(code: string) {
  console.log(`Deleting invite code: ${code}`)

  const { error } = await supabase
    .from('vip_codes')
    .delete()
    .eq('code', code)

  if (error) {
    console.error('Error deleting invite:', error)
    return
  }

  console.log('✅ Invite deleted successfully!')
}

// Get code from command line arg
const args = process.argv.slice(2)
const code = args[0]

if (!code) {
  console.error('Please provide the code to delete')
  process.exit(1)
}

deleteInvite(code)
