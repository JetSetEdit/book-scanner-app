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

async function generateInvite(customCode?: string, label?: string) {
  // Generate a random code if not provided
  const code = customCode || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

  console.log(`Generating VIP invite code${label ? ` for ${label}` : ''}: ${code}`)

  const insertPayload: { code: string; label?: string } = { code }
  if (label) insertPayload.label = label

  const { error } = await supabase
    .from('vip_codes')
    .insert(insertPayload)

  if (error) {
    console.error('Error creating invite:', error)
    process.exit(1)
  }

  const inviteUrl = `https://www.subtextscanner.com.au/api/invite/${code}`
  console.log('\n✅ Invite created successfully!')
  console.log('Share this link (one-time use):')
  console.log(inviteUrl)
  console.log('\n(Or for local testing: http://localhost:3000/api/invite/' + code + ')')
  if (label) {
    console.log('\n--- Message you can send ---')
    console.log(`Hi ${label},\n\nHere’s your Subtext invite link. Tap it to unlock the scanner — it’s one-time use, so open it on the device you’ll use:\n\n${inviteUrl}\n\nEnjoy!\n`)
  }
}

// Usage: npx tsx scripts/create-invite.ts [customCode] [label]
const args = process.argv.slice(2)
const customCode = args[0] || undefined
const label = args[1] || undefined

generateInvite(customCode, label)
