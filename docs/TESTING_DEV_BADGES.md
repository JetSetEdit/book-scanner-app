# Testing Dev Badge Visibility

This guide explains how to verify that dev badges ("public", "Dev" button) are properly hidden in production.

## Quick Test Methods

### Method 1: Browser Console Test (Recommended)

1. **On your production site** (e.g., `subtext.app` or `subtext.vercel.app`):
   - Open browser DevTools (F12 or Cmd+Option+I)
   - Go to Console tab
   - Copy and paste the entire contents of `scripts/test-dev-badges-browser.js`
   - Press Enter

2. **Expected Result:**
   - ✅ Should show: "Badges are NOT visible - CORRECT!"
   - ❌ If it shows: "Badges ARE visible - INCORRECT!" → The fix didn't work

### Method 2: Visual Inspection

1. **On localhost** (`http://localhost:3000`):
   - ✅ You SHOULD see: "public" badge and "Dev" button
   - This confirms dev mode detection works

2. **On production** (your Vercel/custom domain):
   - ✅ You should NOT see: "public" badge or "Dev" button
   - ✅ You SHOULD see: Version badge (v1.03.49) - this is intentional

### Method 3: Command Line Test

Run the automated test script:

```bash
npx tsx scripts/test-dev-badges.ts
```

This tests the logic against various hostnames and should show all tests passing.

## What Gets Hidden

- ✅ **"public" variant badge** - Hidden in production
- ✅ **"Dev" button** - Hidden in production  
- ✅ **Dev Settings dropdown** - Hidden in production

## What Stays Visible

- ✅ **Version badge (v1.03.49)** - Always visible (intentional)
- ✅ **All other UI elements** - Normal functionality

## Production Domains That Hide Badges

The following hostname patterns will hide dev badges:
- `*.vercel.app` (e.g., `subtext.vercel.app`)
- `*.netlify.app`
- `subtext.app` (and any subdomain)
- Any custom domain that's not localhost

## Localhost Domains That Show Badges

The following will show dev badges:
- `localhost`
- `127.0.0.1`
- `192.168.*.*` (local network)
- `10.*.*.*` (local network)

## Troubleshooting

### Badges Still Showing in Production?

1. **Check browser cache** - Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
2. **Verify hostname** - Check `window.location.hostname` in console
3. **Check build** - Make sure you've rebuilt/redeployed after the fix
4. **Verify code** - Check `components/navbar.tsx` has the updated `isDevMode()` function

### Badges Not Showing on Localhost?

1. **Check hostname** - Make sure you're using `localhost` not an IP
2. **Check React state** - The `isDev` state might not be updating
3. **Check browser console** - Look for any JavaScript errors

## Manual Verification Checklist

- [ ] Run `npx tsx scripts/test-dev-badges.ts` - All tests pass
- [ ] Visit `http://localhost:3000` - Badges visible
- [ ] Visit production site - Badges hidden
- [ ] Run browser console test on production - Confirms badges hidden
- [ ] Check multiple pages on production - Badges hidden everywhere
