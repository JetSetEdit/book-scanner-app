# Scan Troubleshooting

## Why scanning might not be working

### 1. **OpenAI quota exceeded (429)**

**Symptom:** Scans fail or complete without content warnings. Server logs show:

- `OpenAI analysis error: Error: 429 You exceeded your current quota...`
- `code: 'insufficient_quota'`
- `OpenAI rate limit exceeded - throwing error to prevent false "no warnings" result`

**Cause:** The app uses OpenAI for content-warning analysis (and optionally verification). When your OpenAI account hits its quota or billing limit, every OpenAI call returns 429 and the pipeline can fail or fall back to Gemini-only.

**What we do in code:**

- **Quick scans:** Model is chosen by IP (`shouldAssignGemini`). Some users get Gemini (works), some get OpenAI (fails if over quota).
- **Deep scans:** Both OpenAI and Gemini run. If OpenAI returns 429, we still have Gemini results, but the **verification** step was always using OpenAI when there were no “unique OpenAI” warnings, which caused a second 429 and failed the scan.
- **Fix (in code):** When we have Gemini results, we use Gemini for the verification step so the scan can complete without calling OpenAI again.

**What you can do:**

- **Restore scanning with OpenAI:** Top up billing or increase quota at [OpenAI usage](https://platform.openai.com/usage).
- **Use Gemini-only for your IP:** Ensure your IP is assigned Gemini for quick scans (see rate-limiter / `shouldAssignGemini`), or rely on the new fallback so deep scans complete with Gemini when OpenAI is over quota.

### 2. **Google Books API 429**

**Symptom:** Logs show `[Book API] Google Books API request failed: 429`.

**Cause:** Google Books rate-limits requests. The app falls back to Open Library when this happens, so metadata can still be found.

**Action:** Usually no change needed; fallback is automatic. If you need more metadata volume, consider caching or reducing request rate.

### 3. **Cache refresh 429**

**Symptom:** `[Cache] Failed to refresh <ISBN>: HTTP 429` when refreshing stale book metadata.

**Cause:** Same as above (external API rate limits). Existing book data is still used; refresh is best-effort.

### 4. **Book not found in any external library**

**Symptom:** User sees "Book with ISBN … not found in any external library. Please check the ISBN and try again." (and optionally "Report this ISBN").

**Cause:** Both Open Library and Google Books returned no data for that ISBN. Common reasons: the ISBN is invalid, the edition is not in either catalog, or production cannot reach the APIs (e.g. missing or invalid env).

**Required production env:**

- **`GOOGLE_BOOKS_API_KEY`** – Google Books API key (set in Vercel for Production and optionally Preview). If missing or invalid, only Open Library is used; some books are only in Google Books.
- **Open Library** – No API key; requests are unauthenticated. If both sources return nothing, the book is uncatalogued for that ISBN or there is a network/config issue.

**How to check production logs:**

- **Vercel dashboard:** Project → Logs. Filter by time; search for `[Scan] book_not_found` or the ISBN to see not-found scan events.
- **Vercel CLI:** `vercel env ls` (from project root) to confirm env var names (e.g. `GOOGLE_BOOKS_API_KEY`) are present for Production. Values are not shown for security.
- **Vercel MCP:** Use `get_runtime_logs` with `projectId` and `teamId` from `.vercel/project.json`, `environment: "production"`, and `query: "[Scan] book_not_found"` or the ISBN.

**Quick verification:** Scan a known-good ISBN (e.g. **9780593356159** – "The Maid") to confirm the pipeline and env are working.

---

## Summary

| Issue              | Effect                         | Mitigation in app / your action                    |
|--------------------|--------------------------------|----------------------------------------------------|
| OpenAI 429 quota  | Analysis or verification fails | Use Gemini for verification when OpenAI fails; or fix OpenAI quota |
| Google Books 429  | Metadata may come from Open Library only | Automatic fallback; optional rate/cache tuning |
| Cache refresh 429 | Stale metadata not refreshed   | Non-blocking; book still loads from cache          |
| Book not found     | No metadata from Open Library or Google Books | Check env (`GOOGLE_BOOKS_API_KEY`); search logs for `[Scan] book_not_found` or ISBN; try test ISBN 9780593356159 |
