#!/usr/bin/env tsx
/**
 * Test different OpenAI models to compare results for Romance book analysis
 * 
 * Usage: npx tsx scripts/test-different-models.ts
 */

import dotenv from 'dotenv';

// Load environment variables first
dotenv.config({ path: '.env.local' });
dotenv.config();

// Available OpenAI models to test
const modelsToTest = [
  { name: 'gpt-4o', description: 'Current default - GPT-4 Optimized' },
  { name: 'gpt-4o-2024-11-20', description: 'GPT-4o with specific version' },
  { name: 'gpt-4-turbo', description: 'GPT-4 Turbo (if available)' },
  { name: 'gpt-4', description: 'GPT-4 base model' },
  // Note: o1 models don't support JSON mode, so they won't work with our current setup
];

// Test book - a Romance book that should trigger genre-specific checks
const testBook = {
  isbn: '9781398728561',
  title: 'Picking Daisies on Sundays',
  categories: ['Fiction, romance, romantic comedy'],
};

async function main() {
  const { processIsbnScan } = await import('../lib/services/scan-service');
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('\n🧪 Testing Different OpenAI Models for Romance Book Analysis\n');
  console.log('═'.repeat(80));
  console.log(`\n📚 Test Book: ${testBook.title} (${testBook.isbn})`);
  console.log(`   Categories: ${testBook.categories.join(', ')}\n`);

  const results: Array<{
    model: string;
    success: boolean;
    warnings: number;
    reasoning?: string;
    error?: string;
  }> = [];

  for (const modelInfo of modelsToTest) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`\n🤖 Testing Model: ${modelInfo.name}`);
    console.log(`   ${modelInfo.description}`);
    console.log('─'.repeat(80));

    try {
      const result = await processIsbnScan(
        testBook.isbn,
        (message) => {
          // Only show important messages
          if (typeof message === 'string' && (
            message.includes('error') ||
            message.includes('Error') ||
            message.includes('complete') ||
            message.includes('warnings')
          )) {
            console.log(`   ${message}`);
          }
        },
        undefined, // selectedCandidate
        true, // forceRefresh
        modelInfo.name
      );

      // Get the audit log
      const { data: auditLog } = await supabase
        .from('ai_audit_logs')
        .select('ai_reasoning, decision_type, warnings_count')
        .eq('isbn', testBook.isbn)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      results.push({
        model: modelInfo.name,
        success: result.success || false,
        warnings: result.contentWarningsGenerated ? (auditLog?.warnings_count || 0) : 0,
        reasoning: auditLog?.ai_reasoning,
        error: result.error,
      });

      console.log(`\n   ✅ Completed`);
      console.log(`   Warnings: ${result.contentWarningsGenerated ? 'Yes' : 'No'}`);
      if (auditLog?.ai_reasoning) {
        const reasoning = auditLog.ai_reasoning;
        console.log(`\n   Reasoning (first 200 chars):`);
        console.log(`   ${reasoning.substring(0, 200)}...`);
        
        // Check for key indicators
        const hasRomanceChecks = reasoning.includes('Romance.io') || 
                                 reasoning.includes('StoryGraph') ||
                                 reasoning.includes('heat') ||
                                 reasoning.includes('spice') ||
                                 reasoning.includes('trope');
        console.log(`   ${hasRomanceChecks ? '✅' : '❌'} Romance-specific checks: ${hasRomanceChecks ? 'Found' : 'Missing'}`);
      }

      // Wait between model tests
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error) {
      console.error(`   ❌ Error: ${error instanceof Error ? error.message : error}`);
      results.push({
        model: modelInfo.name,
        success: false,
        warnings: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Summary
  console.log('\n\n');
  console.log('═'.repeat(80));
  console.log('\n📊 SUMMARY: Model Comparison\n');
  console.log('─'.repeat(80));

  for (const result of results) {
    console.log(`\n${result.model}:`);
    console.log(`   Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    } else {
      console.log(`   Warnings: ${result.warnings}`);
      if (result.reasoning) {
        const checks = {
          'Romance.io/StoryGraph': result.reasoning.includes('Romance.io') || result.reasoning.includes('StoryGraph'),
          'Heat/Spice mentioned': result.reasoning.includes('heat') || result.reasoning.includes('spice'),
          'Tropes mentioned': result.reasoning.includes('trope'),
          'Blurb-only disclaimer': result.reasoning.includes('blurb only') || result.reasoning.includes('description only'),
        };
        console.log(`   Romance Checks:`);
        for (const [check, found] of Object.entries(checks)) {
          console.log(`     ${found ? '✅' : '❌'} ${check}`);
        }
      }
    }
  }

  console.log('\n');
  console.log('═'.repeat(80));
  console.log('\n💡 Recommendation: Review which model provides the most thorough');
  console.log('   Romance-specific analysis and best reasoning quality.\n');
}

main().catch(console.error);

