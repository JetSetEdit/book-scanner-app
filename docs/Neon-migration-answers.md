# Neon migration – answers for your contact

**RLS (Row Level Security)**  
Yes. We use standard Postgres RLS on several tables:

- **Scans, ai_audit_logs, manual_handling_scans, taxonomy_severity_overrides, rlhf_comparisons, author_context, consent_logs:** policies are “allow public read” and/or “allow insert” or “service role only” (no `auth.uid()`).
- **vip_codes, referral_links, referral_events, user_bonus_scans:** service-role-only policies.
- **Sparks (user_sparks, user_badges, sparks_history, user_pivots):** use `auth.uid()` and reference `auth.users` (Supabase Auth). We’re not using Supabase Auth for end users today (VIP is cookie-based), so these tables may be unused or for a future feature.

**What to do for Neon:**  
Neon supports Postgres RLS. Recreate the same policies in Neon. For policies that reference `auth.uid()` (Sparks), either leave them as-is if you later plug in an auth provider that sets a similar role/uid, or drop/rewrite them if those tables aren’t used.

---

**Book covers / storage**  
Covers are **not** in Supabase Storage. We store a **URL** in `books.cover_url` (Open Library, Google Books, etc.) and the frontend loads images via our proxy route `/api/book-cover?url=...`. So there’s no Supabase Storage dependency for covers; the Neon migration is clean from a “file storage” perspective.

---

**Gemini-only test script**  
A script is in place to compare Gemini-only vs current combined (OpenAI+Gemini) results:

- **Script:** `scripts/gemini-only-vs-combined-test.ts`
- **Usage:** `npx tsx scripts/gemini-only-vs-combined-test.ts [limit]` (default 25 books, max 30).
- **What it does:** Loads books from the DB that already have content_warnings (baseline). For each, runs `analyzeBookWithMultiModel` with `enableOpenAI: false`, `enableGemini: true`. Diffs Gemini-only output vs baseline and flags **missed** warnings (in baseline but not in Gemini-only) and **downgraded** severity (baseline stricter than Gemini-only). Prints a summary and lists “meaningfully worse” cases.
- **Requires:** `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY` (OpenAI not required for this run).

You can run it and share the summary + “meaningfully worse” list to decide if Gemini-only is acceptable.
