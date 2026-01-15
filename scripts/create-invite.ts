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

async function generateInvite(customCode?: string) {
  // Generate a random code if not provided
  const code = customCode || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

  console.log(`Generating VIP invite code: ${code}`)

  const { error } = await supabase
    .from('vip_codes')
    .insert({ code })

  if (error) {
    console.error('Error creating invite:', error)
    return
  }

  console.log('\n✅ Invite created successfully!')
  console.log('Share this link (one-time use):')
  console.log(`https://www.subtextscanner.com.au/api/invite/${code}`)
  console.log('\n(Or for local testing: http://localhost:3000/api/invite/' + code + ')')
}

// Get code from command line arg if present
const args = process.argv.slice(2)
const customCode = args[0]

generateInvite(customCode)
