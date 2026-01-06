#!/usr/bin/env tsx
/**
 * Test scan for The Time Traveler's Wife to verify model fix
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { processIsbnScan } from '../lib/services/scan-service';

async function testScan() {
  console.log('🔍 Testing scan for The Time Traveler\'s Wife...\n');
  console.log('ISBN: 9780156029438\n');

  const result = await processIsbnScan(
    '9780156029438',
    (msg) => {
      const m = typeof msg === 'string' ? msg : msg.action || JSON.stringify(msg);
      console.log('  ' + m.substring(0, 120));
    },
    undefined, // selectedCandidate
    true, // forceRefresh
    undefined // model (will use MODEL_VERSION)
  );

  console.log('\n✅ Scan result:');
  console.log('  Success:', result.success);
  console.log('  Warnings generated:', result.contentWarningsGenerated);
  console.log('  Warnings count:', result.warnings?.length || 0);
  
  if (result.warnings && result.warnings.length > 0) {
    console.log('\n📋 Warnings found:');
    result.warnings.slice(0, 5).forEach((w: any, i: number) => {
      console.log(`  ${i + 1}. ${w.subcategory_id} (${w.severity})`);
    });
  }
}

testScan().catch(console.error);

