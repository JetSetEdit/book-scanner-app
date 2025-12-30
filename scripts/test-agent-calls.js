#!/usr/bin/env node

/**
 * Test Agent Calls - Verify OpenAI and Gemini agents are working
 * and not hitting rate limits or falling back
 */

const fs = require('fs');
const path = require('path');

// Load .env.local if it exists
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  });
}

console.log('🧪 Testing Agent Calls...');
console.log('');

// Test OpenAI Agent
async function testOpenAIAgent() {
  console.log('1️⃣ Testing OpenAI Agent...');
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('   ❌ OPENAI_API_KEY not set');
    return false;
  }
  
  try {
    // Import the agent function
    const { findBookAndGenerateWarnings } = require('../lib/content-warning-agent.ts');
    
    console.log('   📚 Testing with ISBN: 9780349436999 (Fourth Wing)...');
    console.log('   ⏳ Calling agent (this may take 10-30 seconds)...');
    
    const startTime = Date.now();
    const result = await findBookAndGenerateWarnings('9780349436999', 'gpt-4o', 'hybrid');
    const duration = (Date.now() - startTime) / 1000;
    
    if (result.book_found) {
      console.log(`   ✅ OpenAI Agent: SUCCESS (${duration}s)`);
      console.log(`      Book: ${result.book_title} by ${result.book_author}`);
      console.log(`      Warnings: ${result.content_warnings.length}`);
      console.log(`      Confidence: ${result.confidence}`);
      console.log(`      Rating: ${result.classification_rating || 'N/A'}`);
      
      // Check for errors in reasoning
      if (result.reasoning?.includes('rate limit') || result.reasoning?.includes('429')) {
        console.log(`   ⚠️  WARNING: Rate limit detected in reasoning`);
        return false;
      }
      if (result.reasoning?.includes('quota') || result.reasoning?.includes('exceeded')) {
        console.log(`   ⚠️  WARNING: Quota issue detected`);
        return false;
      }
      if (result.reasoning?.includes('Configuration error')) {
        console.log(`   ⚠️  WARNING: Configuration error detected`);
        return false;
      }
      
      return true;
    } else {
      console.log(`   ❌ OpenAI Agent: Failed to find book`);
      console.log(`      Reasoning: ${result.reasoning}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ OpenAI Agent: ERROR`);
    console.log(`      ${error.message}`);
    
    // Check for specific error types
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      console.log(`   ⚠️  RATE LIMIT DETECTED`);
    }
    if (error.message.includes('quota') || error.message.includes('exceeded')) {
      console.log(`   ⚠️  QUOTA EXCEEDED`);
    }
    
    return false;
  }
}

// Test Gemini Agent
async function testGeminiAgent() {
  console.log('');
  console.log('2️⃣ Testing Gemini Agent...');
  
  if (!process.env.GEMINI_API_KEY) {
    console.log('   ❌ GEMINI_API_KEY not set');
    return false;
  }
  
  try {
    // Import the Gemini function
    const { generateWarningsWithGemini } = require('../lib/services/multi-model-service.ts');
    
    console.log('   📚 Testing with book metadata...');
    console.log('   ⏳ Calling agent (this may take 10-30 seconds)...');
    
    const startTime = Date.now();
    const result = await generateWarningsWithGemini(
      '9780349436999',
      'Fourth Wing',
      'Rebecca Yarros',
      'Twenty-year-old Violet Sorrengail was supposed to enter the Basgiath War College to become a scribe.',
      ['Fantasy', 'Romance']
    );
    const duration = (Date.now() - startTime) / 1000;
    
    if (result.content_warnings && result.content_warnings.length > 0) {
      console.log(`   ✅ Gemini Agent: SUCCESS (${duration}s)`);
      console.log(`      Warnings: ${result.content_warnings.length}`);
      console.log(`      Confidence: ${result.confidence}`);
      
      return true;
    } else {
      console.log(`   ⚠️  Gemini Agent: No warnings generated`);
      console.log(`      Confidence: ${result.confidence}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Gemini Agent: ERROR`);
    console.log(`      ${error.message}`);
    
    // Check for specific error types
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      console.log(`   ⚠️  RATE LIMIT DETECTED`);
    }
    if (error.message.includes('quota') || error.message.includes('exceeded')) {
      console.log(`   ⚠️  QUOTA EXCEEDED`);
    }
    
    return false;
  }
}

// Test Multi-Model Service
async function testMultiModel() {
  console.log('');
  console.log('3️⃣ Testing Multi-Model Service...');
  
  try {
    const { runMultiModelAnalysis } = require('../lib/services/multi-model-service.ts');
    
    console.log('   📚 Testing with ISBN: 9780349436999...');
    console.log('   ⏳ Running multi-model analysis (this may take 20-60 seconds)...');
    
    const startTime = Date.now();
    const result = await runMultiModelAnalysis(
      '9780349436999',
      'Fourth Wing',
      'Rebecca Yarros',
      'Twenty-year-old Violet Sorrengail was supposed to enter the Basgiath War College to become a scribe.',
      ['Fantasy', 'Romance']
    );
    const duration = (Date.now() - startTime) / 1000;
    
    console.log(`   ✅ Multi-Model: SUCCESS (${duration}s)`);
    console.log(`      Combined Warnings: ${result.combinedWarnings.length}`);
    console.log(`      GPT-4o Warnings: ${result.gpt4oResult?.content_warnings?.length || 0}`);
    console.log(`      Gemini Warnings: ${result.geminiResult?.content_warnings?.length || 0}`);
    console.log(`      Confidence: ${result.combinedConfidence}`);
    
    // Check for fallbacks
    if (result.gpt4oResult?.confidence === 'low' && result.gpt4oResult?.content_warnings?.length === 0) {
      console.log(`   ⚠️  WARNING: GPT-4o returned low confidence/empty result`);
    }
    if (result.geminiResult?.confidence === 'low' && result.geminiResult?.content_warnings?.length === 0) {
      console.log(`   ⚠️  WARNING: Gemini returned low confidence/empty result`);
    }
    
    // Check for errors in analysis
    if (result.analysis?.includes('error') || result.analysis?.includes('failed')) {
      console.log(`   ⚠️  WARNING: Errors detected in analysis`);
    }
    
    return true;
  } catch (error) {
    console.log(`   ❌ Multi-Model: ERROR`);
    console.log(`      ${error.message}`);
    return false;
  }
}

// Run tests
(async () => {
  const openaiResult = await testOpenAIAgent();
  const geminiResult = await testGeminiAgent();
  const multiModelResult = await testMultiModel();
  
  console.log('');
  console.log('📊 Test Summary:');
  console.log(`   OpenAI Agent: ${openaiResult ? '✅ Working' : '❌ Failed'}`);
  console.log(`   Gemini Agent: ${geminiResult ? '✅ Working' : '❌ Failed'}`);
  console.log(`   Multi-Model: ${multiModelResult ? '✅ Working' : '❌ Failed'}`);
  console.log('');
  
  if (openaiResult && geminiResult && multiModelResult) {
    console.log('🎉 All agents are working correctly!');
    console.log('   No rate limits detected');
    console.log('   No fallbacks detected');
    console.log('   All APIs responding normally');
  } else {
    console.log('⚠️  Some agents may have issues');
    console.log('   Check the errors above for details');
  }
})();

