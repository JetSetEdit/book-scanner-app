#!/usr/bin/env tsx
/**
 * Test re-scanning A Little Life to verify the fix
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

async function testRescan() {
  const { processIsbnScan } = await import('../lib/services/scan-service');
  
  const onProgress = (message: string | { action: string }) => {
    const msg = typeof message === 'string' ? message : message.action;
    if (msg.includes('web search') || msg.includes('narrative') || msg.includes('minimal') || 
        msg.includes('warnings') || msg.includes('error') || msg.includes('Error')) {
      console.log(`   ${msg}`);
    }
  };
  
  console.log('\n🔍 Re-scanning A Little Life with forceRefresh=true...\n');
  console.log('Testing if narrative excerpt detection triggers web search...\n');
  
  try {
    const result = await processIsbnScan('9780804172707', onProgress, undefined, true);
    
    console.log('\n✅ Scan completed!');
    console.log(`   Success: ${result.success}`);
    console.log(`   Warnings Generated: ${result.contentWarningsGenerated}`);
    console.log(`   Book: ${result.book?.title}`);
    
    if (result.book?.id) {
      const { supabaseAdmin } = await import('../lib/supabase/admin');
      const { data: warnings } = await supabaseAdmin
        .from('content_warnings')
        .select('subcategory_id, description, severity')
        .eq('book_id', result.book.id)
        .eq('source', 'ai_generated')
        .order('severity', { ascending: false });
      
      console.log(`\n   Warnings found: ${warnings?.length || 0}`);
      if (warnings && warnings.length > 0) {
        warnings.forEach((w, i) => {
          console.log(`   ${i+1}. [${w.severity}] ${w.subcategory_id}`);
          console.log(`      ${w.description?.substring(0, 100)}...`);
        });
      } else {
        console.log('   ⚠️  NO WARNINGS - This is still wrong!');
      }
      
      const { data: book } = await supabaseAdmin
        .from('books')
        .select('categories')
        .eq('id', result.book.id)
        .single();
      
      const rating = book?.categories?.find((c: string) => c.startsWith('CLASSIFICATION:')) || 'Not set';
      console.log(`\n   Age Rating: ${rating}`);
      
      if (rating.includes('PG') && warnings && warnings.length <= 1) {
        console.log('\n   ❌ STILL BROKEN - Rating is PG with minimal warnings');
      } else if (rating.includes('R18+') || (warnings && warnings.length >= 5)) {
        console.log('\n   ✅ FIXED - Now has appropriate warnings and rating');
      }
    }
  } catch (error) {
    console.error('\n❌ Scan failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack?.substring(0, 200));
    }
  }
}

testRescan().catch(console.error);

