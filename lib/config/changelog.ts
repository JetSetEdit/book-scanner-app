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


