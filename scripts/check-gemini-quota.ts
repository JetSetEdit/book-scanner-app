#!/usr/bin/env tsx
/**
 * Check Gemini API Quota Status
 * 
 * Attempts to make a minimal API call to check if quota is available
 */

import 'dotenv/config'
import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ Missing GEMINI_API_KEY in .env.local')
  process.exit(1)
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

async function checkQuota() {
  console.log('🔍 Checking Gemini API Quota Status...\n')
  
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  
  try {
    console.log('📡 Making minimal test request...')
    const result = await model.generateContent('Hi')
    const response = await result.response
    const text = response.text()
    
    console.log('✅ Quota Available!')
    console.log(`   Response: "${text.trim()}"`)
    console.log('\n💡 Gemini API is working and has quota remaining.')
    return true
  } catch (error: any) {
    if (error.status === 429) {
      console.log('❌ Rate Limit / Quota Exceeded')
      
      // Try to extract retry delay
      const retryMatch = error.message?.match(/retry in ([\d.]+)s/i)
      if (retryMatch) {
        const seconds = parseFloat(retryMatch[1])
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = Math.floor(seconds % 60)
        console.log(`   ⏰ Retry in: ${minutes}m ${remainingSeconds}s`)
      }
      
      // Check if it's daily or per-minute limit
      if (error.message?.includes('PerDay')) {
        console.log('   📅 Daily quota exceeded - resets at midnight')
      } else if (error.message?.includes('PerMinute')) {
        console.log('   ⏱️  Per-minute quota exceeded - resets every minute')
      }
      
      console.log('\n💡 Options:')
      console.log('   1. Wait for quota reset (automatic)')
      console.log('   2. Sign in at https://ai.dev/usage?tab=rate-limit to check detailed usage')
      console.log('   3. System will continue using OpenAI only until quota resets')
      
      return false
    } else if (error.status === 404) {
      console.log('❌ Model not found (404)')
      console.log('   This shouldn\'t happen - model name may be wrong')
      return false
    } else {
      console.log(`❌ Error: ${error.message || JSON.stringify(error)}`)
      return false
    }
  }
}

checkQuota().catch(console.error)

