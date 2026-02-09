# Subtext: Trust-Safe Ad Placement + Freemium Guardrails (Cursor-ready patch)

This patch adds **non-intrusive ad slots** and a **freemium gate** without interrupting scan trust flow.

## Goals

- Never show ads during active scan/loading.
- Never place ads inside warning severity or support resource sections.
- Show ads only in low-friction surfaces.
- Keep ad rendering optional via feature flag.

---

## 1) Feature flags + ad model

```ts
// src/config/monetization.ts
export const monetizationConfig = {
  adsEnabled: true,
  adNetwork: 'direct', // 'direct' | 'adsense' | 'none'
  placements: {
    resultsFooter: true,
    bookshelfSidebar: true,
    postScanPanel: true,
    weeklyEmail: true,
  },
  safety: {
    blockInScanFlow: true,
    blockInWarnings: true,
    blockInSupportResources: true,
  },
};

export type AdPlacement =
  | 'results-footer'
  | 'bookshelf-sidebar'
  | 'post-scan-panel'
  | 'weekly-email';

export interface SponsoredItem {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl?: string;
  advertiserName?: string;
}
```

---

## 2) Reusable sponsored card component

```tsx
// src/components/SponsoredCard.tsx
import React from 'react';
import type { SponsoredItem } from '@/config/monetization';

type Props = {
  item: SponsoredItem;
  compact?: boolean;
};

export default function SponsoredCard({ item, compact = false }: Props) {
  return (
    <aside
      className="rounded-xl border border-slate-700 bg-slate-900/60 p-4"
      aria-label="Sponsored"
      data-testid="sponsored-card"
    >
      <div className="mb-2 text-[11px] uppercase tracking-wider text-slate-400">
        Sponsored
      </div>

      <div className={compact ? 'space-y-1' : 'space-y-2'}>
        <h3 className="text-sm font-semibold text-slate-100">{item.title}</h3>
        <p className="text-xs text-slate-300">{item.description}</p>
        <a
          href={item.ctaUrl}
          target="_blank"
          rel="noreferrer noopener sponsored"
          className="inline-flex rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
        >
          {item.ctaLabel}
        </a>
      </div>
    </aside>
  );
}
```

---

## 3) Placement: Results page footer (recommended primary)

```tsx
// src/pages/book/[isbn].tsx (or your result view)
import SponsoredCard from '@/components/SponsoredCard';
import { monetizationConfig } from '@/config/monetization';

const sponsoredItem = {
  id: 'sponsor-parents-guide-1',
  title: 'Family Reading Conversation Guide',
  description: 'Free prompts for talking through difficult themes with teens.',
  ctaLabel: 'Get Guide',
  ctaUrl: 'https://example.com/guide',
  advertiserName: 'Example Sponsor',
};

// ...after full analysis + support resources
{monetizationConfig.adsEnabled && monetizationConfig.placements.resultsFooter && (
  <div className="mt-8">
    <SponsoredCard item={sponsoredItem} />
  </div>
)}
```

> Keep this **below** analysis and support resources.

---

## 4) Placement: Bookshelf/history sidebar

```tsx
// src/pages/collection.tsx
import SponsoredCard from '@/components/SponsoredCard';
import { monetizationConfig } from '@/config/monetization';

{monetizationConfig.adsEnabled && monetizationConfig.placements.bookshelfSidebar && (
  <div className="lg:sticky lg:top-4">
    <SponsoredCard
      compact
      item={{
        id: 'sponsor-bookclub-1',
        title: 'Book Club Question Packs',
        description: 'Monthly discussion prompts for popular titles.',
        ctaLabel: 'View Packs',
        ctaUrl: 'https://example.com/bookclub',
      }}
    />
  </div>
)}
```

---

## 5) Placement: Post-scan panel (after results render)

```tsx
// in scan complete state, AFTER output is visible
{scanCompleted && monetizationConfig.adsEnabled && monetizationConfig.placements.postScanPanel && (
  <div className="mt-4">
    <SponsoredCard
      compact
      item={{
        id: 'sponsor-teacher-1',
        title: 'Teacher Resource Bundle',
        description: 'Printable discussion starters by age band.',
        ctaLabel: 'Download',
        ctaUrl: 'https://example.com/teachers',
      }}
    />
  </div>
)}
```

---

## 6) Freemium limiter (free triage, paid depth)

```ts
// src/lib/entitlements.ts
export type Plan = 'free' | 'plus' | 'credits';

export function getDailyLimits(plan: Plan) {
  if (plan === 'free') return { quickScans: 3, deepScans: 0 };
  if (plan === 'plus') return { quickScans: 50, deepScans: 10 };
  return { quickScans: 0, deepScans: 0 }; // credits handled separately
}

export function canRunScan({ plan, scanType, usedQuick, usedDeep }: {
  plan: Plan;
  scanType: 'quick' | 'deep';
  usedQuick: number;
  usedDeep: number;
}) {
  const limits = getDailyLimits(plan);
  if (scanType === 'quick') return usedQuick < limits.quickScans;
  return usedDeep < limits.deepScans;
}
```

```tsx
// scan page CTA behavior
if (!canRunScan(...)) {
  openPaywallModal({
    title: 'Free tier complete',
    subtitle: 'You used your free scans. Upgrade for deep analysis and exports.',
  });
  return;
}
```

---

## 7) Weekly email sponsorship block

```html
<!-- email template footer snippet -->
<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
<p style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;">Sponsored</p>
<p style="margin:6px 0 0;font-size:14px;color:#111827;">
  Need better classroom discussion prompts? <a href="https://example.com" target="_blank" rel="sponsored">Try Example Resource</a>
</p>
```

---

## 8) UX copy recommendations

- Label ads clearly as **Sponsored**.
- Keep one slot max per surface.
- Avoid animation/audio.
- Never tie ad presence to warning severity.

Suggested trust copy:

> “Sponsored content never affects warning outcomes or age recommendations.”

---

## 9) Analytics events

```ts
// Track without polluting core scan metrics
track('sponsor_impression', { placement: 'results-footer', sponsorId: item.id });
track('sponsor_click', { placement: 'results-footer', sponsorId: item.id });
track('paywall_opened', { reason: 'daily_limit_reached', scanType: 'quick' });
```

---

## 10) Recommended rollout order

1. Results footer card (lowest risk)
2. Bookshelf sidebar
3. Freemium limits + paywall copy
4. Weekly email sponsorship
5. Optional post-scan card

---

If needed, I can provide this as framework-specific files for **Next.js App Router** (`app/book/[isbn]/page.tsx`, `app/collection/page.tsx`, server actions, and Prisma tables for scan quotas/sponsor campaigns).
