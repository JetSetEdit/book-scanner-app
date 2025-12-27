/**
 * Test script to verify categorical shielding works correctly
 * Tests "A Little Life" (ISBN: 9780385539258) to ensure reasoning fields
 * use categorical language instead of narrative plot descriptions
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// Also check for API key in environment (for Vercel/secrets)
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('❌ OPENAI_API_KEY not found in environment variables');
  console.error('   Please set OPENAI_API_KEY in .env.local or environment');
  process.exit(1);
}

console.log('✅ OPENAI_API_KEY found');
console.log('🔍 Testing categorical shielding with "A Little Life" (ISBN: 9780385539258)\n');

async function testCategoricalShielding() {
  try {
    const { findBookAndGenerateWarnings } = await import('../lib/content-warning-agent');
    
    const isbn = '9780385539258'; // A Little Life
    console.log(`📚 Testing ISBN: ${isbn}`);
    console.log('⏳ Generating warnings...\n');
    
    const result = await findBookAndGenerateWarnings(isbn);
    
    console.log('--- BOOK INFORMATION ---');
    console.log(`Title: ${result.book_title || 'N/A'}`);
    console.log(`Author: ${result.book_author || 'N/A'}`);
    console.log(`Confidence: ${result.confidence}`);
    console.log(`Classification: ${result.classification_rating || 'N/A'}\n`);
    
    console.log('--- CONTENT WARNINGS ANALYSIS ---');
    if (result.content_warnings.length === 0) {
      console.log('⚠️  No warnings generated');
      return;
    }
    
    // Check for spoiler indicators in reasoning fields
    const spoilerIndicators = [
      'sold as',
      'prostitute',
      'character',
      'chapter',
      'dies',
      'killed',
      'commits suicide',
      'raped by',
      'father',
      'mother',
      'protagonist',
      'main character'
    ];
    
    let hasSpoilers = false;
    let categoricalCount = 0;
    
    result.content_warnings.forEach((w, i) => {
      console.log(`\n[${i + 1}] ${w.category_id.toUpperCase()} (${w.severity})`);
      console.log(`    Description: ${w.description}`);
      console.log(`    Reasoning: ${w.reasoning}`);
      
      // Check if reasoning contains spoiler indicators
      const reasoningLower = w.reasoning.toLowerCase();
      const foundSpoilers = spoilerIndicators.filter(indicator => 
        reasoningLower.includes(indicator)
      );
      
      // Check if reasoning uses categorical language
      const isCategorical = 
        reasoningLower.includes('contains themes of') ||
        reasoningLower.includes('depictions of') ||
        reasoningLower.includes('references to') ||
        reasoningLower.includes('themes of') ||
        (reasoningLower.includes('systemic') && !reasoningLower.includes('character')) ||
        (reasoningLower.includes('exploitation') && !reasoningLower.includes('sold'));
      
      if (foundSpoilers.length > 0) {
        console.log(`    ⚠️  POTENTIAL SPOILER DETECTED: ${foundSpoilers.join(', ')}`);
        hasSpoilers = true;
      } else if (isCategorical) {
        console.log(`    ✅ Categorical language detected`);
        categoricalCount++;
      } else {
        console.log(`    ⚠️  Review needed - may contain narrative elements`);
      }
      
      if (w.is_author_verified) {
        console.log(`    ✅ VERIFIED SOURCE: ${w.source_url}`);
      }
    });
    
    console.log('\n--- VERIFICATION RESULTS ---');
    console.log(`Total warnings: ${result.content_warnings.length}`);
    console.log(`Categorical reasoning: ${categoricalCount}/${result.content_warnings.length}`);
    console.log(`Spoilers detected: ${hasSpoilers ? '❌ YES' : '✅ NO'}`);
    
    if (hasSpoilers) {
      console.log('\n❌ FAILED: Reasoning fields contain potential spoilers');
      console.log('   The categorical shielding may need adjustment.');
      process.exit(1);
    } else if (categoricalCount === result.content_warnings.length) {
      console.log('\n✅ PASSED: All reasoning fields use categorical language');
      console.log('   Categorical shielding is working correctly!');
      process.exit(0);
    } else {
      console.log('\n⚠️  PARTIAL: Some reasoning fields may need review');
      console.log('   Consider enhancing the prompt for better categorical enforcement.');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      if (error.message.includes('API key')) {
        console.error('\n   💡 Make sure OPENAI_API_KEY is set correctly');
      }
    }
    process.exit(1);
  }
}

testCategoricalShielding();
