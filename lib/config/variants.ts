/**
 * Build-time variant config: "swappable body panels" for Public, Libraries, Schools, Lite.
 * Set NEXT_PUBLIC_VARIANT=public|libraries|schools|lite per Vercel project/domain.
 * UI consumes config only; no if (variant === 'x') in components.
 */

export type VariantId = 'public' | 'libraries' | 'schools' | 'lite'

export interface VariantConfig {
  id: VariantId
  name: string
  tagline: string
  meta: {
    title: string
    description: string
  }
  homepage: {
    headline: string
    headlineItalic: string
    subhead: string
    ctaPrimary: string
    ctaSecondary: string
  }
  features: {
    contentWarnings: { title: string; description: string }
    ageRatings: { title: string; description: string }
    community: { title: string; description: string }
  }
  footer: {
    trustStatement: string
    betaDisclaimer: string
    comfortReadPrefix: string
    /** Optional; when set, beta onboarding modal uses this instead of default copy (for lite). */
    betaModalSummary?: string
  }
  /** Wording for analysis source—avoids "AI" in institutional variants. */
  wording: {
    analysisSource: string
    analysisSourceTitleCase: string
    warningLabel: string
    /** e.g. "The AI's" or "The system's" for "X detailed reasoning" */
    reasoningSubject: string
  }
  /** Feature flags. Lite uses show*: false to hide blocks. */
  flags?: {
    teacherMode?: boolean
    exportPdf?: boolean
    bulkScan?: boolean
    showHowWeGenerate?: boolean
    showTransparencyLink?: boolean
    showFeaturesGrid?: boolean
    showBookTokSummary?: boolean
    showReasoningInWarnings?: boolean
    showAffiliate?: boolean
  }
}

