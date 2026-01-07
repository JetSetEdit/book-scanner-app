#!/usr/bin/env tsx
/**
 * Re-scan "The Bride Test" to verify the signals fix works
 * Usage: npx tsx scripts/rescan-bride-test.ts
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

async function rescanBook() {
  const { processIsbnScan } = await import('../lib/services/scan-service');
  const ISBN = '9780451490827'; // The Bride Test

  console.log(`\n🔍 Re-scanning book with ISBN: ${ISBN}`);
  console.log('='.repeat(80));
  
  const onProgress = (message: string | { action: string }) => {
    const msg = typeof message === 'string' ? message : message.action;
    console.log(`   ${msg}`);
  };
  
  try {
    const result = await processIsbnScan(ISBN, onProgress, undefined, true); // Force refresh to re-analyze
    
    if (result.success) {
      console.log('\n✅ Scan completed successfully!');
      console.log(`   Book: ${result.book?.title || 'Unknown'}`);
      console.log(`   Warnings Generated: ${result.contentWarningsGenerated ? 'Yes' : 'No'}`);
      
      if (result.book?.id) {
        const { supabaseAdmin } = await import('../lib/supabase/admin');
        const { data: warnings } = await supabaseAdmin
          .from('content_warnings')
          .select('*')
          .eq('book_id', result.book.id);
        console.log(`   Actual warnings count in DB: ${warnings?.length || 0}`);
        
        if (warnings && warnings.length > 0) {
          console.log('\n   Warnings found:');
          warnings.forEach((w: any, idx: number) => {
            console.log(`   ${idx + 1}. ${w.subcategory_id} (${w.severity})`);
            console.log(`      Description: ${w.description?.substring(0, 100)}...`);
          });
        } else {
          console.log('\n   ⚠️  No warnings found - this might indicate the book is truly safe, or there was an issue.');
        }
        
        // Check audit log
        const { data: auditLogs } = await supabaseAdmin
          .from('ai_audit_logs')
          .select('decision_type, ai_reasoning')
          .eq('book_id', result.book.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (auditLogs && auditLogs.length > 0) {
          const log = auditLogs[0] as any;
          console.log(`\n   Audit Log: ${log.decision_type}`);
          if (log.decision_type === 'no_warnings' && log.ai_reasoning) {
            console.log(`   Reasoning: ${log.ai_reasoning.substring(0, 200)}...`);
          }
        }
      }
    } else {
      console.log('\n❌ Scan failed');
      console.log(`   Error: ${result.message || result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('\n❌ Scan error:', error);
    process.exit(1);
  }
}

rescanBook().catch(console.error);

