/**
 * Monetization config: ad placements and safety rules.
 * Ads are trust-safe: never in scan flow, warning blocks, or support resources.
 * See feedback/subtext_ad_placement_patch.md and OpenSpec add-positioning-and-monetization-strategy.
 *
 * Rollout order: (1) Homepage copy. (2) Results-footer ad. (3) Bookshelf sidebar.
 * (4) Freemium + paywall. (5) Optional post-scan panel, weekly email sponsorship.
 * Feature flags: set adsEnabled true when ready to show ads.
 */

export const monetizationConfig = {
  adsEnabled: false,
  adNetwork: "direct" as const,
  placements: {
    resultsFooter: true,
    bookshelfSidebar: true,
    postScanPanel: false,
    weeklyEmail: false,
  },
  safety: {
    blockInScanFlow: true,
    blockInWarnings: true,
    blockInSupportResources: true,
  },
} as const

export type AdPlacement =
  | "results-footer"
  | "bookshelf-sidebar"
  | "post-scan-panel"
  | "weekly-email"

export interface SponsoredItem {
  id: string
  title: string
  description: string
  ctaLabel: string
  ctaUrl: string
  imageUrl?: string
  advertiserName?: string
}

/** Placeholder sponsored item for results footer (book page). */
export const defaultResultsFooterSponsor: SponsoredItem = {
  id: "sponsor-results-footer-1",
  title: "Family Reading Conversation Guide",
  description: "Free prompts for talking through difficult themes with teens.",
  ctaLabel: "Get Guide",
  ctaUrl: "https://example.com/guide",
  advertiserName: "Example Sponsor",
}

/** Placeholder sponsored item for bookshelf sidebar. */
export const defaultBookshelfSidebarSponsor: SponsoredItem = {
  id: "sponsor-bookshelf-1",
  title: "Book Club Question Packs",
  description: "Monthly discussion prompts for popular titles.",
  ctaLabel: "View Packs",
  ctaUrl: "https://example.com/bookclub",
}
