# Change: Enhance book stub pages for SEO and discoverability

## Why

Currently, when a book hasn't been scanned yet, `/book/[isbn]` shows a minimal "This book isn't in Subtext yet" message. This is a missed SEO opportunity. Google can index these pages even without Subtext data, allowing the app to appear in search results for queries like "Book A content warnings" before the book is ever scanned.

This follows the established pattern of **programmatic SEO** and **future-complete pages** used by platforms like Goodreads, StoryGraph, and DoesTheDogDie. By enhancing stub pages with real book metadata from external sources (Open Library, Google Books), we create valuable, indexable landing pages that:

1. **Improve discoverability** - Users searching for content warnings can find Subtext even for unscanned books
2. **Convert SEO traffic** - Stub pages explain the value proposition and encourage scanning
3. **Build organic growth** - As books get scanned, pages naturally evolve from stubs to full content without URL changes
4. **Maintain legal safety** - Using factual metadata (title, author, ISBN) is safe; we're not reproducing copyrighted content

## What Changes

- **Enhanced stub page** - When a book doesn't exist in Subtext, fetch metadata from Open Library/Google Books and display a rich landing page with:
  - Book title, author, cover image
  - Description (if available)
  - Clear CTA: "Scan this book to unlock content warnings"
  - Explanation: "Why isn't this scanned yet?" section
  - FAQ-style content about the scanning process
- **SEO optimization** - Add proper metadata, structured data (JSON-LD Book schema), and semantic HTML
- **Metadata fetching** - Reuse existing `fetchBookByISBN` from `lib/book-api.ts` to get external metadata
- **Quality gates** - Only index pages with minimum metadata (title + author); use `noindex` for thin content
- **Invalid ISBN handling** - Return 404 or `noindex` for clearly invalid ISBNs (wrong length, checksum failure)
- **Page metadata** - Dynamic `<title>` and `<meta description>` based on book metadata (stub pages use "Scan for Content Warnings" to avoid over-promising)
- **Sitemap integration** - Optionally include popular/trending ISBNs in sitemap (future enhancement)
- **Traffic tracking** - Future enhancement: track stub page visits to prioritize which books to scan next (SEO visits → prioritize scanning → better content → better SEO)

## Impact

- Affected specs: `book-page` (new capability or modification)
- Affected code:
  - `app/book/[isbn]/page.tsx` - Enhanced stub page logic
  - `app/book/[isbn]/page.tsx` - Metadata generation (title, description)
  - New component: `components/book-stub-page.tsx` (optional, or enhance existing flow)
  - Structured data: JSON-LD script tag
  - Sitemap: `app/sitemap.ts` (optional enhancement for popular books)
