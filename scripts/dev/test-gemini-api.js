#!/usr/bin/env node

/**
 * Simple script to test Gemini API key
 * Usage: node scripts/test-gemini-api.js [API_KEY]
 */

// Load .env.local if it exists
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not available or .env.local doesn't exist
}

const API_KEY = process.argv[2] || process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ Error: No API key provided');
  console.log('\nUsage:');
  console.log('  node scripts/test-gemini-api.js YOUR_API_KEY');
  console.log('  OR set GEMINI_API_KEY environment variable');
  process.exit(1);
}

async function testGeminiAPI() {
  console.log('🧪 Testing Gemini API key...\n');
  console.log(`API Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}\n`);

  try {
    // First, list available models
    console.log('📋 Fetching available models...\n');
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    const listResponse = await fetch(listUrl);
    
    if (listResponse.ok) {
      const modelsData = await listResponse.json();
      const models = modelsData.models || [];
      console.log(`Found ${models.length} available models:\n`);
      models.slice(0, 10).forEach(m => {
        console.log(`  - ${m.name} (${m.displayName || 'N/A'})`);
      });
      console.log('');
      
      // Find a suitable model for generateContent
      const suitableModel = models.find(m => 
        m.name && (m.name.includes('gemini') || m.name.includes('models/gemini'))
      );
      
      if (!suitableModel) {
        console.log('⚠️  No suitable Gemini model found. Trying common model names...\n');
      }
    }
    
    // Try different model names and API versions (using newer models)
    const modelConfigs = [
      { model: 'gemini-2.5-flash', version: 'v1beta' },
      { model: 'gemini-2.5-pro', version: 'v1beta' },
      { model: 'gemini-2.0-flash', version: 'v1beta' },
      { model: 'gemini-1.5-flash', version: 'v1beta' },
      { model: 'gemini-1.5-pro', version: 'v1beta' },
    ];
    
    let lastError = null;
    
    for (const config of modelConfigs) {
      const url = `https://generativelanguage.googleapis.com/${config.version}/models/${config.model}:generateContent?key=${API_KEY}`;
      
      console.log(`Trying: ${config.model} (${config.version})...`);
      
      const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Say "Hello, Gemini API is working!" in exactly those words.'
            }]
          }]
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        lastError = data;
        console.log(`  ❌ Failed: ${data.error?.message || response.statusText}\n`);
        continue;
      }
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const text = data.candidates[0].content.parts[0].text;
        console.log(`  ✅ Success!\n`);
        console.log('Response:', text);
        console.log(`\n✅ Gemini API is working correctly with model: ${config.model} (${config.version})`);
        return;
      } else {
        console.log(`  ⚠️  Unexpected response format\n`);
        continue;
      }
    }
    
    // If we get here, all models failed
    console.error('❌ All model attempts failed. Last error:');
    if (lastError) {
      console.error(JSON.stringify(lastError, null, 2));
    }
    process.exit(1);

  } catch (error) {
    console.error('❌ Request failed:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  }
}

testGeminiAPI();

