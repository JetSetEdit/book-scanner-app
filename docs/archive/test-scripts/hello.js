#!/usr/bin/env node

/**
 * Hello Script - Test environment and verify APIs are working
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

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
  console.log('📝 Loaded .env.local');
  console.log('');
}

console.log('👋 Hello from Subtext Book Scanner!');
console.log('');

// Check Node version
const nodeVersion = process.version;
console.log(`✅ Node.js version: ${nodeVersion}`);

// Check environment
console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);

const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log(`✅ Project: ${packageJson.name}`);
  console.log(`✅ Version: ${packageJson.version}`);
}

console.log('');
console.log('🔍 Testing Environment Variables...');
console.log('');

// Test OpenAI API Key
async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('   ❌ OPENAI_API_KEY: Not set');
    return false;
  }
  
  // Check format
  if (!apiKey.startsWith('sk-')) {
    console.log('   ⚠️  OPENAI_API_KEY: Invalid format (should start with sk-)');
    return false;
  }
  
  // Make a simple API call to verify it works
  try {
    // Use Node's https module if fetch is not available
    const useFetch = typeof fetch !== 'undefined';
    
    if (useFetch) {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ OPENAI_API_KEY: Working (can access ${data.data?.length || 0} models)`);
        return true;
      } else {
        console.log(`   ❌ OPENAI_API_KEY: Invalid (HTTP ${response.status})`);
        return false;
      }
    } else {
      // Fallback to https module
      return new Promise((resolve) => {
        const req = https.request('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        }, (res) => {
          if (res.statusCode === 200) {
            console.log(`   ✅ OPENAI_API_KEY: Working (HTTP ${res.statusCode})`);
            resolve(true);
          } else {
            console.log(`   ❌ OPENAI_API_KEY: Invalid (HTTP ${res.statusCode})`);
            resolve(false);
          }
        });
        
        req.on('error', (error) => {
          console.log(`   ⚠️  OPENAI_API_KEY: Error testing (${error.message})`);
          resolve(false);
        });
        
        req.end();
      });
    }
  } catch (error) {
    console.log(`   ⚠️  OPENAI_API_KEY: Error testing (${error.message})`);
    return false;
  }
}

// Test Gemini API Key
async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('   ❌ GEMINI_API_KEY: Not set');
    return false;
  }
  
  // Check format (Gemini keys start with AIza)
  if (!apiKey.startsWith('AIza')) {
    console.log('   ⚠️  GEMINI_API_KEY: Invalid format (should start with AIza)');
    return false;
  }
  
  // Make a simple API call to verify it works
  try {
    const useFetch = typeof fetch !== 'undefined';
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    if (useFetch) {
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ GEMINI_API_KEY: Working (can access models)`);
        return true;
      } else {
        console.log(`   ❌ GEMINI_API_KEY: Invalid (HTTP ${response.status})`);
        return false;
      }
    } else {
      return new Promise((resolve) => {
        const req = https.get(url, (res) => {
          if (res.statusCode === 200) {
            console.log(`   ✅ GEMINI_API_KEY: Working (HTTP ${res.statusCode})`);
            resolve(true);
          } else {
            console.log(`   ❌ GEMINI_API_KEY: Invalid (HTTP ${res.statusCode})`);
            resolve(false);
          }
        });
        
        req.on('error', (error) => {
          console.log(`   ⚠️  GEMINI_API_KEY: Error testing (${error.message})`);
          resolve(false);
        });
      });
    }
  } catch (error) {
    console.log(`   ⚠️  GEMINI_API_KEY: Error testing (${error.message})`);
    return false;
  }
}

// Test Supabase connection
async function testSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('   ❌ SUPABASE: Not configured (missing URL or key)');
    return false;
  }
  
  // Test connection by making a simple health check
  try {
    const useFetch = typeof fetch !== 'undefined';
    const url = new URL(supabaseUrl);
    url.pathname = '/rest/v1/';
    
    if (useFetch) {
      const response = await fetch(url.toString(), {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });
      
      if (response.ok || response.status === 404) {
        // 404 is fine - it means Supabase is responding
        console.log(`   ✅ SUPABASE: Connected (${url.hostname})`);
        return true;
      } else {
        console.log(`   ⚠️  SUPABASE: Connection issue (HTTP ${response.status})`);
        return false;
      }
    } else {
      return new Promise((resolve) => {
        const req = https.get(url.toString(), {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }, (res) => {
          if (res.statusCode === 200 || res.statusCode === 404) {
            console.log(`   ✅ SUPABASE: Connected (${url.hostname})`);
            resolve(true);
          } else {
            console.log(`   ⚠️  SUPABASE: Connection issue (HTTP ${res.statusCode})`);
            resolve(false);
          }
        });
        
        req.on('error', (error) => {
          console.log(`   ⚠️  SUPABASE: Error testing (${error.message})`);
          resolve(false);
        });
      });
    }
  } catch (error) {
    console.log(`   ⚠️  SUPABASE: Error testing (${error.message})`);
    return false;
  }
}

// Check if key files exist
console.log('📁 Key Files:');
const keyFiles = [
  'lib/config/taxonomy-v2.ts',
  'components/content-warnings-list.tsx',
  'lib/services/scan-service.ts',
];

keyFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(filePath);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// Run async tests
(async () => {
  console.log('');
  console.log('🧪 Testing API Connections...');
  console.log('');
  
  await testOpenAI();
  await testGemini();
  await testSupabase();
  
  console.log('');
  console.log('🎉 All checks complete!');
  console.log('');
  console.log('To test the app:');
  console.log('  1. Run: npm run dev');
  console.log('  2. Visit: http://localhost:3000');
  console.log('  3. Try scanning a book!');
})();

