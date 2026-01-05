#!/usr/bin/env tsx
/**
 * Test Gemini Model Names
 * 
 * Tests different Gemini model names to find which one works
 */

import 'dotenv/config'
import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ Missing GEMINI_API_KEY in .env.local')
  process.exit(1)
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// List of model names to try
const modelsToTest = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest',
  'gemini-2.0-flash-exp',
  'gemini-pro',
  'gemini-pro-vision'
]

async function testModel(modelName: string): Promise<boolean> {
  try {
    console.log(`\n🧪 Testing: ${modelName}`)
    const model = genAI.getGenerativeModel({ model: modelName })
    
    const result = await model.generateContent('Say "Hello" in one word.')
    const response = await result.response
    const text = response.text()
    
    console.log(`   ✅ SUCCESS: ${text.trim()}`)
    return true
  } catch (error: any) {
    if (error.status === 404) {
      console.log(`   ❌ 404 Not Found`)
    } else if (error.message) {
      console.log(`   ❌ Error: ${error.message.substring(0, 100)}`)
    } else {
      console.log(`   ❌ Error: ${JSON.stringify(error).substring(0, 100)}`)
    }
    return false
  }
}

async function testAllModels() {
  console.log('🔍 Testing Gemini Model Names\n')
  console.log('─'.repeat(60))
  
  const results: Array<{ model: string; works: boolean }> = []
  
  for (const modelName of modelsToTest) {
    const works = await testModel(modelName)
    results.push({ model: modelName, works })
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('\n' + '─'.repeat(60))
  console.log('\n📊 Results:\n')
  
  const workingModels = results.filter(r => r.works)
  const brokenModels = results.filter(r => !r.works)
  
  if (workingModels.length > 0) {
    console.log('✅ Working Models:')
    workingModels.forEach(r => console.log(`   - ${r.model}`))
  }
  
  if (brokenModels.length > 0) {
    console.log('\n❌ Not Working:')
    brokenModels.forEach(r => console.log(`   - ${r.model}`))
  }
  
  if (workingModels.length === 0) {
    console.log('\n⚠️  No working models found. Check:')
    console.log('   1. GEMINI_API_KEY is valid')
    console.log('   2. API key has proper permissions')
    console.log('   3. Check Google AI Studio for available models')
  } else {
    console.log(`\n✅ Recommended: Use "${workingModels[0].model}"`)
  }
}

testAllModels().catch(console.error)


