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

async function listInvites() {
  const { data, error } = await supabase
    .from('vip_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error listing invites:', error)
    return
  }

  console.log('Current VIP Codes:')
  data.forEach((invite, index) => {
    console.log(`${index + 1}. Code: ${invite.code}`)
    console.log(`   Created: ${new Date(invite.created_at).toLocaleString()}`)
    console.log(`   Used At: ${invite.used_at ? new Date(invite.used_at).toLocaleString() : 'Not used'}`)
    console.log('---')
  })
}

listInvites()
