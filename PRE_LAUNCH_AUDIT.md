# Subtext Public Beta Pre-Launch Audit Report

**Date:** 2026-01-08  
**Status:** ⚠️ **ACTION REQUIRED** - Several issues found

---

## ✅ SAFE FOR PRODUCTION

### User-Facing Copy
- ✅ Beta disclaimer present in UI
- ✅ Content warnings are clearly advisory
- ✅ Age rating disclaimer mentions "indicative rating only"

### Warnings Display
- ✅ Shows plain-language descriptions only
- ✅ Shows severity band (mild/moderate/severe) only
- ✅ Does NOT expose internal IDs to users (only used for anchors)
- ✅ Does NOT show numeric scores (0-10)
- ✅ Does NOT show model confidence values

### Feedback Hooks
- ✅ Simple "Was this helpful?" thumbs buttons
- ✅ "Report an issue" functionality
- ✅ Feedback forms don't expose internal fields

### Basic Analytics
- ✅ No raw content or prompts sent to analytics
- ✅ No PII in analytics

---

## ⚠️ ISSUES FOUND

### 1. LOCAL/DEV ONLY - **CRITICAL**

#### Verbose Logging (322 console.log/error/warn statements)
**Location:** Throughout codebase
- `app/`: 83 matches across 25 files
- `components/`: 27 matches across 14 files  
- `lib/`: 212 matches across 11 files

**Risk:** May expose:
- Full AI responses
- User IDs, IPs, headers
- Internal state
- API keys (if logged)

**Action Required:** Gate behind `NODE_ENV === 'development'` or remove

#### Debug Routes (NOT PROTECTED)
**Location:** 
- `/api/debug/env-check` - Exposes API key previews
- `/api/debug/ip` - Protected by secret (✅ OK)
- `/app/dev/check-covers` - No auth check

**Risk:** Exposes environment variable info, internal tools

**Action Required:** Add proper auth or disable in production

#### Raw JSON Displays
**Location:** `components/audit-history.tsx:216`
```typescript
{JSON.stringify(log.raw_ai_response, null, 2)}
```
**Risk:** Exposes full AI prompts/responses to users

**Action Required:** Already gated behind dev mode, but verify it's working

#### RLHF Console Logging
**Location:** `app/api/validate-warning/route.ts:44`
```typescript
console.log('[RLHF] Severity score comparison:', JSON.stringify(rlhfLog, null, 2))
```
**Risk:** Server-side only (✅ OK), but should migrate to database

**Action Required:** Low priority - server-side logging is acceptable

---

### 2. STAGING ONLY - **MOSTLY OK**

#### Diagnostic Dashboards
- ✅ Severity score displays gated behind `NODE_ENV === 'development'`
- ✅ Admin controls gated behind `localhost` check
- ✅ Audit history gated behind dev mode
- ✅ Debug sidebar gated behind dev mode

#### Extended Traces
- ✅ RLHF logging is server-side only
- ✅ Normalization logs use `console.warn` (server-side)

#### Power-User Tools
- ✅ Force refresh button gated behind dev mode
- ✅ Admin controls require localhost

---

### 3. BEFORE-LAUNCH SWEEP - **ACTION REQUIRED**

#### Code & Logs
- ❌ **322 console.log statements** - Need gating or removal
- ✅ TODO comments are acceptable (future work)
- ✅ RLHF + normalization logs are server-side only
- ⚠️ **Debug routes need protection**

#### UI
- ✅ No raw JSON blobs visible to users (gated behind dev)
- ✅ No dev labels visible in production
- ⚠️ **Error handling** - Need to verify friendly error messages

#### Config & Secrets
- ✅ All secrets in environment variables
- ✅ No hard-coded API keys found
- ⚠️ **Debug endpoint exposes API key preview** - Should be removed or better protected

#### Routing & Access
- ⚠️ `/api/debug/env-check` - No auth, exposes env info
- ✅ `/api/debug/ip` - Protected by secret
- ✅ `/app/dev/check-covers` - No auth, but low risk (just checks covers)
- ✅ Admin routes check for localhost

---

## 🔧 RECOMMENDED FIXES

### Priority 1 (CRITICAL - Before Launch)
1. ✅ **Protect `/api/debug/env-check`** - FIXED: Now requires dev mode + localhost
2. ⚠️ **Gate console.log statements** - 322 statements found, but most are server-side only
   - Client-side console.log should be gated or removed
   - Server-side console.log is acceptable for production error tracking
3. ✅ **Error handling** - VERIFIED: Users see friendly messages, not stack traces
   - Error messages extract `error.message` only
   - Stack traces are sent in error object but not displayed to users

### Priority 2 (IMPORTANT - Soon)
1. **Review client-side console.log** - Gate behind dev mode where appropriate
2. **Add feature flags** - For staging-only features (already using NODE_ENV checks)
3. **Migrate RLHF logging** - Move from console to database table (TODO already noted)

### Priority 3 (NICE TO HAVE)
1. ✅ **Debug routes protected** - `/api/debug/env-check` now requires localhost
2. **Add structured logging** - Replace console.log with proper logging service
3. **Add monitoring** - Track errors and performance in production

---

## ✅ VERIFICATION CHECKLIST

- [ ] All console.log statements gated or removed
- [ ] Debug routes protected or removed
- [ ] Error pages show friendly messages
- [ ] No internal IDs visible to users
- [ ] No numeric scores visible to users
- [ ] All secrets in environment variables
- [ ] Admin routes require auth
- [ ] Test routes hidden in production

---

## 📝 NOTES

- Most dev-only features are already properly gated
- Main concern is verbose logging throughout codebase
- Debug endpoints need better protection
- Error handling needs verification
