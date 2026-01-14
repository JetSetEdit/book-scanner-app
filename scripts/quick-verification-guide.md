# Quick Pre-Launch Verification Guide

## 🚀 Quick Start (5 minutes)

### 1. Run Local Verification Script
```bash
npx tsx scripts/verify-production-readiness.ts
```

This will check:
- ✅ All required environment variables are set
- ✅ API keys are in correct format
- ✅ Supabase connection works
- ✅ Rate limit configuration
- ✅ Gemini quota settings

### 2. Verify Vercel Environment Variables

**Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variables (must be set for Production):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

**Recommended Adjustments:**
- `SCAN_RATE_LIMIT=15` (increase from default 5 for beta testing)
- `GEMINI_DAILY_QUOTA_LIMIT=20` (verify matches your quota)

### 3. Test Production Scan

1. Visit your production URL
2. Try scanning a test book (ISBN: `9780593356159`)
3. Verify:
   - Scan completes successfully
   - Warnings are displayed
   - No errors in browser console
   - Rate limit info is shown

### 4. Check Beta Disclaimers

- [ ] Beta onboarding modal appears for new users
- [ ] Terms page is accessible (`/terms`)
- [ ] Privacy page is accessible (`/privacy`)

---

## ⚡ Quick Rate Limit Adjustment

**Current:** 5 scans/day per IP  
**Recommended for Beta:** 15 scans/day per IP

**To Change:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add/Update: `SCAN_RATE_LIMIT=15`
3. Select "Production" environment
4. Redeploy (or wait for next auto-deploy)

---

## 🔍 What to Monitor After Launch

1. **Vercel Function Logs**
   - Check for errors in first few scans
   - Monitor API response times

2. **Supabase Logs**
   - Check for database errors
   - Monitor query performance

3. **User Feedback**
   ```bash
   # View recent feedback
   npx tsx scripts/view-feedback.ts --limit=10
   ```

4. **Rate Limiting**
   - Monitor if users are hitting limits
   - Adjust `SCAN_RATE_LIMIT` if needed

---

## ✅ Final Checklist

Before announcing public beta:

- [ ] All environment variables set in Vercel
- [ ] Rate limit adjusted (recommended: 15/day)
- [ ] Test scan works on production
- [ ] Beta disclaimers visible
- [ ] Terms/Privacy pages accessible
- [ ] Monitoring setup ready

---

## 🆘 If Something Goes Wrong

1. **Check Vercel Logs:** Dashboard → Project → Functions → View Logs
2. **Check Supabase Logs:** Dashboard → Logs → API Logs
3. **Run Verification Script:** `npx tsx scripts/verify-production-readiness.ts`
4. **Check Environment Variables:** Verify all are set correctly

---

**Last Updated:** 2026-01-12
