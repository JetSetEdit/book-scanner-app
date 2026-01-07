#!/usr/bin/env tsx
/**
 * Test if Gemini API is responding correctly
 * Usage: npx tsx scripts/test-gemini-response.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load .env.local FIRST before any other imports
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config(); // Fallback to .env
}

async function testGemini() {
  console.log('🧪 Testing Gemini API Response\n');
  console.log('='.repeat(60));
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    console.log('\nPlease set GEMINI_API_KEY in your .env.local file');
    process.exit(1);
  }
  
  console.log(`✅ GEMINI_API_KEY found (${apiKey.substring(0, 10)}...)`);
  console.log('\n');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Test models in order of preference
  const modelsToTest = [
    'gemini-2.5-flash',
    'gemini-3-flash',
    'gemini-2.0-flash'
  ];
  
  let workingModel = null;
  
  for (const modelName of modelsToTest) {
    console.log(`🔍 Testing ${modelName}...`);
    
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const prompt = `Analyze this book for content warnings:

Title: The Hunger Games
Author: Suzanne Collins
Description: In a dystopian future, teenagers are forced to fight to the death in an annual televised event.

Return a JSON object with a "warnings" array. Each warning should have:
- subcategory_id (e.g., "violence.graphic_violence")
- description (e.g., "Moderate violence including combat and death")
- severity ("mild", "moderate", or "severe")

Return only valid JSON, no markdown.`

      const startTime = Date.now();
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const latency = Date.now() - startTime;
      
      console.log(`   ✅ ${modelName} responded in ${latency}ms`);
      console.log(`   Response length: ${text.length} characters`);
      
      // Try to parse as JSON
      let jsonText = text;
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
      
      try {
        const parsed = JSON.parse(jsonText);
        console.log(`   ✅ Valid JSON response`);
        if (parsed.warnings && Array.isArray(parsed.warnings)) {
          console.log(`   ✅ Found ${parsed.warnings.length} warning(s)`);
          if (parsed.warnings.length > 0) {
            console.log(`   Example: ${parsed.warnings[0].subcategory_id} - ${parsed.warnings[0].description?.substring(0, 60)}...`);
          }
        }
      } catch (parseError) {
        console.log(`   ⚠️  Response is not valid JSON (but API is working)`);
        console.log(`   First 200 chars: ${text.substring(0, 200)}...`);
      }
      
      workingModel = modelName;
      console.log(`\n✅ ${modelName} is working correctly!\n`);
      break;
      
    } catch (error) {
      console.log(`   ❌ ${modelName} failed`);
      if (error instanceof Error) {
        console.log(`   Error: ${error.message}`);
        if (error.message.includes('404') || error.message.includes('not found')) {
          console.log(`   (Model may not be available in your region/account)`);
        } else if (error.message.includes('429') || error.message.includes('quota')) {
          console.log(`   (Rate limit or quota exceeded)`);
        } else if (error.message.includes('API key')) {
          console.log(`   (Invalid API key)`);
        }
      }
      console.log('');
    }
  }
  
  console.log('='.repeat(60));
  
  if (workingModel) {
    console.log(`\n✅ SUCCESS: Gemini is responding!`);
    console.log(`   Working model: ${workingModel}`);
    console.log(`\n💡 This model will be used for cross-validation with ChatGPT`);
  } else {
    console.log(`\n❌ FAILURE: No Gemini models are responding`);
    console.log(`\nPossible issues:`);
    console.log(`   1. Invalid or missing GEMINI_API_KEY`);
    console.log(`   2. API quota exceeded`);
    console.log(`   3. Models not available in your region/account`);
    console.log(`   4. Network connectivity issues`);
    console.log(`\nThe system will continue to work with OpenAI only.`);
  }
  
  console.log('');
}

testGemini().catch(error => {
  console.error('\n❌ Test failed with error:', error);
  process.exit(1);
});

