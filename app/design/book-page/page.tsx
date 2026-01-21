import { notFound } from "next/navigation"
import { PLACEHOLDER_BOOK, PLACEHOLDER_WARNINGS } from "@/lib/fixtures/placeholder-book"
import { DesignBookPageClient } from "@/components/design/DesignBookPageClient"

/**
 * Design-time placeholder book page. Uses fixture data only (no Supabase or scan APIs).
 * In production, returns 404. Not linked from nav or sitemap.
 * See docs/DESIGN_BOOK_PAGE.md.
 */
export default function DesignBookPage() {
  if (process.env.NODE_ENV === "production") {
    notFound()
  }

  return (
    <DesignBookPageClient
      book={PLACEHOLDER_BOOK}
      warnings={[...PLACEHOLDER_WARNINGS]}
    />
  )
}