const VARIANTS: Record<VariantId, VariantConfig> = {
  public: {
    id: 'public',
    name: 'Subtext',
    tagline: 'The hidden context of every story.',
    meta: {
      title: 'Subtext',
      description: 'Reveal the hidden content in every book.',
    },
    homepage: {
      headline: 'The hidden context',
      headlineItalic: 'of every story.',
      subhead:
        'Subtext analyzes books to reveal content warnings, age ratings, and thematic depth—so you can read with confidence. Scan a barcode or enter an ISBN to get started.',
      ctaPrimary: 'Start Scanning',
      ctaSecondary: 'Browse Bookshelf',
    },
    features: {
      contentWarnings: {
        title: 'Content Warnings',
        description:
          'Detailed, automated alerts for sensitive topics with severity ratings and detailed reasoning. Know what to expect before you read.',
      },
      ageRatings: {
        title: 'Age Ratings & Analysis',
        description:
          'Australian Classification Board-based age ratings plus deep thematic analysis. Understand the themes, tone, and emotional weight of every book.',
      },
      community: {
        title: 'Community Verified',
        description:
          'Help us improve accuracy by rating warnings and sharing your reading experiences. Author notes and community feedback coming soon.',
      },
    },
    footer: {
      trustStatement:
        'Subtext provides transparent content analysis: every automated warning includes detailed reasoning so you can understand how it was determined. Source citations and author notes coming soon. While no system is perfect, we\'ve built multiple verification layers and clear reasoning trails to ensure accuracy. Severity ratings are subjective—they vary by individual sensitivity and the nature of the content. Subtext is a tool for information, not a substitute for your own judgment.',
      betaDisclaimer: 'Automated analysis is actively being improved. Results may vary.',
      comfortReadPrefix: 'Verified by automated analysis (Beta)',
    },
    wording: {
      analysisSource: 'automated',
      analysisSourceTitleCase: 'Automated',
      warningLabel: 'automated',
      reasoningSubject: "The system's",
    },
  },
  libraries: {
    id: 'libraries',
    name: 'Subtext',
    tagline: 'Context-aware reading for your collection.',
    meta: {
      title: 'Subtext for Libraries',
      description: 'Privacy-first content analysis for library collections. Help patrons choose books with confidence.',
    },
    homepage: {
      headline: 'Support informed choices.',
      headlineItalic: 'Privacy-first, evidence-based.',
      subhead:
        'Subtext analyzes books to reveal content warnings and age ratings—so your patrons can choose with confidence. Scan a barcode or enter an ISBN. No account required.',
      ctaPrimary: 'Start Scanning',
      ctaSecondary: 'Browse Bookshelf',
    },
    features: {
      contentWarnings: {
        title: 'Content Warnings',
        description:
          'Detailed, automated alerts for sensitive topics with severity ratings and reasoning. Know what to expect before you read.',
      },
      ageRatings: {
        title: 'Age Ratings & Analysis',
        description:
          'Australian Classification Board-based age ratings plus deep thematic analysis. Understand the themes, tone, and emotional weight of every book.',
      },
      community: {
        title: 'Community Verified',
        description:
          'Help us improve accuracy by rating warnings and sharing your reading experiences. Author notes and community feedback coming soon.',
      },
    },
    footer: {
      trustStatement:
        'Subtext provides transparent content analysis: every automated warning includes detailed reasoning so you can understand how it was determined. Source citations and author notes coming soon. We use multiple verification layers and clear reasoning trails. Severity ratings are subjective—they vary by individual sensitivity. Subtext is a tool for information, not a substitute for professional judgment.',
      betaDisclaimer: 'Automated analysis is actively being improved. Results may vary.',
      comfortReadPrefix: 'Verified by automated analysis (Beta)',
    },
    wording: {
      analysisSource: 'automated',
      analysisSourceTitleCase: 'Automated',
      warningLabel: 'Automated',
      reasoningSubject: "The system's",
    },
  },
  schools: {
    id: 'schools',
    name: 'Subtext',
    tagline: 'Curriculum-aware content guidance.',
    meta: {
      title: 'Subtext for Schools',
      description: 'Privacy-first content analysis for school libraries. Support teachers and students with evidence-based guidance.',
    },
    homepage: {
      headline: 'Support readers with confidence.',
      headlineItalic: 'Privacy-first, evidence-based.',
      subhead:
        'Subtext analyzes books to reveal content warnings and age ratings—so teachers and students can choose with confidence. Scan a barcode or enter an ISBN. No account required.',
      ctaPrimary: 'Start Scanning',
      ctaSecondary: 'Browse Bookshelf',
    },
    features: {
      contentWarnings: {
        title: 'Content Warnings',
        description:
          'Detailed, automated alerts for sensitive topics with severity ratings and reasoning. Know what to expect before you read.',
      },
      ageRatings: {
        title: 'Age Ratings & Analysis',
        description:
          'Australian Classification Board-based age ratings plus deep thematic analysis. Understand the themes, tone, and emotional weight of every book.',
      },
      community: {
        title: 'Community Verified',
        description:
          'Help us improve accuracy by rating warnings and sharing your reading experiences. Author notes and community feedback coming soon.',
      },
    },
    footer: {
      trustStatement:
        'Subtext provides transparent content analysis: every automated warning includes detailed reasoning so you can understand how it was determined. Source citations and author notes coming soon. We use multiple verification layers and clear reasoning trails. Severity ratings are subjective—they vary by individual sensitivity. Subtext is a tool for information, not a substitute for professional judgment.',
      betaDisclaimer: 'Automated analysis is actively being improved. Results may vary.',
      comfortReadPrefix: 'Verified by automated analysis (Beta)',
    },
    wording: {
      analysisSource: 'automated',
      analysisSourceTitleCase: 'Automated',
      warningLabel: 'Automated',
      reasoningSubject: "The system's",
    },
  },
  lite: {
    id: 'lite',
    name: 'Book Scanner',
    tagline: 'Content warnings for books.',
    meta: {
      title: 'Book Scanner',
      description: 'Scan books to see content warnings. No account required.',
    },
    homepage: {
      headline: 'Content warnings for any book.',
      headlineItalic: 'Scan and see.',
      subhead: 'Scan a barcode or enter an ISBN to see content warnings and age guidance.',
      ctaPrimary: 'Start Scanning',
      ctaSecondary: 'Browse Bookshelf',
    },
    features: {
      contentWarnings: { title: 'Content Warnings', description: 'See themes and sensitive content.' },
      ageRatings: { title: 'Age Guidance', description: 'Age recommendations for readers.' },
      community: { title: 'Community', description: 'Coming soon.' },
    },
    footer: {
      trustStatement: 'Content warnings are advisory. Use your judgment.',
      betaDisclaimer: 'Beta—results may vary.',
      comfortReadPrefix: 'No content warnings detected (Beta)',
      betaModalSummary: 'Content warnings are generated from book information. Beta—results may vary. Use your judgment.',
    },
    wording: {
      analysisSource: 'generated',
      analysisSourceTitleCase: 'Generated',
      warningLabel: 'content',
      reasoningSubject: "Our",
    },
    flags: {
      showHowWeGenerate: false,
      showTransparencyLink: false,
      showFeaturesGrid: false,
      showBookTokSummary: false,
      showReasoningInWarnings: false,
      showAffiliate: false,
    },
  },
}

export function getVariantId(): VariantId {
  const v = process.env.NEXT_PUBLIC_VARIANT
  if (v === 'lite') return 'lite'
  if (v === 'libraries' || v === 'schools') return v
  return 'public'
}

export function getVariantConfig(): VariantConfig {
  return VARIANTS[getVariantId()]
}
