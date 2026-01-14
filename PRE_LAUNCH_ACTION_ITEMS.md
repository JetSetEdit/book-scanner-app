# Pre-Launch Action Items

**Date:** 2026-01-12  
**Status:** Ready to verify and launch

---

## 🎯 IMMEDIATE ACTIONS (Do These Now)

### 1. ✅ Run Local Verification
```bash
npx tsx scripts/verify-production-readiness.ts
```

**Expected Result:** All required environment variables should pass. Rate limit will show as warning (not set = defaults to 5).

---

### 2. ⚡ Adjust Rate Limit in Vercel (Recommended)

**Current:** 5 scans/day per IP (default)  
**Recommended for Beta:** 15 scans/day per IP

**Steps:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add/Update: `SCAN_RATE_LIMIT` = `15`
5. Select **Production** environment
6. Save (no redeploy needed - will apply on next deployment)

**Why:** 5 scans/day is too restrictive for beta testing. Users will hit the limit quickly.

---

### 3. ✅ Verify Production Environment Variables

**Go to:** Vercel Dashboard → Project → Settings → Environment Variables

**Check these are set for Production:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `OPENAI_API_KEY`
- [ ] `GEMINI_API_KEY`

**Optional but Recommended:**
- [ ] `SCAN_RATE_LIMIT=15` (see step 2)
- [ ] `GEMINI_DAILY_QUOTA_LIMIT=20` (verify matches your quota)
- [ ] `GEMINI_QUOTA_WARNING_THRESHOLD=15`

---

### 4. 🧪 Test Production Scan

**Steps:**
1. Visit your production URL
2. Try scanning a test book:
   - ISBN: `9780593356159` (The Maid - good test book)
   - Or: `9780307588371` (Gone Girl)
3. Verify:
   - [ ] Scan completes successfully
   - [ ] Content warnings are displayed
   - [ ] No errors in browser console (F12)
   - [ ] Rate limit info shows correctly
   - [ ] Beta disclaimer is visible

---

### 5. ✅ Check Beta Disclaimers

**Verify:**
- [ ] Beta onboarding modal appears for new users
- [ ] Terms page accessible: `[your-url]/terms`
- [ ] Privacy page accessible: `[your-url]/privacy`
- [ ] Beta banner/notice is visible (if implemented)

---

## 📊 MONITORING (After Launch)

### First 24 Hours

**Check These:**
1. **Vercel Function Logs**
   - Dashboard → Project → Functions → View Logs
   - Look for errors or rate limit issues

2. **Supabase Logs**
   - Dashboard → Logs → API Logs
   - Monitor database performance

3. **User Feedback**
   ```bash
   npx tsx scripts/view-feedback.ts --limit=20
   ```

4. **Rate Limiting**
   - Check if users are hitting limits
   - Adjust `SCAN_RATE_LIMIT` if needed

---

## ⚠️ IF ISSUES OCCUR

### Rate Limit Too Low
**Symptom:** Users complaining about hitting limits  
**Fix:** Increase `SCAN_RATE_LIMIT` in Vercel (see step 2)

### API Errors
**Symptom:** Scans failing with API errors  
**Check:**
- OpenAI API credits/billing
- Gemini quota usage
- API keys are correct

### Database Errors
**Symptom:** Scans failing with database errors  
**Check:**
- Supabase connection
- RLS policies
- Database migrations applied

---

## ✅ FINAL CHECKLIST

Before announcing public beta:

- [ ] Local verification script passes
- [ ] Rate limit adjusted to 15/day (or your preference)
- [ ] All environment variables set in Vercel
- [ ] Test scan works on production
- [ ] Beta disclaimers visible
- [ ] Terms/Privacy pages accessible
- [ ] Monitoring setup ready

---

## 📚 QUICK REFERENCE

### Verification Script
```bash
npx tsx scripts/verify-production-readiness.ts
```

### View User Feedback
```bash
npx tsx scripts/view-feedback.ts --limit=10
```

### Check Queue Status
```bash
npx tsx scripts/check-queue.ts
```

### Important URLs
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com
- **Production URL:** [Your Vercel deployment URL]

---

## 🎉 READY TO LAUNCH

Once all items above are checked:

1. ✅ All verification passed
2. ✅ Rate limits adjusted
3. ✅ Production tested
4. ✅ Monitoring ready

**You're ready to announce public beta!** 🚀

---

**Last Updated:** 2026-01-12  
**Version:** 1.03.11
