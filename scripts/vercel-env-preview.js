#!/usr/bin/env node
/**
 * Add Production-only env vars to Vercel Preview using values from .env.local.
 * Run from repo root: node scripts/vercel-env-preview.js
 * Requires: .env.local present, vercel CLI logged in.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Missing .env.local');
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of content.split('\n')) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (m) {
    const key = m[1];
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1).replace(/\\n/g, '\n');
    }
    env[key] = val;
  }
}

const neededForPreview = [
  'OPENAI_API_KEY',
  'GOOGLE_BOOKS_API_KEY',
  'SCAN_RATE_LIMIT',
];

for (const key of neededForPreview) {
  const value = env[key];
  if (!value) {
    console.warn(`Skip ${key}: not in .env.local`);
    continue;
  }
  try {
    execSync(`vercel env add ${key} preview --force`, {
      input: value,
      stdio: ['pipe', 'inherit', 'inherit'],
      cwd: process.cwd(),
    });
    console.log(`Added ${key} to Preview`);
  } catch (e) {
    console.error(`Failed to add ${key}:`, e.message);
  }
}

console.log('Done. Redeploy preview for new env to take effect: vercel');
