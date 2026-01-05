#!/usr/bin/env tsx
/**
 * Compare different OpenAI models by testing the analysis directly
 * This bypasses the scan service to test models in isolation
 * 
 * Usage: npx tsx scripts/test-models-comparison.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

async function main() {
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Test book description - a Romance book
  const testBook = {
    title: 'Picking Daisies on Sundays',
    author: 'Liana Cincotti',
    isbn: '9781398728561',
    description: `Daniella Daisy Maria had always longed for love... until she fell for her childhood best friend Levi. It was the hand-trembling, heart-thumping kind of love that you weren't supposed to feel when you looked at your best friend. But it all ended when he didn't feel the same way and she vowed to never see him again. Four years later and one night in a crowded bar in the West Village, there he is, just as perfect as ever. Maybe it's the lighting or the way his hair curls above his brow, but when he asks her to be his fake girlfriend for his sister's wedding, she can't bring herself to say no. But with old feelings resurfacing at every staged, romantic interaction and stolen glance, she begins to wonder if maybe this time she should have protected her heart...`,
    categories: ['Fiction, romance, romantic comedy'],
  };

  // Models to test
  const models = [
    'gpt-4o',
    'gpt-4o-2024-11-20',
    'gpt-4-turbo',
    'gpt-4',
  ];

  console.log('\n🧪 Comparing OpenAI Models for Romance Book Analysis\n');
  console.log('═'.repeat(80));
  console.log(`\n📚 Test Book: ${testBook.title}`);
  console.log(`   Author: ${testBook.author}`);
  console.log(`   Categories: ${testBook.categories.join(', ')}\n`);

  const results: Array<{
    model: string;
    response?: any;
    error?: string;
    hasRomanceChecks?: boolean;
    reasoning?: string;
  }> = [];

  // Simplified prompt focusing on Romance genre awareness
  const prompt = `Analyze this Romance book for content warnings. The book is categorized as "Fiction, romance, romantic comedy".

Book: "${testBook.title}" by ${testBook.author}

Description:
${testBook.description}

CRITICAL: For Romance books, you MUST check for:
1. Heat/Spice level (explicit, moderate, mild, clean/sweet)
2. Common romance tropes that are content warnings:
   - Cheating/infidelity
   - Secret baby/pregnancy
   - Loss/grief themes
   - Emotional abuse/manipulation
   - Dubious consent
   - Age gaps
   - Stalking/obsessive behavior
   - Toxic relationship dynamics
3. Emotional intensity levels

Return JSON with:
{
  "warnings": [],
  "no_warnings_reasoning": "Explain what you found, including heat level, tropes, and why no warnings were identified. If the description is vague, note that community reviews on Romance.io or The StoryGraph may indicate different content."
}`;

  for (const model of models) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`\n🤖 Testing: ${model}`);
    console.log('─'.repeat(80));

    try {
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a content warning analyzer. Always return valid JSON. For Romance books, be especially thorough about heat levels, tropes, and community-sourced information.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content');
      }

      const parsed = JSON.parse(content);
      const reasoning = parsed.no_warnings_reasoning || '';

      // Check for key indicators
      const checks = {
        'Romance.io mentioned': reasoning.includes('Romance.io'),
        'StoryGraph mentioned': reasoning.includes('StoryGraph'),
        'Heat/spice level mentioned': reasoning.includes('heat') || reasoning.includes('spice') || reasoning.includes('explicit') || reasoning.includes('clean'),
        'Tropes mentioned': reasoning.includes('trope'),
        'Community reviews mentioned': reasoning.includes('community') || reasoning.includes('reviews'),
        'Blurb-only disclaimer': reasoning.includes('blurb') || reasoning.includes('description only'),
      };

      const hasRomanceChecks = Object.values(checks).some(v => v);

      results.push({
        model,
        response: parsed,
        hasRomanceChecks,
        reasoning,
      });

      console.log(`\n   ✅ Response received`);
      console.log(`   Warnings: ${parsed.warnings?.length || 0}`);
      console.log(`   Romance Checks: ${hasRomanceChecks ? '✅ Found' : '❌ Missing'}`);
      console.log(`\n   Reasoning:`);
      console.log(`   ${reasoning.substring(0, 250)}${reasoning.length > 250 ? '...' : ''}`);
      console.log(`\n   Detailed Checks:`);
      for (const [check, found] of Object.entries(checks)) {
        console.log(`     ${found ? '✅' : '❌'} ${check}`);
      }

    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message || error}`);
      
      // Check if it's a model availability error
      if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
        console.log(`   ⚠️  Model may not be available in your OpenAI account`);
      }
      
      results.push({
        model,
        error: error.message || String(error),
      });
    }

    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n\n');
  console.log('═'.repeat(80));
  console.log('\n📊 MODEL COMPARISON SUMMARY\n');
  console.log('─'.repeat(80));

  for (const result of results) {
    console.log(`\n${result.model}:`);
    if (result.error) {
      console.log(`   ❌ ${result.error}`);
    } else {
      console.log(`   ✅ Success`);
      console.log(`   Romance Checks: ${result.hasRomanceChecks ? '✅ Yes' : '❌ No'}`);
      if (result.reasoning) {
        console.log(`   Reasoning Length: ${result.reasoning.length} chars`);
      }
    }
  }

  console.log('\n');
  console.log('═'.repeat(80));
  console.log('\n💡 Recommendation: Choose the model that:');
  console.log('   1. Provides the most thorough Romance-specific analysis');
  console.log('   2. Mentions Romance.io/StoryGraph when appropriate');
  console.log('   3. Identifies heat levels and tropes accurately');
  console.log('   4. Includes safety disclaimers for blurb-only analysis\n');
}

main().catch(console.error);


