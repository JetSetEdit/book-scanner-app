#!/usr/bin/env node

/**
 * Check Agent Status - Verify agents are working and not hitting rate limits
 * This checks recent API responses for error patterns
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

console.log('🔍 Checking Agent Status...');
console.log('');

// Check for rate limit indicators in recent logs or responses
async function checkRateLimits() {
  console.log('1️⃣ Checking for Rate Limit Issues...');
  
  // Test OpenAI API directly
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      });
      
      if (response.status === 429) {
        console.log('   ❌ RATE LIMIT: OpenAI API returned 429');
        const retryAfter = response.headers.get('retry-after');
        if (retryAfter) {
          console.log(`   ⏳ Retry after: ${retryAfter} seconds`);
        }
        return false;
      } else if (response.status === 401) {
        console.log('   ❌ AUTH ERROR: OpenAI API key invalid');
        return false;
      } else if (response.status === 402 || response.status === 403) {
        console.log('   ❌ QUOTA ERROR: OpenAI API quota/billing issue');
        return false;
      } else if (response.ok) {
        console.log('   ✅ OpenAI API: No rate limits (HTTP 200)');
        return true;
      } else {
        console.log(`   ⚠️  OpenAI API: Unexpected status ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log(`   ⚠️  OpenAI API: Error checking (${error.message})`);
      return false;
    }
  } else {
    console.log('   ⚠️  OPENAI_API_KEY not set');
    return false;
  }
}

async function checkGeminiLimits() {
  console.log('');
  console.log('2️⃣ Checking Gemini API...');
  
  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
      
      if (response.status === 429) {
        console.log('   ❌ RATE LIMIT: Gemini API returned 429');
        return false;
      } else if (response.status === 401 || response.status === 403) {
        console.log('   ❌ AUTH ERROR: Gemini API key invalid');
        return false;
      } else if (response.ok) {
        console.log('   ✅ Gemini API: No rate limits (HTTP 200)');
        return true;
      } else {
        console.log(`   ⚠️  Gemini API: Unexpected status ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log(`   ⚠️  Gemini API: Error checking (${error.message})`);
      return false;
    }
  } else {
    console.log('   ⚠️  GEMINI_API_KEY not set');
    return false;
  }
}

// Check error patterns in code
function checkErrorHandling() {
  console.log('');
  console.log('3️⃣ Checking Error Handling Code...');
  
  const contentWarningAgentPath = path.join(__dirname, '..', 'lib', 'content-warning-agent.ts');
  const multiModelServicePath = path.join(__dirname, '..', 'lib', 'services', 'multi-model-service.ts');
  
  if (fs.existsSync(contentWarningAgentPath)) {
    const content = fs.readFileSync(contentWarningAgentPath, 'utf8');
    
    const hasRateLimitHandling = content.includes('rate limit') || content.includes('429') || content.includes('quota');
    const hasErrorHandling = content.includes('catch') && content.includes('error');
    const hasFallback = content.includes('Promise.allSettled');
    
    console.log(`   ${hasRateLimitHandling ? '✅' : '❌'} Rate limit handling: ${hasRateLimitHandling ? 'Present' : 'Missing'}`);
    console.log(`   ${hasErrorHandling ? '✅' : '❌'} Error handling: ${hasErrorHandling ? 'Present' : 'Missing'}`);
    
    if (fs.existsSync(multiModelServicePath)) {
      const multiModelContent = fs.readFileSync(multiModelServicePath, 'utf8');
      const hasMultiModelFallback = multiModelContent.includes('Promise.allSettled');
      console.log(`   ${hasMultiModelFallback ? '✅' : '❌'} Multi-model fallback: ${hasMultiModelFallback ? 'Present' : 'Missing'}`);
    }
    
    return hasRateLimitHandling && hasErrorHandling;
  } else {
    console.log('   ❌ Content warning agent file not found');
    return false;
  }
}

// Check OpenAI usage/limits from dashboard info
function checkUsageInfo() {
  console.log('');
  console.log('4️⃣ Usage Information:');
  console.log('   📊 Based on your OpenAI dashboard:');
  console.log('      - Budget: $120/month');
  console.log('      - Used: $12.03 (10%)');
  console.log('      - Rate Limits: 30,000 TPM, 500 RPM');
  console.log('      - Status: ✅ Well within limits');
  console.log('');
  console.log('   💡 Rate limit indicators to watch for:');
  console.log('      - HTTP 429 responses');
  console.log('      - "rate limit" in error messages');
  console.log('      - "quota exceeded" in error messages');
  console.log('      - "TPM" or "RPM" in error messages');
}

// Run checks
(async () => {
  const openaiOk = await checkRateLimits();
  const geminiOk = await checkGeminiLimits();
  const errorHandlingOk = checkErrorHandling();
  checkUsageInfo();
  
  console.log('');
  console.log('📊 Summary:');
  console.log(`   OpenAI API: ${openaiOk ? '✅ Working' : '❌ Issues detected'}`);
  console.log(`   Gemini API: ${geminiOk ? '✅ Working' : '❌ Issues detected'}`);
  console.log(`   Error Handling: ${errorHandlingOk ? '✅ Present' : '❌ Missing'}`);
  console.log('');
  
  if (openaiOk && geminiOk && errorHandlingOk) {
    console.log('🎉 All systems operational!');
    console.log('   ✅ No rate limits detected');
    console.log('   ✅ APIs responding normally');
    console.log('   ✅ Error handling in place');
    console.log('');
    console.log('💡 The agents will:');
    console.log('   - Return error messages in reasoning field if issues occur');
    console.log('   - Use Promise.allSettled to prevent complete failures');
    console.log('   - Log errors to console for debugging');
  } else {
    console.log('⚠️  Some issues detected');
    console.log('   Check the details above');
  }
})();

