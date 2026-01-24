# Testing the Referral System

## Quick Test Flow

### 1. Generate Your Referral Code

**Option A: Via UI**
1. Visit: `https://www.subtextscanner.com.au/settings`
2. Scroll to "Share Subtext" section
3. Your referral link should appear (e.g., `https://www.subtextscanner.com.au/share/jordan-x9k2`)
4. Click "Copy" to copy the link

**Option B: Via API**
```bash
curl https://www.subtextscanner.com.au/api/referral/generate
```

Expected response:
```json
{
  "code": "jordan-x9k2",
  "shareUrl": "https://www.subtextscanner.com.au/share/jordan-x9k2"
}
```

### 2. Test Referral Link Click

**Steps:**
1. Open the referral link in a **new incognito/private window** (simulates a different user)
   - Example: `https://www.subtextscanner.com.au/share/jordan-x9k2`
2. You should be redirected to the homepage
3. A referral cookie (`subtext_ref`) should be set (check browser DevTools → Application → Cookies)

**Verify:**
- Check browser console for any errors
- Cookie should be set with 30-day expiration
- A 'click' event should be recorded in the database

### 3. Test Bonus Claiming (First Scan)

**Steps:**
1. With the referral cookie set (from step 2), perform a scan:
   - Go to `/scan` page
   - Scan any ISBN (e.g., `9780143127741`)
2. After the scan completes successfully, the bonus should be automatically claimed

**Verify:**
- Check server logs for: `"Referral bonus claimed: X scans awarded to Y recipient(s)"`
- Query database to see bonus was granted:
  ```sql
  SELECT * FROM user_bonus_scans 
  WHERE user_id = '<your_user_id>' 
  ORDER BY awarded_at DESC;
  ```
- Check `referral_events` table for 'first_scan' and 'bonus_granted' events

### 4. Test Rate Limit Integration

**Steps:**
1. Check your current rate limit (should include bonus scans):
   - Perform a scan and check the response
   - Look for `rateLimit.effectiveLimit` in the response
2. Effective limit = base limit (5) + bonus scans (3) = 8

**Verify:**
- Rate limit response shows increased limit
- You can perform more scans than the base limit
- Bonus scans expire after 7 days (default)

### 5. Test Multi-Level Referrals (A → B → C)

**Steps:**
1. **User A**: Generate referral code (e.g., `alex-x9k2`)
2. **User B**: Click A's link, perform first scan (B gets bonus from A)
3. **User B**: Generate their own referral code (e.g., `sam-7m3p`)
4. **User C**: Click B's link, perform first scan
   - B should get bonus (immediate referrer)
   - A should get bonus (parent referrer, 2 levels deep)

**Verify:**
- Both A and B receive bonus scans
- Check `referral_events` table for `parent_referrer_user_id` populated
- Maximum 2 levels (A → B → C, no further)

### 6. Test Abuse Prevention

#### Self-Referral Prevention
1. Generate your referral code
2. Click your own referral link
3. **Expected**: No bonus awarded, cookie not set

#### Duplicate Claim Prevention
1. Click a referral link
2. Perform first scan (bonus claimed)
3. Perform another scan with same referral cookie
4. **Expected**: No additional bonus awarded

#### Expiration Test
1. Check bonus scans expire after configured days (default: 7)
2. Query expired bonuses:
   ```sql
   SELECT * FROM user_bonus_scans 
   WHERE expires_at < NOW();
   ```

## Database Verification Queries

### Check Referral Links
```sql
SELECT * FROM referral_links 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Referral Events
```sql
SELECT 
  event_type,
  user_id,
  referrer_code,
  referrer_user_id,
  parent_referrer_user_id,
  event_at
FROM referral_events 
ORDER BY event_at DESC 
LIMIT 20;
```

### Check Bonus Scans
```sql
SELECT 
  user_id,
  bonus_amount,
  awarded_at,
  expires_at,
  expires_at > NOW() as is_active
FROM user_bonus_scans 
ORDER BY awarded_at DESC 
LIMIT 20;
```

### Check Active Bonus Scans for a User
```sql
SELECT 
  user_id,
  SUM(bonus_amount) as total_bonus_scans
FROM user_bonus_scans 
WHERE user_id = '<user_id>' 
  AND expires_at > NOW()
GROUP BY user_id;
```

## Testing Checklist

- [ ] Referral code generation works
- [ ] Referral link redirects correctly
- [ ] Referral cookie is set on click
- [ ] Bonus is awarded on first scan
- [ ] Rate limit includes bonus scans
- [ ] Multi-level referrals work (2 levels)
- [ ] Self-referral is blocked
- [ ] Duplicate claims are prevented
- [ ] Bonus scans expire correctly
- [ ] Events are recorded in database

## Common Issues

### Issue: Referral code not generating
**Check:**
- API route is accessible
- Database connection working
- User identifier generation working

### Issue: Bonus not awarded
**Check:**
- Referral cookie is set
- First scan completed successfully
- No duplicate claim exists
- Check server logs for errors

### Issue: Rate limit not including bonuses
**Check:**
- `getActiveBonusScans()` is being called
- Bonus scans are not expired
- User ID is being passed correctly

## Manual Testing Script

You can also use this browser console script to test:

```javascript
// 1. Generate referral code
fetch('/api/referral/generate')
  .then(r => r.json())
  .then(data => {
    console.log('Referral code:', data.code);
    console.log('Share URL:', data.shareUrl);
  });

// 2. Check if referral cookie is set
console.log('Referral cookie:', document.cookie.includes('subtext_ref'));

// 3. After scan, check rate limit includes bonuses
// (Check network tab for scan API response)
```

## Production Testing

For production testing, use:
- **Production URL**: `https://www.subtextscanner.com.au`
- **Settings page**: `https://www.subtextscanner.com.au/settings`
- **Scan page**: `https://www.subtextscanner.com.au/scan`

Make sure to test in incognito/private windows to simulate different users!
