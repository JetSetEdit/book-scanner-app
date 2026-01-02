#!/usr/bin/env node

/**
 * Script to disable deployment protection on Vercel project
 * This disables both SSO protection and password protection
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Get Vercel token from auth.json
const authPath = path.join(os.homedir(), '.vercel', 'auth.json');
let token;

try {
  const authData = JSON.parse(fs.readFileSync(authPath, 'utf8'));
  token = authData.token;
} catch (error) {
  console.error('❌ Could not read Vercel auth token. Please run: vercel login');
  process.exit(1);
}

const projectId = 'prj_lgJWu7BTgNcr0NgPac0lD2WeIE0x';
const teamId = 'team_u7JsqTfRyrAq1foTpp9iMjJp';

const data = JSON.stringify({
  ssoProtection: null,
  passwordProtection: null
});

const options = {
  hostname: 'api.vercel.com',
  port: 443,
  path: `/v9/projects/${projectId}?teamId=${teamId}`,
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🔄 Disabling deployment protection...');
console.log(`   Project: ${projectId}`);
console.log(`   Team: ${teamId}\n`);

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Successfully disabled deployment protection!');
      console.log('   Your site should now be publicly accessible.\n');
      console.log('🌐 Production URL: https://subtext-books.vercel.app');
    } else {
      console.error(`❌ Error: ${res.statusCode}`);
      console.error('Response:', responseData);
      try {
        const error = JSON.parse(responseData);
        console.error('Error message:', error.error?.message || error.message);
      } catch (e) {
        console.error('Raw response:', responseData);
      }
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  process.exit(1);
});

req.write(data);
req.end();


















