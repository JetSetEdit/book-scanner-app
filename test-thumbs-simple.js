// Simple test script to verify thumbs functionality
// Run this with: node test-thumbs-simple.js

const https = require('https');
const http = require('http');

async function testThumbsAPI() {
  console.log('🧪 Testing thumbs functionality...');
  
  const warningId = "3dca3c45-5f0d-4291-983c-594c0c4a72f7";
  const baseUrl = "http://localhost:3000";
  
  try {
    // Test 1: Check if debug page loads
    console.log('📱 Testing debug page accessibility...');
    const debugResponse = await fetch(`${baseUrl}/debug-thumbs`);
    if (debugResponse.ok) {
      console.log('✅ Debug page is accessible');
    } else {
      console.log('❌ Debug page is not accessible');
      return;
    }
    
    // Test 2: Simulate thumbs up click
    console.log('👍 Testing thumbs up functionality...');
    const thumbsUpResponse = await fetch(`${baseUrl}/debug-thumbs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'validateWarning',
        warningId: warningId,
        isHelpful: true
      })
    });
    
    if (thumbsUpResponse.ok) {
      console.log('✅ Thumbs up request successful');
    } else {
      console.log('❌ Thumbs up request failed');
    }
    
    // Test 3: Simulate thumbs down click
    console.log('👎 Testing thumbs down functionality...');
    const thumbsDownResponse = await fetch(`${baseUrl}/debug-thumbs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'validateWarning',
        warningId: warningId,
        isHelpful: false
      })
    });
    
    if (thumbsDownResponse.ok) {
      console.log('✅ Thumbs down request successful');
    } else {
      console.log('❌ Thumbs down request failed');
    }
    
    console.log('🎉 Basic API tests completed!');
    console.log('💡 To test the full UI functionality:');
    console.log('   1. Open http://localhost:3000/debug-thumbs in your browser');
    console.log('   2. Click the thumbs up/down buttons');
    console.log('   3. Watch the counts update immediately (optimistic updates)');
    console.log('   4. Check the terminal logs for server action results');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('💡 Make sure your dev server is running on http://localhost:3000');
  }
}

// Simple fetch polyfill for Node.js
global.fetch = async (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          text: () => Promise.resolve(data),
          json: () => Promise.resolve(JSON.parse(data))
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
};

testThumbsAPI();

