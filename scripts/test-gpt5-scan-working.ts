#!/usr/bin/env tsx
/**
 * Test GPT-5 models to find a working one
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local FIRST before any other imports
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config(); // Fallback to .env
}

const TEST_ISBN = '9780349437033'; // Iron Flame

const GPT5_MODELS = [
  'gpt-5.2-2025-12-11',
  'gpt-5.2',
  'gpt-5-pro-2025-10-06',
  'gpt-5-pro',
  'gpt-5.1-2025-11-13',
  'gpt-5.1',
  'gpt-5-2025-08-07',
  'gpt-5'
];

async function testModel(model: string): Promise<boolean> {
  console.log(`\n🧪 Testing ${model}...`);
  
  try {
    const { processIsbnScan } = await import('../lib/services/scan-service');
    
    const onProgress = (message: string | { action: string }) => {
      const msg = typeof message === 'string' ? message : message.action;
      if (msg.includes('error') || msg.includes('Error') || msg.includes('failed') || msg.includes('Failed')) {
        console.log(`   ❌ ${msg}`);
      } else if (msg.includes('✅') || msg.includes('success')) {
        console.log(`   ✅ ${msg}`);
      }
    };
    
    const result = await processIsbnScan(TEST_ISBN, onProgress, undefined, true, model);
    
    if (result.success && result.contentWarningsGenerated !== undefined) {
      console.log(`   ✅ ${model} WORKED! Warnings: ${result.contentWarningsGenerated}`);
      return true;
    } else {
      console.log(`   ❌ ${model} failed: ${result.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(`   ❌ ${model} ERROR: ${errorMsg}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Testing GPT-5 models to find a working one...\n');
  console.log(`Test book: ${TEST_ISBN} (Iron Flame)\n`);
  
  for (const model of GPT5_MODELS) {
    const worked = await testModel(model);
    if (worked) {
      console.log(`\n✅ FOUND WORKING MODEL: ${model}`);
      console.log(`\nUpdate MODEL_VERSION in lib/config/taxonomy-v2.ts to: "${model}"`);
      break;
    }
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

main().catch(console.error);

