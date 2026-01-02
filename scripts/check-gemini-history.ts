#!/usr/bin/env tsx
/**
 * Check Gemini API Usage History
 * 
 * Checks usage history via the API and local database logs
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load .env.local
const envPaths = [
  path.join(__dirname, '..', '.env.local'),
  path.join(process.cwd(), '.env.local'),
  '.env.local'
]

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
    break
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function checkAPIUsage() {
  console.log('📡 Checking Gemini API Usage via API...\n')
  
  if (!process.env.GEMINI_API_KEY) {
    console.log('❌ No GEMINI_API_KEY found')
    return
  }

  try {
    // Try to get usage info from the API
    // Note: The Gemini API doesn't have a direct usage endpoint in the SDK
    // But we can check the rate limit endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    )
    
    if (response.ok) {
      console.log('✅ API connection successful')
      console.log('   (Usage details are available at https://ai.dev/usage?tab=rate-limit)')
    } else {
      console.log(`❌ API request failed: ${response.status}`)
    }
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`)
  }
}

async function checkDatabaseLogs() {
  if (!supabaseUrl || !supabaseKey) {
    console.log('\n⚠️  No Supabase credentials - skipping database check')
    return
  }

  console.log('\n📊 Checking Database Logs for Gemini Usage...\n')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Check audit logs for any Gemini-related entries
    const { data: logs, error } = await supabase
      .from('ai_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) {
      console.log(`❌ Database error: ${error.message}`)
      return
    }
    
    if (!logs || logs.length === 0) {
      console.log('📭 No audit logs found')
      return
    }
    
    console.log(`📋 Found ${logs.length} recent audit log entries\n`)
    
    // Check for multi-model usage (which includes Gemini)
    const multiModelLogs = logs.filter(log => 
      log.model_version?.includes('multi') || 
      log.ai_reasoning?.toLowerCase().includes('gemini') ||
      log.pipeline_path?.includes('multi')
    )
    
    if (multiModelLogs.length > 0) {
      console.log(`🤖 Found ${multiModelLogs.length} entries with multi-model/Gemini usage:\n`)
      
      multiModelLogs.slice(0, 10).forEach((log, i) => {
        console.log(`${i + 1}. ${log.book_title || 'Unknown'} (${log.isbn})`)
        console.log(`   Date: ${new Date(log.created_at).toLocaleString()}`)
        console.log(`   Warnings: ${log.warnings_count}`)
        if (log.model_version) {
          console.log(`   Model: ${log.model_version}`)
        }
        console.log('')
      })
    } else {
      console.log('📭 No multi-model/Gemini entries found in recent logs')
      console.log('   (This could mean Gemini wasn\'t used, or logs don\'t specify it)')
    }
    
    // Show recent scan activity
    console.log('\n📚 Recent Scan Activity (last 10):\n')
    logs.slice(0, 10).forEach((log, i) => {
      console.log(`${i + 1}. ${log.book_title || 'Unknown'} - ${new Date(log.created_at).toLocaleString()}`)
      console.log(`   Warnings: ${log.warnings_count}, Type: ${log.decision_type}`)
    })
    
  } catch (error: any) {
    console.log(`❌ Error checking database: ${error.message}`)
  }
}

async function checkConsoleLogs() {
  console.log('\n🔍 Checking for Local Logs...\n')
  
  // Check if there are any log files
  const logFiles = [
    'logs',
    '*.log',
    'npm-debug.log'
  ]
  
  console.log('💡 Console logs would be in your terminal/server output')
  console.log('   Look for messages containing "Gemini" or "gemini"')
  console.log('   Common patterns:')
  console.log('   - "Analyzing with Gemini..."')
  console.log('   - "Gemini analysis error:"')
  console.log('   - "Gemini rate limit exceeded"')
}

async function main() {
  console.log('🔍 Gemini API Usage History Check\n')
  console.log('─'.repeat(60))
  
  await checkAPIUsage()
  await checkDatabaseLogs()
  await checkConsoleLogs()
  
  console.log('\n' + '─'.repeat(60))
  console.log('\n💡 For detailed usage stats, visit:')
  console.log('   https://ai.dev/usage?tab=rate-limit')
  console.log('\n✅ Check complete!\n')
}

main().catch(console.error)

