#!/usr/bin/env tsx
/**
 * Test Romance book analysis with new genre awareness
 * 
 * Usage: npx tsx scripts/test-romance-analysis.ts
 */

import dotenv from 'dotenv';

// Load environment variables first, before any imports
dotenv.config({ path: '.env.local' });
dotenv.config(); // Also load .env if it exists

// Test books - mix of romance books that should trigger different checks
const testBooks = [
  { isbn: '9780241599198', title: 'The Summer I Turned Pretty', expected: 'Should check for heat level, tropes' },
  { isbn: '9781398728561', title: 'Picking Daisies on Sundays', expected: 'Should check Romance.io/The StoryGraph' },
  // Add more test books as needed
];

async function main() {
  // Now import after env vars are loaded
  const { processIsbnScan } = await import('../lib/services/scan-service');
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('\n🧪 Testing Romance Book Analysis with Genre Awareness\n');
  console.log('═'.repeat(80));
  console.log('');

  for (const testBook of testBooks) {
    console.log(`\n📚 Testing: ${testBook.title} (${testBook.isbn})`);
    console.log(`   Expected: ${testBook.expected}`);
    console.log('─'.repeat(80));

    try {
      const result = await processIsbnScan(
        testBook.isbn,
        (message) => {
          if (typeof message === 'string') {
            // Filter for important messages
            if (message.includes('Romance') || 
                message.includes('Romance.io') || 
                message.includes('StoryGraph') ||
                message.includes('heat') ||
                message.includes('spice') ||
                message.includes('trope') ||
                message.includes('web search') ||
                message.includes('verification')) {
              console.log(`   ℹ️  ${message}`);
            }
          }
        },
        undefined, // selectedCandidate
        true, // forceRefresh
        'gpt-4o'
      );

      if (!result.success) {
        console.log(`   ❌ Scan failed: ${result.error || 'Unknown error'}`);
        continue;
      }

      // Check audit log for reasoning
      const { data: auditLog } = await supabase
        .from('ai_audit_logs')
        .select('ai_reasoning, decision_type, warnings_count')
        .eq('isbn', testBook.isbn)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log(`\n   📊 Results:`);
      console.log(`      Warnings: ${result.contentWarningsGenerated ? 'Yes' : 'No'}`);
      console.log(`      Decision: ${auditLog?.decision_type || 'N/A'}`);
      
      if (auditLog?.ai_reasoning) {
        console.log(`\n   💭 AI Reasoning:`);
        const reasoning = auditLog.ai_reasoning;
        
        // Check for key indicators
        const checks = {
          'Romance.io mentioned': reasoning.includes('Romance.io'),
          'StoryGraph mentioned': reasoning.includes('StoryGraph'),
          'Heat/spice level mentioned': reasoning.includes('heat') || reasoning.includes('spice'),
          'Tropes mentioned': reasoning.includes('trope'),
          'Community reviews mentioned': reasoning.includes('community') || reasoning.includes('reviews'),
          'Blurb-only disclaimer': reasoning.includes('blurb only') || reasoning.includes('description only'),
        };

        for (const [check, found] of Object.entries(checks)) {
          console.log(`      ${found ? '✅' : '❌'} ${check}`);
        }

        console.log(`\n   Full reasoning:`);
        console.log(`      ${reasoning.substring(0, 300)}${reasoning.length > 300 ? '...' : ''}`);
      }

      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`   ❌ Error: ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log('\n');
  console.log('═'.repeat(80));
  console.log('\n✅ Test Complete!\n');
  console.log('📋 Review the results above and confirm:');
  console.log('   1. Romance books trigger genre-specific checks');
  console.log('   2. Web search checks Romance.io and The StoryGraph');
  console.log('   3. Safety disclaimers appear when analysis is blurb-only');
  console.log('   4. Heat/spice levels and tropes are identified\n');
}

main().catch(console.error);
