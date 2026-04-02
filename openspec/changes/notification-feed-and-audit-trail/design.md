# Design: Notification feed and audit trail (roadmap)

## Context

Institutional users (e.g. librarians) need to know when a book's content-warning record has changed, so that recommendations are not silently updated. The one-pager ([/policy](/policy)) commits to: "We do not change recommendations without transparency. A notification feed and audit trail are in development."

This design describes the target shape for those features. **No implementation in this change** — roadmap only.

## Goals / Non-Goals

- **Goals:** (1) Define the data model and API shape for "record changed" events. (2) Define a minimal notification feed (e.g. "X books had updates in the last 7 days") and per-book audit trail (last updated, change type). (3) Provide a target date placeholder for the one-pager and committee submissions.
- **Non-Goals:** Implementing the feed or audit trail in this change; user identity / saved books (can be anonymous "recently viewed" or future "collection" when that exists).

## Decisions

### Record change events

- **Table:** `record_change_events` (or equivalent):
  - `id` UUID PK
  - `book_id` UUID FK to books
  - `change_type` TEXT: `edition_update` | `author_note` | `ai_refresh` | `appeal_resolution` | `metadata_update`
  - `changed_at` TIMESTAMPTZ
  - `payload` JSONB optional (e.g. appeal_id, previous_warning_count)
- **Emit events when:** (1) Warnings for a book are updated or re-generated (AI or manual). (2) Author/publisher content notes are attached. (3) Book metadata (edition, description) is updated. (4) An appeal is resolved (warning removed or restored).
- **Consumers:** Feed API (list of books with changes in a time window); per-book "History" or "Last updated" (audit trail).

### Notification feed

- **Scope:** "Which books changed?" in a time window. Without a "collection" or "saved books" concept, feed can be: (a) global "recently updated books" (e.g. last 7 days), or (b) future: "books in your collection/saved list that changed."
- **API:** e.g. `GET /api/notifications?since=7d` or `GET /api/books/recent-updates?days=7` returning list of book_id, title, change_type, changed_at.
- **UI:** Optional dashboard or "Updates" section: "X books had updates in the last 7 days" with link to list. Optional email digest later.

### Audit trail (per book)

- **Source:** Derive from `record_change_events` for the book, or from existing `ai_audit_logs` + `books.updated_at` + author_content_warnings until the events table exists.
- **API:** e.g. `GET /api/book/[isbn]/history` or include `last_updated` and `last_change_type` in book payload.
- **UI:** On book page: "Last updated: &lt;date&gt;; change type: edition / author note / AI refresh." Or a dedicated /book/[isbn]/history section.

### Target availability

- Publish a target date on the one-pager (e.g. "Target: Q3 2026") when the implementation is scheduled. Until then, the one-pager states that the feed and audit trail are in development and change information is available on request.

## Migration Plan

- Not applicable (design only). When implementing: add `record_change_events` migration; add triggers or application-level writes when warnings/books/author notes change; add feed and history APIs; add UI.

## Open Questions

- Whether to support "saved books" or "collection" before building the feed (so the feed is "updates to books you care about").
- Exact target date for availability (to be set when the work is scheduled).
