#!/usr/bin/env tsx
/**
 * Test script to verify dev badges are properly hidden in production
 * 
 * Usage:
 *   npx tsx scripts/test-dev-badges.ts
 */

const testCases = [
  {
    hostname: 'localhost',
    expected: true,
    description: 'Localhost should show dev badges'
  },
  {
    hostname: '127.0.0.1',
    expected: true,
    description: '127.0.0.1 should show dev badges'
  },
  {
    hostname: '192.168.1.100',
    expected: true,
    description: 'Local network IP should show dev badges'
  },
  {
    hostname: '10.0.0.5',
    expected: true,
    description: 'Local network IP (10.x) should show dev badges'
  },
  {
    hostname: 'subtext.vercel.app',
    expected: false,
    description: 'Vercel production should hide dev badges'
  },
  {
    hostname: 'subtext-preview.vercel.app',
    expected: false,
    description: 'Vercel preview should hide dev badges'
  },
  {
    hostname: 'subtext.netlify.app',
    expected: false,
    description: 'Netlify production should hide dev badges'
  },
  {
    hostname: 'subtext.app',
    expected: false,
    description: 'Custom domain should hide dev badges'
  },
  {
    hostname: 'www.subtext.app',
    expected: false,
    description: 'Custom domain (www) should hide dev badges'
  },
  {
    hostname: 'subtext.com',
    expected: false,
    description: 'Custom domain (.com) should hide dev badges'
  },
  {
    hostname: 'www.subtextscanner.com.au',
    expected: false,
    description: 'Production domain (www.subtextscanner.com.au) should hide dev badges'
  },
  {
    hostname: 'subtextscanner.com.au',
    expected: false,
    description: 'Production domain (subtextscanner.com.au) should hide dev badges'
  },
]

// Replicate the isDevMode logic
function isDevMode(hostname: string): boolean {
  const hostnameLower = hostname.toLowerCase()
  
  // Explicitly hide in production domains
  if (hostnameLower.includes('.vercel.app') || 
      hostnameLower.includes('.netlify.app') ||
      hostnameLower.includes('subtext.app') ||
      hostnameLower.includes('subtextscanner.com.au') ||
      hostnameLower.includes('subtextscanner.com') ||
      (hostnameLower !== 'localhost' && 
       hostnameLower !== '127.0.0.1' && 
       !hostnameLower.startsWith('192.168.') && 
       !hostnameLower.startsWith('10.') &&
       !hostnameLower.includes('localhost'))) {
    return false
  }
  
  // Only show on localhost or local network
  return (
    hostnameLower === 'localhost' ||
    hostnameLower === '127.0.0.1' ||
    hostnameLower.startsWith('192.168.') ||
    hostnameLower.startsWith('10.') ||
    hostnameLower.includes('localhost')
  )
}

console.log('🧪 Testing Dev Badge Visibility Logic\n')
console.log('=' .repeat(60))

let passed = 0
let failed = 0

for (const testCase of testCases) {
  const result = isDevMode(testCase.hostname)
  const success = result === testCase.expected
  
  if (success) {
    console.log(`✅ PASS: ${testCase.description}`)
    console.log(`   Hostname: ${testCase.hostname}`)
    console.log(`   Result: ${result ? 'SHOW badges' : 'HIDE badges'}\n`)
    passed++
  } else {
    console.log(`❌ FAIL: ${testCase.description}`)
    console.log(`   Hostname: ${testCase.hostname}`)
    console.log(`   Expected: ${testCase.expected ? 'SHOW badges' : 'HIDE badges'}`)
    console.log(`   Got: ${result ? 'SHOW badges' : 'HIDE badges'}\n`)
    failed++
  }
}

console.log('=' .repeat(60))
console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  console.log('\n⚠️  Some tests failed! The dev badge logic needs fixing.')
  process.exit(1)
} else {
  console.log('\n✅ All tests passed! Dev badges will be properly hidden in production.')
  process.exit(0)
}
