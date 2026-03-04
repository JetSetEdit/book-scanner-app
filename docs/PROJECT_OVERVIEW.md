# Subtext / Book Scanner App — Project Overview

**For someone looking at this repo for the first time.**

---

## Git & branch

- **Repo:** https://github.com/JetSetEdit/book-scanner-app  
- **Current branch (when this was written):** `preview`  
- **Other important branches:** `main` (production), `staging`, `feature/*` (various features)  
- **Default remote:** `origin` → `JetSetEdit/book-scanner-app`  
- **Deployments:** Production → www.subtextscanner.com.au; Preview → preview.subtextscanner.com.au (Vercel)

To see exactly where you are:

```bash
git branch -a
git status
git log -1 --oneline
```

---

## What this app does

**Subtext** is a book-scanning app that helps readers see **content warnings** before they read.

1. **User scans a book** (ISBN or barcode).
2. **App looks up the book** (database first, then Open Library + Google Books).
3. **AI analyzes the book** (description + optional web search) and produces **content warnings** (e.g. violence, sexual content, self-harm) with severity (mild / moderate / severe) and short reasoning.
4. **User sees** title, cover, list of content warnings, and support resources.

So: **scan → metadata → AI content-warning analysis → book page with warnings.**

---

## High-level architecture

| Layer | Where | Notes |
|-------|--------|--------|
| **Frontend** | `app/` (Next.js App Router), `components/` | Scan page, book page, home, settings, etc. |
| **API** | `app/api/` | `POST /api/scan` (main scan), `/api/scan-isbn`, `/api/check-book`, `/api/recent-scans`, etc. |
| **Scan pipeline** | `lib/services/scan-service.ts` | Orchestrates: DB lookup → external metadata → analysis → save. |
| **AI analysis** | `lib/services/multi-model-analysis.ts` | OpenAI + Gemini; taxonomy mapping; verification; web enrichment. |
| **Book metadata** | `lib/book-api.ts` | Open Library + Google Books (with 429 retry, Open Library Search fallback). |
| **Data** | Supabase | `books`, `content_warnings`, `scans`, `ai_audit_logs`, `manual_handling_scans`, etc. |

- **Content warnings** are defined by a **taxonomy** (categories/subcategories). AI never invents categories; it maps to that taxonomy and severity is computed from signals.
- **Rules:** See `.cursorrules` and `.cursor/rules/` (content-warning contract, Supabase safety).

---

## Key flows

1. **Scan flow:** Scan page → `POST /api/scan` (or `/api/scan-isbn`) → `processIsbnScan()` → DB or external metadata → `analyzeBookWithMultiModel()` → save book + warnings + audit log → redirect to book page.
2. **Book page:** Fetches book + content warnings from DB; shows cover, warnings with severity and reasoning, support links.
3. **Feedback:** User can report issues; stored in `manual_handling_scans` with `reason = 'user_feedback'`. See `docs/FEEDBACK_DATA_RETRIEVAL.md` and `npx tsx scripts/view-feedback.ts`.

---

## Where to start reading

- **Scan pipeline:** `lib/services/scan-service.ts` (`processIsbnScan`).
- **AI analysis:** `lib/services/multi-model-analysis.ts` (`analyzeBookWithMultiModel`).
- **Book lookup:** `lib/book-api.ts` (`fetchCandidatesByISBN`, `fetchBookByISBN`).
- **Scan UI:** `app/scan/page.tsx` (calls `/api/scan`).
- **Book page:** `app/book/[isbn]/page.tsx`.
- **Env / config:** `env.example`, `.cursorrules`.

---

## Docs worth knowing

| Doc | Purpose |
|-----|--------|
| `README.md` | Setup, env, deployment, feedback scripts. |
| `docs/SCAN_FLOW_DIAGRAM.md` | Mermaid diagram of the scan pipeline. |
| `docs/SCAN_TROUBLESHOOTING.md` | Why scans fail (e.g. OpenAI 429, Google Books 429). |
| `docs/FEEDBACK_DATA_RETRIEVAL.md` | How to view and query user feedback. |
| `docs/DATA_SOURCING_POLICY.md` | Where book data comes from and TOS. |
| `.cursor/rules/13-content-warning-system.mdc` | Contract for content warnings (evidence-based, taxonomy, severity). |

---

## Tech stack

- **Framework:** Next.js 16 (App Router)
- **DB:** Supabase (PostgreSQL)
- **AI:** OpenAI + Google Gemini (multi-model analysis)
- **Metadata:** Open Library, Google Books
- **Deploy:** Vercel (production + preview)
- **Styling:** Tailwind, shadcn/ui

---

## Quick dev commands

```bash
npm install
npm run dev          # http://localhost:3000
npx tsx scripts/view-feedback.ts   # view user feedback
npx tsx scripts/check-queue.ts     # feedback + queue overview
```

Env: copy `env.example` to `.env.local` and fill in Supabase and API keys (see README).
