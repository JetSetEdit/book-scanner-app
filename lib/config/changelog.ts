export type ChangelogEntry = {
  version: string
  date: string // YYYY-MM-DD
  title?: string
  changes: string[]
}

// Keep this lightweight and human-curated.
// The version bump hook updates APP_VERSION, but does not auto-generate release notes.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.03.20",
    date: "2026-01-15",
    title: "New features",
    changes: [
      "Replace geo-block with country-based waitlist/access gate",
      "Merge Quick Glance/Heads Up panels and refine UI interactions (v1.03.14)",
      "Add Black Joy recommendation engine, annotation extractor, and bulk enrichment scripts (v1.03.13)",
      "Implement RLHF severity tuning, BookTok UI summary, and scanning animation",
      "Access gate fallback for DB errors and beta modal logic"
    ],
  },
  {
    version: "1.03.19",
    date: "2026-01-15",
    title: "New features",
    changes: [
      "Replace geo-block with country-based waitlist/access gate",
      "Merge Quick Glance/Heads Up panels and refine UI interactions (v1.03.14)",
      "Add Black Joy recommendation engine, annotation extractor, and bulk enrichment scripts (v1.03.13)",
      "Implement RLHF severity tuning, BookTok UI summary, and scanning animation",
      "Access gate fallback for DB errors and beta modal logic"
    ],
  },
  {
    version: "1.03.18",
    date: "2026-01-15",
    title: "New features",
    changes: [
      "Replace geo-block with country-based waitlist/access gate",
      "Merge Quick Glance/Heads Up panels and refine UI interactions (v1.03.14)",
      "Add Black Joy recommendation engine, annotation extractor, and bulk enrichment scripts (v1.03.13)",
      "Implement RLHF severity tuning, BookTok UI summary, and scanning animation"
    ],
  },
  {
    version: "1.03.12",
    date: "2026-01-14",
    title: "New feature",
    changes: [
      "Implement RLHF severity tuning, BookTok UI summary, and scanning animation"
    ],
  },
  {
    version: "1.03.10",
    date: "2026-01-12",
    title: "Bug fixes and improvements",
    changes: [
      "Dynamic category selection in scan progress messages based on book content",
      "Fixed cover image loading on homepage using image proxy",
      "Prevent duplicate book entries when scanning different ISBNs of the same book",
      "Fixed duplicate content warnings when rescanning existing books"
    ],
  },
  {
    version: "1.03.9",
    date: "2026-01-09",
    title: "New features",
    changes: [
      "Add glossary definitions for all taxonomy terms",
      "Improve Quick Exit styling and add user preference toggle",
      "Auto-update changelog with pre-commit versioning",
      "V1.03.0 - Quick Exit, state-based support resources, enhanced feedback system",
      "Remove redundant phrases in warning descriptions and add tooltips",
      "Add missing handleQuickExit function to fix critical bug"
    ],
  },
  {
    version: "1.03.8",
    date: "2026-01-09",
    title: "New features",
    changes: [
      "Improve Quick Exit styling and add user preference toggle",
      "Auto-update changelog with pre-commit versioning",
      "V1.03.0 - Quick Exit, state-based support resources, enhanced feedback system",
      "Remove redundant phrases in warning descriptions and add tooltips",
      "Add missing handleQuickExit function to fix critical bug"
    ],
  },
  {
    version: "1.03.7",
    date: "2026-01-09",
    title: "New features",
    changes: [
      "Improve Quick Exit styling and add user preference toggle",
      "Auto-update changelog with pre-commit versioning",
      "V1.03.0 - Quick Exit, state-based support resources, enhanced feedback system",
      "Add missing handleQuickExit function to fix critical bug",
      "Add missing comma in logAuditDecision call"
    ],
  },
  {
    version: "1.03.6",
    date: "2026-01-09",
    title: "New features",
    changes: [
      "Improve Quick Exit styling and add user preference toggle",
      "Auto-update changelog with pre-commit versioning",
      "V1.03.0 - Quick Exit, state-based support resources, enhanced feedback system",
      "Add missing handleQuickExit function to fix critical bug",
      "Add missing comma in logAuditDecision call"
    ],
  },
  {
    version: "1.03.5",
    date: "2026-01-09",
    title: "New features",
    changes: [
      "Improve Quick Exit styling and add user preference toggle",
      "Auto-update changelog with pre-commit versioning",
      "V1.03.0 - Quick Exit, state-based support resources, enhanced feedback system",
      "Add missing handleQuickExit function to fix critical bug",
      "Add missing comma in logAuditDecision call"
    ],
  },
  {
    version: "1.03.4",
    date: "2026-01-09",
    title: "New features",
    changes: [
      "Auto-update changelog with pre-commit versioning",
      "V1.03.0 - Quick Exit, state-based support resources, enhanced feedback system",
      "Implement IP-based model assignment with Gemini quota tracking",
      "Add missing handleQuickExit function to fix critical bug",
      "Add missing comma in logAuditDecision call"
    ],
  },
  {
    version: "1.03.3",
    date: "2026-01-09",
    title: "New features",
    changes: [
      "Auto-update changelog with pre-commit versioning",
      "V1.03.0 - Quick Exit, state-based support resources, enhanced feedback system",
      "Implement IP-based model assignment with Gemini quota tracking",
      "Add missing handleQuickExit function to fix critical bug",
      "Add missing comma in logAuditDecision call"
    ],
  },
  {
    version: "1.03.2",
    date: "2026-01-09",
    title: "New features",
    changes: [
      "Auto-update changelog with pre-commit versioning",
      "V1.03.0 - Quick Exit, state-based support resources, enhanced feedback system",
      "Implement IP-based model assignment with Gemini quota tracking",
      "Add missing comma in logAuditDecision call",
      "Escape quotes in changelog strings to fix build error"
    ],
  },
  {
    version: "1.03.1",
    date: "2026-01-09",
    title: "New features",
    changes: [
      "V1.03.0 - Quick Exit, state-based support resources, enhanced feedback system",
      "Implement IP-based model assignment with Gemini quota tracking",
      "Add missing comma in logAuditDecision call",
      "Escape quotes in changelog strings to fix build error",
      "Make git commands resilient for Vercel builds"
    ],
  },
  {
    version: "1.01.118",
    date: "2026-01-08",
    title: "New feature",
    changes: [
      "Auto-update changelog when significant user-facing changes detected"
    ],
  },
  {
    version: "1.01.114",
    date: "2026-01-08",
    title: "Legal compliance & access control",
    changes: [
      "Updated welcome modal with comprehensive legal disclaimers and terms",
      "Implemented geo-blocking to restrict access to Australia only",
      "Added consent logging for compliance tracking",
    ],
  },
  {
    version: "1.01.86",
    date: "2026-01-08",
    title: "Consistency improvements",
    changes: [
      "Added a \"Based on…\" line on book pages (description length, mode, enrichment, cross-check)",
      "Added a one-click \"Run Deep scan\" CTA on book pages when results may be incomplete",
      "Scan page supports deep/quick preselection via URL",
    ],
  },
  {
    version: "1.01.85",
    date: "2026-01-07",
    title: "Mobile clarity",
    changes: [
      "Made “Why?” and feedback actions fully visible on mobile (no hover required)",
      "Hid scan timing debug details from non-dev users",
    ],
  },
  {
    version: "1.01.84",
    date: "2026-01-07",
    title: "Release notes",
    changes: ["Added a “What’s new” popover under the version badge"],
  },
  {
    version: "1.01.83",
    date: "2026-01-07",
    title: "Scan UX cleanup",
    changes: [
      "Mobile-first camera scanner (auto-open when supported)",
      "Camera troubleshooting moved into a collapsible section",
      "Quick/Deep scan copy and progress messages made more user-friendly",
    ],
  },
  {
    version: "1.01.82",
    date: "2026-01-07",
    title: "Transparency tweaks",
    changes: ["Relabeled reasoning/source button to “Why?” / “Details”"],
  },
  {
    version: "1.01.81",
    date: "2026-01-07",
    title: "Feedback improvements",
    changes: ["Added an explicit Undo control for thumbs feedback"],
  },
  {
    version: "1.01.77",
    date: "2026-01-07",
    title: "Community confidence v1",
    changes: [
      "Anonymous thumbs feedback with per-device persistence",
      "Confidence badge combining cross-check + community signal",
    ],
  },
] as const
