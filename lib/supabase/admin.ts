import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Safely create admin client - will be used with error handling in functions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey
)
