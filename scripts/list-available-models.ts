#!/usr/bin/env tsx
/**
 * List available OpenAI models
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function main() {
  const { default: OpenAI } = await import('openai')
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
  
  console.log('🔍 Fetching available OpenAI models...\n')
  
  try {
    const models = await openai.models.list()
    
    // Filter to GPT models and sort by name
    const gptModels = models.data
      .filter(m => m.id.includes('gpt') || m.id.includes('o1') || m.id.includes('o3'))
      .sort((a, b) => a.id.localeCompare(b.id))
    
    console.log(`Found ${gptModels.length} GPT models:\n`)
    
    gptModels.forEach(model => {
      const isLatest = model.id.includes('2024') || model.id.includes('2025') || model.id.includes('o1') || model.id.includes('o3')
      const marker = isLatest ? '✨' : '  '
      console.log(`${marker} ${model.id}`)
      if (model.owned_by) {
        console.log(`   Owned by: ${model.owned_by}`)
      }
    })
    
    // Also show recent/notable models
    console.log('\n📋 Notable models for content analysis:')
    const notable = gptModels.filter(m => 
      m.id.includes('gpt-4o') || 
      m.id.includes('gpt-4-turbo') || 
      m.id.includes('o1') ||
      m.id.includes('o3') ||
      m.id.includes('gpt-5')
    )
    
    if (notable.length > 0) {
      notable.forEach(m => {
        console.log(`   ✅ ${m.id}`)
      })
    } else {
      console.log('   (No notable models found - check if GPT-5 or o1/o3 are available)')
    }
    
  } catch (error) {
    console.error('❌ Error fetching models:', error instanceof Error ? error.message : String(error))
    if (error instanceof Error && error.message.includes('401')) {
      console.error('\n⚠️  Authentication failed. Check your OPENAI_API_KEY in .env.local')
    }
  }
}

main().catch(console.error)

