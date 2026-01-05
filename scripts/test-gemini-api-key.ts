#!/usr/bin/env tsx
/**
 * Test Gemini API Key and List Available Models
 */

import 'dotenv/config'
import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ Missing GEMINI_API_KEY in .env.local')
  process.exit(1)
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

async function testAPIKey() {
  console.log('🔍 Testing Gemini API Key...\n')
  
  // Try to list models (if the SDK supports it)
  try {
    console.log('📋 Attempting to list available models...')
    // Note: The SDK might not have a listModels method, but let's try
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    
    // Try a simple test
    console.log('🧪 Testing with gemini-pro...')
    const result = await model.generateContent('Hello')
    console.log('✅ API Key is valid!')
    console.log(`Response: ${result.response.text()}`)
  } catch (error: any) {
    console.log('❌ API Key test failed')
    console.log(`Error: ${error.message || JSON.stringify(error)}`)
    
    if (error.status === 401 || error.status === 403) {
      console.log('\n⚠️  Authentication error - API key may be invalid or expired')
    } else if (error.status === 404) {
      console.log('\n⚠️  Model not found - but API key might be valid')
      console.log('   Try checking Google AI Studio for available models')
    }
  }
  
  // Try fetching from the API directly to see what models are available
  console.log('\n📡 Checking API directly...')
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    )
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Successfully fetched model list!')
      console.log(`\n📋 Available models (${data.models?.length || 0}):`)
      
      if (data.models && data.models.length > 0) {
        data.models
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .slice(0, 10)
          .forEach((model: any) => {
            console.log(`   - ${model.name}`)
          })
      } else {
        console.log('   (No models found in response)')
      }
    } else {
      console.log(`❌ API request failed: ${response.status} ${response.statusText}`)
      const text = await response.text()
      console.log(`Response: ${text.substring(0, 200)}`)
    }
  } catch (fetchError: any) {
    console.log(`❌ Failed to fetch model list: ${fetchError.message}`)
  }
}

testAPIKey().catch(console.error)


