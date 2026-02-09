/**
 * Homepage copy for positioning (value prop, hero, problem, solution, trust, proof, FAQ, CTA).
 * Sourced from feedback: subtext_value_prop_proposal_alt, subtext_landing_template_proposal, subtext_master_strategy_email.
 */

export const homepageCopy = {
  hero: {
    headline: "Know what's really in a book before assigning, recommending, or buying.",
    subhead:
      "Subtext helps teachers and parents run a 60-second suitability check with clear content warnings, age guidance, and context notes.",
    ctaPrimary: "Scan a title now",
    ctaSecondary: "See example scans",
    microcopy:
      "Quick Scan is built for fast triage. Deep Scan adds higher-confidence analysis and richer context.",
  },
  problem: {
    title: "The problem",
    points: [
      {
        title: "Shelf placement can be misleading",
        body: "BookTok and retail “YA” labels don’t always reflect explicit content.",
      },
      {
        title: "Classroom risk is hard to assess quickly",
        body: "Teachers need confidence before assigning or recommending texts.",
      },
      {
        title: "Parents need context before buying",
        body: "Blurb and reviews often miss the practical suitability concerns.",
      },
    ],
  },
  solution: {
    title: "How we solve this",
    items: [
      {
        title: "Quick Scan (15–30s)",
        body: "Get immediate warning triage for first-pass decision making.",
      },
      {
        title: "Deep Scan (90–120s)",
        body: "Get richer context and higher-confidence insights before final decisions.",
      },
      {
        title: "Clear “Why” explanations",
        body: "Understand why something is flagged, not just that it is flagged.",
      },
    ],
  },
  trust: {
    badges: [
      "Public Beta (actively improving)",
      "Transparent methodology",
      "Indicative guidance (not official board rating)",
      "Privacy-first (no personal reading profile required)",
    ],
  },
  howItWorks: {
    title: "How it works",
    steps: [
      "Search or scan a title",
      "Review warnings + age guidance + context",
      "Decide to assign, recommend, buy, or skip",
    ],
  },
  proof: {
    title: "Why people use Subtext",
    cards: [
      {
        title: "Classroom fit check",
        body: "Confirm a title is suitable before assigning or recommending it.",
      },
      {
        title: "BookTok reality check",
        body: "See if popular YA shelf picks include mature content before buying.",
      },
      {
        title: "Clear ‘why’ context",
        body: "Each warning includes a reason so decisions are informed, not guesswork.",
      },
    ],
  },
  faq: {
    title: "FAQ",
    items: [
      { q: "How accurate is Subtext?", a: "Subtext uses AI to analyse book descriptions and known content. Results are indicative and improve with our methodology; we recommend using them alongside your own judgment." },
      { q: "What's the difference between Quick and Deep Scan?", a: "Quick Scan (15–30s) gives fast triage for first-pass decisions. Deep Scan (90–120s) adds richer context and higher-confidence analysis." },
      { q: "Is this replacing teacher or parent judgment?", a: "No. Subtext is a suitability check to inform your judgment, not replace it." },
      { q: "Is this an official classification?", a: "No. Our age guidance and warnings are indicative, not official board ratings." },
      { q: "How is my data handled?", a: "We are privacy-first: we don’t require a personal reading profile. Scan and usage data are handled in line with our Privacy Policy." },
    ],
  },
  finalCta: {
    prompt: "Ready to check what's really in a book?",
    cta: "Run your first scan",
    tagline: "Free triage. Pay for depth.",
  },
} as const
