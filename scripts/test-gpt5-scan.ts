#!/usr/bin/env tsx
/**
 * Test GPT-5 scan with forceRefresh
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const TEST_ISBN = '9780439023481' // The Hunger Games

async function main() {
  console.log('🧪 Testing GPT-5 Scan with forceRefresh')
  console.log('='.repeat(80))
  console.log(`📖 ISBN: ${TEST_ISBN}`)
  console.log('')

  const { processIsbnScan } = await import('../lib/services/scan-service')
  const { MODEL_VERSION } = await import('../lib/config/taxonomy-v2')

  console.log(`Using model: ${MODEL_VERSION}`)
  console.log('')

  try {
    const result = await processIsbnScan(
      TEST_ISBN,
      (msg) => {
        const msgStr = typeof msg === 'string' ? msg : (typeof msg === 'object' && msg.action ? msg.action : JSON.stringify(msg))
        // Show key messages
        if (msgStr.includes('Analyzing') || 
            msgStr.includes('Error') || 
            msgStr.includes('GPT') || 
            msgStr.includes('model') ||
            msgStr.includes('analysis') ||
            msgStr.includes('warnings')) {
          console.log(`   ${msgStr}`)
        }
      },
      undefined,
      true, // forceRefresh - will trigger analysis
      undefined // model - should use MODEL_VERSION
    )

    console.log('')
    console.log('✅ Scan Result:')
    console.log(`   Success: ${result.success}`)
    console.log(`   Content Warnings Generated: ${result.contentWarningsGenerated}`)
    console.log(`   Book: ${result.book?.title}`)
    
    if (!result.success) {
      console.log('   ❌ Scan failed!')
    }

  } catch (error) {
    console.error('')
    console.error('❌ ERROR:')
    console.error(error instanceof Error ? error.message : String(error))
    if (error instanceof Error && error.stack) {
      console.error('')
      console.error('Stack:')
      console.error(error.stack.split('\n').slice(0, 10).join('\n'))
    }
  }
}

main().catch(console.error)

