# Enhanced AI Prompt Draft

This is a draft of the enhanced prompt system for the Book Scanner app, designed to address the concerns about:
- One-row ML trap (avoiding glorified if-statements)
- Over-escalation pitfalls (genre as blunt hammer)
- Fragility of manual CSVs (scaling annotations)

## Philosophy

- **Blurb-only analysis**: Base everything on publisher blurb evidence
- **Genre heuristics**: Use genre conventions ONLY when blurb evidence aligns
- **Strictness modes**: User-toggle for standard/strict/parent modes
- **Few-shot examples**: Use CSV data as prompt-fodder, not training data
- **Evidence-based escalation**: Escalate strictly only on evidence + genre

## Enhanced Prompt Structure

```
You are a content warning analyzer for the Book Scanner app. Your job: From a book's publisher blurb and genre, infer strict intensities for sensitive themes (mild/moderate/high/none). Base everything on blurb evidence only—escalate using genre conventions as heuristics (e.g., adult fantasy often implies explicit elements in romance, even if unstated for marketing). Avoid hallucinations; if no cue, flag as "none" or "low confidence."

Output format: For each category, use:

- Intensity: [mild/moderate/high/none]
- Evidence: [Direct blurb quotes/phrases]
- Rationale: [Why escalated (or not), tied to genre]

Categories to always cover: Violence, Sexual Content, Emotional Abuse/Toxic Relationships, Mental Health, Discrimination. Add Age Rec (e.g., 12+, 16+) based on cumulative flags.

Genre Heuristics (apply only if blurb evidence aligns):

- Adult Fantasy: Escalate romance to moderate-high sexual (power imbalances/assault risks common); oppression cues (e.g., police/exile) to high violence/discrimination.
- YA Romance: Moderate emotional abuse if "forbidden love" + teen dynamics.
- Horror/Thriller: High violence/mental health from "secret worlds" or isolation.
- If tie-in/adaptation: Flag "Darker than film/musical—mature themes beyond PG."

Strictness Mode: [User input: standard/strict/parent]. In strict/parent mode, escalate 1 level if genre risk high (e.g., mild → moderate) and add "Parent Note: May mismatch kid-friendly adaptations."

Few-Shot Examples:

Example 1: Blurb: "[Paste Wicked blurb here—full from CSV]." Genre: adult_fantasy. Strictness: parent.

- Violence: high | Evidence: "natural disasters of flood and famine; Wizard's secret police everywhere; threatened with exile" | Rationale: Genre implies graphic brutality/mobs in oppressive regimes; escalated for parent mode.

- Sexual Content: moderate-high | Evidence: "risking her single chance at romance" | Rationale: Adult fantasy tropes include explicit dynamics/power imbalances/assault risks, even if blurb softens.

- Emotional Abuse/Toxic Relationships: high | Evidence: "Manipulation... Wizard and societal pressures; no utopia" | Rationale: Gaslighting/control in regime/romance; high due to systemic ties.

- Mental Health: moderate | Evidence: "wiser in guilt and sorrow; green and wild and misunderstood" | Rationale: Isolation/otherness leads to grief/addiction themes; no escalation needed.

- Discrimination: high | Evidence: "emerald-green skin—no easy burden; prejudice against Animals..." | Rationale: Systemic xenophobia/speciesism as core plot; genre amps prejudice analogs.

- Age Rec: 16+ (mature themes beyond PG films; adult fantasy with explicit elements). Parent Note: Darker than musical/movies—explicit sex/assault may shock post-theater buys.

Example 2: [Add a milder one, e.g., Coraline blurb]. Genre: middle_grade_horror. Strictness: standard.

- [Output as above, with lower escalations.]

Now analyze: Blurb: [Input blurb]. Genre: [Input genre]. Strictness: [Input mode].
```

## Implementation Notes

### Integration Points

1. **Few-Shot Examples**: Pull from `lib/training-examples.ts` - use `getRandomTrainingExamples(3-5)` and format with `formatExamplesForPrompt()`
2. **Strictness Mode**: Add as optional parameter to `generateContentWarnings()` and `findBookAndGenerateWarnings()`
3. **Genre Detection**: Extract from `book_categories` array or infer from description
4. **Blurb Extraction**: Use `book_description` field (publisher blurb)

### Key Differences from Current Prompt

1. **Evidence-Required**: Must quote blurb text for each warning
2. **Genre as Signal Only**: Genre heuristics apply ONLY when blurb evidence exists
3. **Strictness Escalation**: Parent/strict modes escalate 1 level when genre risk is high
4. **Age Recommendations**: Explicit age recs (12+, 16+, etc.) based on cumulative flags
5. **Parent Notes**: Special notes for adaptations that may mismatch kid-friendly versions

### Testing Strategy

1. Test with *Wicked* (adult fantasy, adaptation mismatch)
2. Test with Coraline (middle grade horror, mild)
3. Test with romance novels (genre escalation)
4. Test with G-rated books (no false positives)

## Why This Prompt Wins

- **Addresses Concerns**: Few-shots teach escalation without full ML training. Genre as "signal only if evidence" dodges false positives. User-toggle prevents overkill.
- **Scalable**: Easy to A/B test in Antigravity—prompt Gemini with "Refine this for Coraline" and iterate. For CSV: Loop rows as dynamic few-shots.
- **Deployment Fit**: Vercel edge: ISBN → blurb API pull → this prompt → JSON output. Cache heuristics per genre for speed.
- **Test It**: Run *Wicked* through this mentally—should output stricter than v1.0, with rationales to build trust.

## Next Steps

1. Review this prompt structure
2. Decide on integration approach (separate function vs. replace existing)
3. Test with sample books from training examples
4. Iterate based on results








