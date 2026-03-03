# Changelog: Removed, Unfinished & Deprecated

Single reference for what’s been removed, what’s unfinished, and what’s deprecated.  
**In-app release notes** live in `lib/config/changelog.ts` (user-facing “What’s new”).

---

## Removed

### Database & schema
- **`books.classification_rating`** – Removed (unused). Restore: `scripts/restore-removed-columns.sql`. See `CLEANUP_SUMMARY.md`, `FINAL_CLEANUP_SUMMARY.md`.

### Code & services
- **`lib/book-service.ts`** – Removed (unused). Backup: `book-service.ts.backup` if present.
- **RLHF system** – Removed (backed up). Related unused endpoints removed. See `HANDOVER_DOCUMENTATION.md` § Recent Changes.
- **OpenAI Agents SDK–based agents** (removed Dec 31, 2025), replaced by direct API calls in `lib/services/multi-model-analysis.ts`:
  - `lib/content-warning-agent.ts`
  - `lib/book-finder-agent.ts`
  - `lib/services/severity-classification-agent.ts`
  - `lib/services/content-review-agent.ts`
  - `lib/services/multi-model-service.ts`
  - `lib/agent-chain.ts` (experimental, never fully integrated)
  - API routes: `/api/scan-multi-model`, `scan-with-agent`, `scan-isbn-agent-chain`, `test-agent-chain`, `test-ai-agent`
- **Voice Agent** (`lib/services/voice-agent.ts`) – Removed Dec 14, 2025 (ElevenLabs TTS; lived 4 days).
- **Old taxonomy** – `lib/config/taxonomy.ts` (legacy v1); current: `lib/config/taxonomy-v2.ts` and taxonomy-context.

### Archived (moved, not deleted)
- 50+ files archived to `docs/archive/` (markdown, data-scripts, utility-scripts, test-scripts, old-migrations, old-scripts). See `FINAL_CLEANUP_SUMMARY.md`.
- Agent code backups in `backups/agents/` (see `docs/archive/additional-docs/CLEANUP_ANALYSIS.md`).

---

## Unfinished / Coming Soon / TODO

### Product & features
- **Community features** – Homepage and transparency page show “Coming Soon” for community-style features (e.g. community verification, feedback). Handover: implement “Community” features currently marked Coming Soon. See `handover-2026-03-03.md`.
- **Privacy page** – “Community feedback on content warnings (coming soon)”.
- **Sponsored / monetization** – Placeholder ad UI exists but is off during public beta; “Support Subtext” (e.g. Ko-fi) to be added. See `openspec/changes/document-sponsored-content-policy-and-support-subtext/`.

### Technical / internal
- **Open Library excerpts vs descriptions** – Known issue: Open Library can return excerpts (quotes) instead of descriptions; prefer Google Books / fallbacks. See `HANDOVER_DOCUMENTATION.md` § Known Issues, `lib/book-api.ts`.
- **Verification POC** – Unique-warning verification is POC; possible expansion to `other_*` subcategories. See `HANDOVER_DOCUMENTATION.md` § AI Analysis.
- **RLHF logging** – TODO in code: migrate from console to database table (see `PRE_LAUNCH_AUDIT.md`).
- **Open Library attribution** – TODO: add attribution component (Google Books attribution already shown). See `docs/EXTERNAL_DATA_COMPLIANCE.md`.
- **Debug endpoint** – `/api/debug/env-check` and similar: should be removed or protected in production (see `PRE_LAUNCH_AUDIT.md`, `docs/archive/SITE_AUDIT.md`).
- **Console logging** – Pre-launch audit: gate or remove client-side `console.log` where appropriate.

---

## Deprecated / Replaced

### APIs & models
- **`gemini-pro`** – Deprecated; use `gemini-1.5-flash` (or current Gemini model). See `lib/services/multi-model-analysis.ts`, `docs/IMPLEMENTATION_REVIEW.md`, `docs/GEMINI_FIX.md`.
- **Geo-block** – Replaced by country-based waitlist/access gate and `/welcome` (AU direct; international via quota + cookie). See `middleware.ts`, `app/actions/access-control.ts`.

### URLs / environments
- **Canonical production** – **https://www.subtextscanner.com.au** (use this for testers and real users).
- **Legacy/avoid for normal use** – `subtext-books.vercel.app`, `book-scanner-app-eta.vercel.app`, and other `*.vercel.app` URLs. See `docs/WHICH_SITE.md`.

### Docs & references
- **Old agent files** – Do not use; see “Removed” above and `docs/archive/additional-docs/OPENAI_INTEGRATION_GUIDE.md` § “What NOT to Use”.
- **Deprecated middleware convention** – Noted in `docs/archive/SITE_AUDIT.md`, `docs/archive/CLEANUP_PLAN.md`.

---

## Quick refs

| I want to…                     | See |
|--------------------------------|-----|
| User-facing release notes      | `lib/config/changelog.ts` |
| What was cleaned (DB + files)  | `FINAL_CLEANUP_SUMMARY.md`, `CLEANUP_SUMMARY.md` |
| Agent history & behavior diff  | `docs/AGENT_BEHAVIOR_CHANGES.md` |
| Which URL to use               | `docs/WHICH_SITE.md` |
| Known issues & next steps      | `HANDOVER_DOCUMENTATION.md` § Known Issues, § Future Work |

*Last updated: March 2026*
