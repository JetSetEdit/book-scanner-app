# Security Audit: Admin Routes

**Date:** 2026-01-20  
**Status:** 🔴 CRITICAL - Multiple unprotected admin routes found

## Summary

Several admin routes are publicly accessible without authentication, exposing sensitive operations and data.

---

## Unprotected Routes (CRITICAL)

### 1. `/api/admin/manual-handling-scans`
- **Methods:** GET, PATCH
- **Risk:** HIGH - Exposes manual handling queue data, allows status updates
- **Current Protection:** ❌ NONE
- **Uses:** `supabaseAdmin` (service role key)
- **Fix Required:** Add `requireAdmin()` authentication

### 2. `/api/run-migration`
- **Methods:** POST
- **Risk:** CRITICAL - Can execute database migrations
- **Current Protection:** ❌ NONE
- **Uses:** `supabaseAdmin` with RPC calls
- **Fix Required:** Add `requireAdmin()` authentication

### 3. `/api/db-stats`
- **Methods:** GET
- **Risk:** MEDIUM - Exposes database statistics
- **Current Protection:** ❌ NONE
- **Uses:** `supabaseAdmin`
- **Fix Required:** Add `requireAdmin()` authentication

### 4. `/api/audit-logs`
- **Methods:** GET
- **Risk:** MEDIUM - Exposes audit log data
- **Current Protection:** ❌ NONE
- **Uses:** `supabaseAdmin`
- **Fix Required:** Add `requireAdmin()` authentication

### 5. `/api/add-reasoning-column`
- **Methods:** POST
- **Risk:** CRITICAL - Can modify database schema
- **Current Protection:** ❌ NONE
- **Uses:** `supabaseAdmin` with RPC calls
- **Fix Required:** Add `requireAdmin()` authentication

### 6. `/api/add-columns`
- **Methods:** POST
- **Risk:** CRITICAL - Can modify database schema
- **Current Protection:** ❌ NONE
- **Uses:** `supabaseAdmin`
- **Fix Required:** Add `requireAdmin()` authentication

### 7. `/api/validate-warning`
- **Methods:** POST
- **Risk:** LOW - User feedback endpoint (may be intentional)
- **Current Protection:** ❌ NONE
- **Uses:** `supabaseAdmin`
- **Note:** This appears to be a user-facing endpoint for feedback. Verify if this should be public.

---

## Protected Routes (✅ OK)

### 1. `/api/admin/manual-handling-scans/resolve-by-adding-book`
- **Methods:** POST
- **Protection:** ✅ `requireAdmin()` with `x-admin-secret` header
- **Status:** SECURE

### 2. `/api/admin/batch-scan/single`
- **Methods:** POST
- **Protection:** ✅ IP allowlist check via `isIpAllowlisted()`
- **Status:** SECURE

---

## Dev-Only Routes (⚠️ NOT PRODUCTION-SAFE)

### 1. `/api/admin/delete-book`
- **Methods:** DELETE
- **Protection:** ⚠️ Dev mode check only (`NODE_ENV === 'development'` or `localhost`)
- **Risk:** If dev mode is accidentally enabled in production, route becomes accessible
- **Recommendation:** Add `requireAdmin()` in addition to dev check

### 2. `/api/admin/edit-book`
- **Methods:** PATCH
- **Protection:** ⚠️ Dev mode check only
- **Risk:** Same as above
- **Recommendation:** Add `requireAdmin()` in addition to dev check

---

## Authentication Pattern

The codebase uses two authentication patterns:

### Pattern 1: `requireAdmin()` Function
```typescript
function requireAdmin(req: NextRequest): NextResponse | null {
  const secret = req.headers.get('x-admin-secret')
  const adminSecret = process.env.ADMIN_SECRET
  const debugSecret = process.env.DEBUG_IP_SECRET
  if (!adminSecret && !debugSecret) {
    return NextResponse.json(
      { ok: false, error: { code: 'ADMIN_NOT_CONFIGURED', ... } },
      { status: 503 }
    )
  }
  if (!secret || (secret !== adminSecret && secret !== debugSecret)) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHORIZED', ... } },
      { status: 401 }
    )
  }
  return null
}
```

**Usage:**
```typescript
export async function POST(req: NextRequest) {
  const auth = requireAdmin(req)
  if (auth) return auth
  // ... rest of handler
}
```

### Pattern 2: IP Allowlist
```typescript
import { isIpAllowlisted } from '@/lib/utils/rate-limiter'

const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
if (!await isIpAllowlisted(ip)) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}
```

---

## Recommended Fixes

1. **Immediate (Critical):**
   - Add `requireAdmin()` to all unprotected admin routes
   - Ensure `ADMIN_SECRET` or `DEBUG_IP_SECRET` is set in production

2. **High Priority:**
   - Add `requireAdmin()` to dev-only routes as additional protection
   - Review `/api/validate-warning` to confirm if it should be public

3. **Best Practices:**
   - Create a shared `requireAdmin()` utility in `lib/utils/`
   - Document admin route authentication requirements
   - Add automated tests for admin route protection

---

## Environment Variables Required

- `ADMIN_SECRET` - Primary admin authentication secret
- `DEBUG_IP_SECRET` - Alternative secret for debugging
- `RATE_LIMIT_IP_ALLOWLIST` - Comma-separated list of allowed IPs (for IP-based auth)

---

## Testing

After fixes, verify:
1. Unauthenticated requests return 401/403
2. Requests with invalid secret return 401
3. Requests with valid `x-admin-secret` header succeed
4. IP allowlist routes work correctly
