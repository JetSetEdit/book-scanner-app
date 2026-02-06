## 1. Specification and design

- [x] 1.1 Ensure proposal.md, design.md, and tasks.md are complete and consistent
- [x] 1.2 Add capability `sss-assignment` via spec delta (requirements and scenarios)
- [x] 1.3 Run `openspec validate add-sss-assignment-agent --strict --no-interactive` and fix any issues

## 2. Implementation

- [x] 2.1 Create SSS assignment module (e.g. `lib/services/sss-assignment.ts` or `lib/sss-agent.ts`) with interface: input (warnings, book metadata), output (`sss_level`, `sss_notes`); implement triage logic (prompt-based or rule-based) per design
- [x] 2.2 Encode S1–S4 band definitions and triage steps in prompts or rules (themes → explicitness/frequency → emotional load → notes)
- [x] 2.3 Integrate SSS step into scan flow: call after content warnings are available; optionally persist `sss_level` and `sss_notes` to `books` when saving scan results
- [x] 2.4 Define behavior when warnings are absent or sparse (e.g. assign S1 or S2 with note “No content warnings; defaulting to low intensity” or equivalent)
- [x] 2.5 Add tests or manual verification for at least one book per band (S1–S4) and for zero-warnings case

## 3. Documentation

- [x] 3.1 Document SSS triage process and band definitions in code or docs (e.g. link to Subtext SSS description or in-file comments)
- [x] 3.2 Update README or relevant docs if a new script or API is exposed for backfill or manual SSS run
