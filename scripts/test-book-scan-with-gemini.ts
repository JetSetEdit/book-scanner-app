#!/usr/bin/env tsx
/**
 * Test book scan with Gemini cross-validation
 * Usage: npx tsx scripts/test-book-scan-with-gemini.ts
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

async function testBookScan() {
  // Test with "The Hunger Games" - a well-known book with clear content warnings
  const ISBN = '9780439023481';
  
  console.log('\n🔍 Testing Book Scan with Gemini Cross-Validation\n');
  console.log('='.repeat(80));
  console.log(`ISBN: ${ISBN}`);
  console.log('Book: The Hunger Games by Suzanne Collins');
  console.log('='.repeat(80));
  console.log('');
  
  const { processIsbnScan } = await import('../lib/services/scan-service');
  
  const progressMessages: string[] = [];
  const onProgress = (message: string | { action: string }) => {
    const msg = typeof message === 'string' ? message : message.action;
    progressMessages.push(msg);
    
    // Show key progress indicators
    if (msg.includes('Gemini') || msg.includes('Cross-validated') || 
        msg.includes('OpenAI') || msg.includes('warning') || 
        msg.includes('verifying') || msg.includes('found')) {
      console.log(`   ${msg}`);
    }
  };
  
  try {
    console.log('⏳ Starting scan...\n');
    const startTime = Date.now();
    
    const result = await processIsbnScan(ISBN, onProgress, undefined, true); // Force refresh
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 SCAN RESULTS');
    console.log('='.repeat(80));
    console.log(`✅ Success: ${result.success}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📖 Book: ${result.book?.title || 'Unknown'}`);
    console.log(`📝 Author: ${result.book?.author || 'Unknown'}`);
    console.log(`⚠️  Warnings Generated: ${result.contentWarningsGenerated ? 'Yes' : 'No'}`);
    console.log(`🆕 New Book: ${result.isNewBook ? 'Yes' : 'No'}`);
    
    if (result.book?.id) {
      const { supabaseAdmin } = await import('../lib/supabase/admin');
      
      // Get warnings
      const { data: warnings } = await supabaseAdmin
        .from('content_warnings')
        .select('subcategory_id, description, severity, source')
        .eq('book_id', result.book.id)
        .eq('source', 'ai_generated')
        .order('severity', { ascending: false });
      
      console.log(`\n📋 Content Warnings: ${warnings?.length || 0}`);
      if (warnings && warnings.length > 0) {
        warnings.forEach((w, i) => {
          console.log(`   ${i + 1}. [${w.severity?.toUpperCase()}] ${w.subcategory_id}`);
          console.log(`      ${w.description?.substring(0, 80)}...`);
        });
      }
      
      // Get age rating
      const { data: book } = await supabaseAdmin
        .from('books')
        .select('categories')
        .eq('id', result.book.id)
        .single();
      
      const rating = book?.categories?.find((c: string) => c.startsWith('CLASSIFICATION:')) || 'Not set';
      console.log(`\n🎯 Age Rating: ${rating}`);
      
      // Check for Gemini usage in progress messages
      const hasGemini = progressMessages.some(msg => 
        msg.toLowerCase().includes('gemini') || 
        msg.toLowerCase().includes('cross-validated')
      );
      
      console.log(`\n🤖 Multi-Model Status:`);
      console.log(`   Gemini Used: ${hasGemini ? '✅ Yes' : '❌ No'}`);
      console.log(`   Cross-Validation: ${hasGemini ? '✅ Active' : '❌ Not detected'}`);
      
      if (!hasGemini) {
        console.log(`\n⚠️  Note: Gemini may have failed silently or wasn't triggered.`);
        console.log(`   Check GEMINI_API_KEY and API quota.`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Test Complete!\n');
    
  } catch (error) {
    console.error('\n❌ Scan failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack?.substring(0, 200));
    }
    process.exit(1);
  }
}

testBookScan().catch(console.error);

