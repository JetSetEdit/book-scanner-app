#!/usr/bin/env tsx
/**
 * Get Detailed Gemini API Usage
 * 
 * Attempts to fetch usage details from the Gemini API
 */

import 'dotenv/config'

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ Missing GEMINI_API_KEY')
  process.exit(1)
}

async function getUsageDetails() {
  console.log('📊 Fetching Gemini API Usage Details...\n')
  
  const apiKey = process.env.GEMINI_API_KEY
  
  // Try different API endpoints that might provide usage info
  const endpoints = [
    {
      name: 'Models List',
      url: `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    },
    // Note: Google doesn't expose a public usage API endpoint
    // Usage is only available through the web dashboard
  ]
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Checking: ${endpoint.name}`)
      const response = await fetch(endpoint.url)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Success`)
        
        if (data.models) {
          console.log(`   Found ${data.models.length} available models`)
          
          // Show models that support generateContent
          const textModels = data.models.filter((m: any) => 
            m.supportedGenerationMethods?.includes('generateContent')
          )
          
          console.log(`   ${textModels.length} models support generateContent`)
        }
      } else {
        const text = await response.text()
        console.log(`   Status: ${response.status}`)
        if (text.length < 200) {
          console.log(`   Response: ${text}`)
        }
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`)
    }
    console.log('')
  }
  
  console.log('─'.repeat(60))
  console.log('\n💡 Important Notes:\n')
  console.log('   The Gemini SDK does not provide a usage history API.')
  console.log('   Google only exposes usage data through their web dashboard.')
  console.log('\n   To view detailed usage history:')
  console.log('   1. Visit: https://ai.dev/usage?tab=rate-limit')
  console.log('   2. Sign in with your Google account')
  console.log('   3. Select your project ("Book Scanner")')
  console.log('   4. View usage graphs and rate limit status')
  console.log('\n   The dashboard shows:')
  console.log('   - Requests per minute (RPM)')
  console.log('   - Tokens per minute (TPM)')
  console.log('   - Requests per day (RPD)')
  console.log('   - Historical usage graphs')
  console.log('   - Rate limit warnings')
  console.log('')
}

getUsageDetails().catch(console.error)


