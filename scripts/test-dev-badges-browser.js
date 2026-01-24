/**
 * Browser Console Test for Dev Badge Visibility
 * 
 * Copy and paste this entire script into your browser console on your production site
 * to verify the badges are properly hidden.
 * 
 * Usage:
 *   1. Open your production site (e.g., subtext.app or subtext.vercel.app)
 *   2. Open browser DevTools (F12 or Cmd+Option+I)
 *   3. Go to Console tab
 *   4. Paste this entire script and press Enter
 */

(function testDevBadges() {
  console.log('🧪 Testing Dev Badge Visibility in Browser\n');
  console.log('='.repeat(60));
  
  // Get current hostname
  const hostname = window.location.hostname.toLowerCase();
  console.log(`📍 Current hostname: ${hostname}`);
  console.log(`📍 Full URL: ${window.location.href}\n`);
  
  // Replicate the isDevMode logic from navbar.tsx
  function isDevMode() {
    const hostnameLower = hostname;
    
    // Explicitly hide in production domains
    if (hostnameLower.includes('.vercel.app') || 
        hostnameLower.includes('.netlify.app') ||
        hostnameLower.includes('subtext.app') ||
        (hostnameLower !== 'localhost' && 
         hostnameLower !== '127.0.0.1' && 
         !hostnameLower.startsWith('192.168.') && 
         !hostnameLower.startsWith('10.') &&
         !hostnameLower.includes('localhost'))) {
      return false;
    }
    
    // Only show on localhost or local network
    return (
      hostnameLower === 'localhost' ||
      hostnameLower === '127.0.0.1' ||
      hostnameLower.startsWith('192.168.') ||
      hostnameLower.startsWith('10.') ||
      hostnameLower.includes('localhost')
    );
  }
  
  const shouldShowBadges = isDevMode();
  console.log(`🔍 Dev mode check result: ${shouldShowBadges ? 'SHOW badges' : 'HIDE badges'}\n`);
  
  // Check if badges actually exist in DOM
  const variantBadge = document.querySelector('[title="Build-time variant (NEXT_PUBLIC_VARIANT)"]');
  const devButton = document.querySelector('button:has(span:contains("Dev"))') || 
                    Array.from(document.querySelectorAll('button')).find(btn => 
                      btn.textContent.includes('Dev') && btn.querySelector('svg')
                    );
  
  console.log('🔎 Checking DOM for badges:');
  console.log(`   Variant badge (public/lite/etc): ${variantBadge ? '❌ FOUND (should be hidden!)' : '✅ Not found (correct)'}`);
  console.log(`   Dev button: ${devButton ? '❌ FOUND (should be hidden!)' : '✅ Not found (correct)'}\n`);
  
  // Final verdict
  console.log('='.repeat(60));
  if (shouldShowBadges) {
    console.log('✅ EXPECTED: Badges SHOULD be visible (you\'re on localhost/dev)');
    if (variantBadge || devButton) {
      console.log('✅ ACTUAL: Badges ARE visible - CORRECT!');
    } else {
      console.log('❌ ACTUAL: Badges are NOT visible - INCORRECT!');
    }
  } else {
    console.log('✅ EXPECTED: Badges SHOULD be hidden (you\'re in production)');
    if (!variantBadge && !devButton) {
      console.log('✅ ACTUAL: Badges are NOT visible - CORRECT!');
      console.log('\n🎉 SUCCESS: Dev badges are properly hidden in production!');
    } else {
      console.log('❌ ACTUAL: Badges ARE visible - INCORRECT!');
      console.log('\n⚠️  WARNING: Dev badges are showing in production!');
      console.log('   This needs to be fixed before launch.');
    }
  }
  
  return {
    hostname,
    shouldShowBadges,
    variantBadgeFound: !!variantBadge,
    devButtonFound: !!devButton,
    isCorrect: shouldShowBadges ? (!!variantBadge || !!devButton) : (!variantBadge && !devButton)
  };
})();
