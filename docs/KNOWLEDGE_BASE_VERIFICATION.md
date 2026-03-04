# Knowledge Base vs Codebase Verification

This document confirms which claims in the knowledge base (FAQ, press kit, transparency, privacy) are accurate against the codebase. Last checked: 2026-03.

---

## FAQ

| Claim | Verdict | Notes |
|-------|---------|--------|
| AI sees only public book info (titles, authors, descriptions, subject tags); not identity, reading history, or device | **TRUE** | `multi-model-analysis` receives `metadata.title`, `metadata.author`, `metadata.description`, `metadata.isbn` + optional web enrichment. No user id or device data passed. |
| We do not use your data to train AI models | **TRUE** | Only inference API calls (OpenAI, Gemini). No training/fine-tuning with user data. |
| Warnings depend on evidence per book, not genre or author reputation | **MOSTLY TRUE** | General path is evidence-based. **Exception:** (1) Canon whitelist (`lib/utils/canon-books.ts`) allows inference from “literary consensus” for a narrow set of themes (Suicide, Racism, Police Misconduct) on listed classics. (2) Prompt allows “genre indicators and book reputation” for a few named romance/fantasy titles (e.g. Verity, Fourth Wing, ACOTAR). |
| Warnings generated from current public info + latest classification; may re-run over time | **TRUE** | We store `model_version` and `taxonomy_version`. Re-run happens on new scan or explicit force refresh (not automatic on version bump). |
| Warnings are best-effort predictions, not author/publisher facts; use your own judgment | **TRUE** | No claim of author/publisher labels; decision-support framing in UI/copy. |
| Every warning includes reasoning | **TRUE** | `reasoning` stored on `content_warnings`; shown in UI. |
| Fixed taxonomy; system cannot invent categories | **TRUE** | `lib/config/taxonomy-v2.ts`; validation rejects invalid `category_id`/`subcategory_id`. |
| Severity from multiple signals, not single model opinion | **TRUE** | `lib/utils/severity-computation.ts`: `computeSeverityFromSignals` uses frequency, explicitness, proximity, centrality, intensity_markers. Multi-model analysis combines results (MAX severity for same category). |
| No inference from author reputation or genre (general) | **MOSTLY TRUE** | Prompts forbid genre/author assumptions in general; canon + named-title exceptions above. |
| Wrong or missing warning → use Feedback; we don’t alter the book | **TRUE** | FeedbackDialog; `manual_handling_scans` with `reason: 'user_feedback'`. We only surface info; we don’t remove or alter books. |
| Censorship? No – we don’t remove or block books | **TRUE** | No product code that blocks or removes books from access. Delete scripts are admin/maintenance only. |
| We describe types of content, not plot; avoid spoilers | **TRUE** | Prompts require categorical language, no character names/plot events; `is_spoiler` and spoiler detection in prompts. |
| Who decides age-appropriateness? You. We provide ACB-aligned ratings as information | **TRUE** | No gate that blocks by age. `lib/utils/age-rating.ts`: G, PG, M, MA15+, R18+, RC; ACB methodology. |
| Taxonomy covers many themes; different readers care about different things | **TRUE** | Taxonomy has many categories/subcategories (violence, abuse, discrimination, mental health, sexual content, phobias, etc.). |
| Do you store what I scan or build a profile? No | **TRUE** | `scans` table has only `id`, `isbn`, `book_id`, `created_at` – no `user_id`. No per-user reading history or profile. |
| Book information from public sources (Google Books, Open Library) + web search when thin | **TRUE** | `lib/book-api.ts`: Open Library + Google Books; scan-service triggers web search when description minimal. We don’t use full book text. |
| Source citations on warnings being improved | **TRUE** | `source_url` exists in schema and prompts (optional); not always populated; roadmap mentions source citations. |

---

## Press Kit (boilerplate + key facts)

| Claim | Verdict | Notes |
|-------|---------|--------|
| Book-scanning app; content warnings and age guidance; scan ISBN/barcode; no account required | **TRUE** | Scan flow; rate limit by IP/cookie (VIP), no account required for basic use. |
| Analyses publicly available book text and metadata | **IMPRECISE** | We use **descriptions and metadata**, not the full book text. Prefer “book descriptions and metadata” (see Transparency fix below). |
| Evidence-based; tied to specific book; no inference from author or genre; fixed taxonomy; severity from signals | **TRUE** (with same canon/named-title exceptions as FAQ) | As above. |
| Every warning includes detailed reasoning | **TRUE** | Stored and displayed. |
| Subtext does not store personal reading histories or profiles | **TRUE** | Scans table is anonymous (no user_id). |
| Multiple verification layers; severity subjective; tool for information, not substitute for judgment | **TRUE** | Multi-model, verification pass, adversarial; subjective severity and disclaimer in UI. |
| Evidence-based only; taxonomy-based; severity from signals; multi-source metadata; no reading history; ACB-aligned; informational not judgmental | **TRUE** | All confirmed as above. |

---

## Transparency page (“How Subtext Works”)

| Claim | Verdict | Notes |
|-------|---------|--------|
| Subtext analyses publicly available **book text** and metadata | **IMPRECISE** | We analyze **descriptions** and metadata, not the full book text. Recommend: “book descriptions and metadata”. |
| Identifies common sensitive themes (violence, abuse, discrimination) | **TRUE** | Taxonomy and analysis cover these. |
| Automated language analysis; severity and age guidance | **TRUE** | AI analysis; severity from signals; age rating from `age-rating.ts`. |
| Does not store personal reading histories or profiles | **TRUE** | As above. |
| Phase 1: Content warnings with severity and reasoning; ACB-based age ratings; thematic analysis; multi-source metadata (Google Books, Open Library, web when limited) | **TRUE** | Implemented as described. |

---

## Privacy Policy

| Claim | Verdict | Notes |
|-------|---------|--------|
| We may collect ISBNs or barcodes you scan or enter | **ACCURATE** | Scans table stores isbn (+ book_id); no user_id. So “we may collect” is true; we don’t tie them to a user identity. |
| Device info, usage data, IP, cookies | **ACCURATE** | Standard; IP used for rate limiting. |
| Rate limiting: IP stored in memory, reset daily | **TRUE** | `lib/utils/rate-limiter.ts`: in-memory `Map`, no DB; reset by daily window. |
| Local storage for preferences / recently scanned | **ACCURATE** | Client-side; privacy policy describes it. |
| We don’t sell personal information | **ACCURATE** | No sell path in code. |

---

## Summary of recommended changes

1. **Transparency + Press (and any duplicate copy):** Change “publicly available book text” to “publicly available book descriptions and metadata” so it matches what we actually analyze (no full book text).
2. **FAQ / Press (optional):** Add one short caveat that for a small set of well-known classics and a few named titles we may use established literary or genre context when descriptions are vague, so “we never infer from author or genre” is not absolute.

---

## Files used for verification

- `lib/services/scan-service.ts` – scan flow, what’s stored, no user_id on scans
- `lib/services/multi-model-analysis.ts` – inputs (metadata), prompts, canon/reputation exceptions
- `lib/utils/canon-books.ts` – canonical book whitelist
- `lib/utils/severity-computation.ts` – severity from signals (frequency, explicitness, proximity, centrality, intensity)
- `lib/utils/age-rating.ts` – ACB-style ratings (G, PG, M, MA15+, R18+, RC)
- `lib/config/taxonomy-v2.ts` – fixed taxonomy, validation
- `types/supabase.ts` – `scans` (no user_id), `content_warnings` (user_id for community submissions only)
- `lib/utils/rate-limiter.ts` – in-memory rate limit by IP
