---

description: Core project context for Subtext. Defines purpose, domain constraints, architecture invariants, and non-negotiable assumptions for AI reasoning.
alwaysApply: true
-----------------

# Project Context: Subtext

## Purpose

Subtext is a web app at **subtextscanner.com.au** that scans books via ISBN, title, or barcode to generate **AI-powered content warnings, summaries, and safety ratings** for readers, educators, and BookTok users.

Its primary goal is to provide structured, advisory “nutritional labels” for books, helping users:

* avoid unwanted or triggering content
* discover safe or preferred reads
* make fast, informed decisions without spoilers

All outputs are **advisory**, not legal, medical, or moral judgments.

---

## Tech Stack

* **TypeScript** – core language with strict typing for taxonomy and severity scoring
* **React** – client-side UI for scanning flows and results display
* **Node.js** – backend API routes, scan processing, and RLHF pipelines
* **Vercel** – hosting, previews, and deployment
* **Vitest** – unit testing for severity scoring and taxonomy normalization

---

## Project Conventions

### Code Style

* Functional, declarative TypeScript
* Explicit types for taxonomy objects and severity computation
* Consistent camelCase naming
* Prettier / ESLint formatting (2-space indentation, semicolons)
* Avoid raw JSON dumps in UI; use typed view models

### Architecture Patterns

* Single source of truth for content categories and severity: `lib/config/taxonomy-v2.ts`
* AI outputs are normalized and remapped to canonical taxonomy IDs
* Severity is computed post-analysis, not taken directly from model labels
* RLHF logging is server-side and anonymized
* Client-side code renders validated, persisted results only

### Testing Strategy

* Vitest unit tests for severity scoring and taxonomy normalization
* Explicit score comparisons (e.g. homophobia > grief)
* End-to-end validation of scan APIs using `forceRefresh=true`
* Real-book verification before deployment

### Git Workflow

* Feature branches off `main` (e.g. `feat/rlhf-scoring`)
* Conventional commits
* Pull requests require passing tests and taxonomy sync
* Merges via Vercel preview deployments

---

## Domain Context

* Content warnings are generated for a **specific book**, identified by ISBN or verified metadata
* Warnings must be **evidence-based** and spoiler-free
* Genre, BookTok tropes, or author history must **not** substitute for evidence
* Severity is formula-driven with safety floors and overrides
* The system prioritizes reducing false negatives without inflating false positives

---

## Important Constraints

* Sole-trader operation: prioritize clarity, safety, and maintainability
* No API keys or secrets may ever be exposed client-side
* RLHF logs must be anonymized
* Copyrighted book excerpts must not be stored or displayed
* Mobile scanning performance is a first-class concern
* Australian data protection and privacy expectations apply

---

## External Dependencies

* **OpenAI APIs** for book analysis, tagging, and content warning generation
* **Vercel** for hosting, previews, and deployment
* **Google Workspace** for business email and domain management
* Community platforms (Reddit, Facebook groups) for beta recruitment
