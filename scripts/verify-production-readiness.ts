#!/usr/bin/env tsx
/**
 * Production Readiness Verification Script
 * 
 * This script helps verify critical configuration before public beta launch.
 * Run this locally to check your setup before deploying.
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
dotenv.config({ path: '.env.local' })

interface VerificationResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  action?: string
}

const results: VerificationResult[] = []

function addResult(name: string, status: 'pass' | 'fail' | 'warning', message: string, action?: string) {
  results.push({ name, status, message, action })
}

function checkEnvVar(name: string, required: boolean = true): boolean {
  const value = process.env[name]
  const exists = !!value && value.length > 0
  
  if (required) {
    if (exists) {
      addResult(
        `Environment Variable: ${name}`,
        'pass',
        `✓ Set (length: ${value!.length} chars)`
      )
      return true
    } else {
      addResult(
        `Environment Variable: ${name}`,
        'fail',
        `✗ Missing - Required for production`,
        `Set ${name} in Vercel Dashboard → Settings → Environment Variables`
      )
      return false
    }
  } else {
    if (exists) {
      addResult(
        `Environment Variable: ${name}`,
        'pass',
        `✓ Set (optional)`
      )
    } else {
      addResult(
        `Environment Variable: ${name}`,
        'warning',
        `⚠ Not set (optional)`
      )
    }
    return true
  }
}

async function checkSupabaseConnection(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    addResult(
      'Supabase Connection',
      'fail',
      '✗ Cannot test - Missing Supabase credentials'
    )
    return false
  }
  
  try {
    const supabase = createClient(url, key)
    const { data, error } = await supabase.from('books').select('id').limit(1)
    
    if (error) {
      addResult(
        'Supabase Connection',
        'fail',
        `✗ Connection failed: ${error.message}`,
        'Check RLS policies and database access'
      )
      return false
    }
    
    addResult(
      'Supabase Connection',
      'pass',
      '✓ Connected successfully'
    )
    return true
  } catch (error: any) {
    addResult(
      'Supabase Connection',
      'fail',
      `✗ Error: ${error.message}`,
      'Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
    return false
  }
}

function checkRateLimitConfig(): void {
  const limit = parseInt(process.env.SCAN_RATE_LIMIT || '5', 10)
  const deepCost = parseInt(process.env.DEEP_SCAN_COST || '2', 10)
  const quickCost = parseInt(process.env.QUICK_SCAN_COST || '1', 10)
  
  addResult(
    'Rate Limit Configuration',
    limit <= 5 ? 'warning' : 'pass',
    `Current: ${limit} scans/day per IP (Deep: ${deepCost} credits, Quick: ${quickCost} credits)`,
    limit <= 5 
      ? 'Consider increasing SCAN_RATE_LIMIT to 10-20 for beta testing'
      : undefined
  )
}

function checkApiKeys(): void {
  const openaiKey = process.env.OPENAI_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY
  
  if (openaiKey) {
    const isValidFormat = openaiKey.startsWith('sk-') && openaiKey.length > 20
    addResult(
      'OpenAI API Key',
      isValidFormat ? 'pass' : 'warning',
      isValidFormat 
        ? '✓ Valid format detected'
        : '⚠ Format may be incorrect (should start with "sk-")'
    )
  }
  
  if (geminiKey) {
    const isValidFormat = geminiKey.length > 20
    addResult(
      'Gemini API Key',
      isValidFormat ? 'pass' : 'warning',
      isValidFormat 
        ? '✓ Valid format detected'
        : '⚠ Format may be incorrect'
    )
  }
}

function checkGeminiQuota(): void {
  const quotaLimit = parseInt(process.env.GEMINI_DAILY_QUOTA_LIMIT || '20', 10)
  const warningThreshold = parseInt(process.env.GEMINI_QUOTA_WARNING_THRESHOLD || '15', 10)
  
  addResult(
    'Gemini Quota Configuration',
    'pass',
    `Quota limit: ${quotaLimit}/day, Warning at: ${warningThreshold}`,
    quotaLimit !== 20 
      ? 'Verify this matches your actual Gemini API quota'
      : undefined
  )
}

async function main() {
  console.log('🔍 Production Readiness Verification\n')
  console.log('=' .repeat(60))
  console.log()
  
  // Check required environment variables
  console.log('📋 Checking Required Environment Variables...')
  checkEnvVar('NEXT_PUBLIC_SUPABASE_URL', true)
  checkEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', true)
  checkEnvVar('SUPABASE_SERVICE_ROLE_KEY', true)
  checkEnvVar('OPENAI_API_KEY', true)
  checkEnvVar('GEMINI_API_KEY', true)
  console.log()
  
  // Check optional environment variables
  console.log('📋 Checking Optional Environment Variables...')
  checkEnvVar('GOOGLE_SEARCH_API_KEY', false)
  checkEnvVar('GOOGLE_SEARCH_ENGINE_ID', false)
  checkEnvVar('SCAN_RATE_LIMIT', false)
  checkEnvVar('DEEP_SCAN_COST', false)
  checkEnvVar('QUICK_SCAN_COST', false)
  checkEnvVar('GEMINI_DAILY_QUOTA_LIMIT', false)
  checkEnvVar('GEMINI_QUOTA_WARNING_THRESHOLD', false)
  console.log()
  
  // Check API key formats
  console.log('🔑 Checking API Key Formats...')
  checkApiKeys()
  console.log()
  
  // Check rate limiting
  console.log('⚡ Checking Rate Limit Configuration...')
  checkRateLimitConfig()
  console.log()
  
  // Check Gemini quota
  console.log('🤖 Checking Gemini Quota Configuration...')
  checkGeminiQuota()
  console.log()
  
  // Test Supabase connection
  console.log('🗄️  Testing Supabase Connection...')
  await checkSupabaseConnection()
  console.log()
  
  // Print results
  console.log('=' .repeat(60))
  console.log('📊 VERIFICATION RESULTS\n')
  
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const warnings = results.filter(r => r.status === 'warning').length
  
  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'
    console.log(`${icon} ${result.name}`)
    console.log(`   ${result.message}`)
    if (result.action) {
      console.log(`   💡 Action: ${result.action}`)
    }
    console.log()
  })
  
  console.log('=' .repeat(60))
  console.log(`Summary: ${passed} passed, ${warnings} warnings, ${failed} failed\n`)
  
  if (failed > 0) {
    console.log('❌ CRITICAL ISSUES FOUND - Fix these before launching!')
    process.exit(1)
  } else if (warnings > 0) {
    console.log('⚠️  Warnings found - Review recommendations above')
    process.exit(0)
  } else {
    console.log('✅ All checks passed! Ready for production.')
    process.exit(0)
  }
}

main().catch(error => {
  console.error('Error running verification:', error)
  process.exit(1)
})
