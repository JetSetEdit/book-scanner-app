import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/utils/admin-auth'
import { getClientIP, isIpAllowlisted } from '@/lib/utils/rate-limiter'
import fs from 'fs'
import path from 'path'

/**
 * POST /api/run-migration
 * Execute database migration (LEGACY).
 * Requires x-admin-secret header (ADMIN_SECRET or DEBUG_IP_SECRET) and IP allowlist when configured.
 *
 * @deprecated Do not use for new migrations. Prefer Supabase MCP apply_migration with files in
 *   supabase/migrations/ (see OpenSpec capability database-migrations and .cursorrules).
 */
export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth) return auth;
  
  const allowlistRaw = process.env.RATE_LIMIT_IP_ALLOWLIST || ''
  if (allowlistRaw.trim().length > 0) {
    const clientIP = getClientIP(request)
    if (!isIpAllowlisted(clientIP)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
  }

  try {
    // Read the migration SQL from file
    const migrationPath = path.join(process.cwd(), 'scripts', '017_create_ai_audit_logs_table.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('Executing migration:', migrationSQL.substring(0, 100) + '...')

    // Execute the migration using RPC or direct SQL
    // Note: Supabase PostgREST doesn't support DO blocks directly or multiple statements well
    // We'll need to use the Supabase client's raw SQL execution if available via RPC
    
    // Check if exec_sql function exists (commonly added for migrations)
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      console.error('RPC exec_sql failed:', error)
      
      // Since we can't easily run raw SQL via the JS client without a custom RPC function,
      // we will return the SQL so the user can run it manually in the Supabase dashboard.
      // This is a safe fallback.
      
      return NextResponse.json({
        error: 'Automatic migration execution unavailable',
        message: 'Please copy the SQL below and run it in your Supabase SQL Editor:',
        sql: migrationSQL
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to read or execute migration script'
    }, { status: 500 })
  }
}
