# BENCHMARK_SCAN_MODES

ISBN: `9781408726600`
Book: Verity — Colleen Hoover
Base description length: 0 chars
Generated: 2026-01-07T02:02:37.567Z

Note: base metadata has no description. Configs that disable web enrichment are expected to under-call (often 0 warnings).

## Recommended defaults (based on this run)

- **Deep (at-home / trauma-aware)**: Use **C0** (OpenAI + web enrichment; keep verification/adversarial when Gemini is available). It’s the only configuration here that reliably produced a richer warning set on a book with **0-char base description**.
- **Quick (bookstore / browsing)**: Do **single-model OpenAI** with **maxWarnings=5**, **no per-warning reasoning**, and **web enrichment enabled only when metadata is thin** (e.g. description < 200 chars). On this ISBN, any “no-enrichment” quick config returned **0 warnings (G)** which is not acceptable.

## Key caveats from this run

- **Gemini quota was rate-limited (429)** during this benchmark, so Gemini-enabled configs effectively behaved like OpenAI-only in several runs.
- **This ISBN has no stored description** (`books.description` is null). This heavily biases results toward configs with enrichment.

## Summary table

| Config | Time | Rating | #Warnings | Severe/Mod/Mild | HighRisk | Overlap vs C0 | Notes |
|---|---:|---|---:|---|---|---:|---|
| C8 | 987ms | G | 0 | 0/0/0 | no | 0.00 |  |
| C5 | 2.1s | G | 0 | 0/0/0 | no | 0.00 |  |
| C6 | 2.8s | G | 0 | 0/0/0 | no | 0.00 |  |
| C4 | 2.8s | G | 0 | 0/0/0 | no | 0.00 |  |
| C1 | 2.9s | G | 0 | 0/0/0 | no | 0.00 |  |
| C2 | 16.7s | M | 4 | 0/3/1 | no | 0.43 |  |
| C3 | 18.7s | M | 4 | 1/2/1 | no | 0.43 |  |
| C0 | 22.9s | MA15+ | 6 | 3/2/1 | no | 1.00 |  |
| C9 | 36.7s | G | 0 | 0/0/0 | no | 0.00 |  |
| C7 | 44.3s | G | 0 | 0/0/0 | no | 0.00 |  |

## Details

### C8: Quick Gemini-only, capped + truncated
- Time: 987ms
- Rating: G
- High risk present: no
- Overlap vs C0 (Jaccard): 0.00
- Warnings:

### C5: Quick OpenAI-only, capped to 5 warnings (full description)
- Time: 2.1s
- Rating: G
- High risk present: no
- Overlap vs C0 (Jaccard): 0.00
- Warnings:

### C6: Quick OpenAI-only, capped + truncated description
- Time: 2.8s
- Rating: G
- High risk present: no
- Overlap vs C0 (Jaccard): 0.00
- Warnings:

### C4: Deep OpenAI-only (no Gemini/adversarial/verification/enrichment)
- Time: 2.8s
- Rating: G
- High risk present: no
- Overlap vs C0 (Jaccard): 0.00
- Warnings:

### C1: Deep minus enrichment
- Time: 2.9s
- Rating: G
- High risk present: no
- Overlap vs C0 (Jaccard): 0.00
- Warnings:

### C2: Deep minus verification
- Time: 16.7s
- Rating: M
- High risk present: no
- Overlap vs C0 (Jaccard): 0.43
- Warnings:
  - death_or_grief.character_death (moderate, conf=0.85)
  - death_or_grief.miscarriage_abortion (moderate, conf=0.70)
  - family_dynamics.deception_or_secrets (moderate, conf=0.60)
  - other.accidents (mild, conf=0.55)

### C3: Deep minus adversarial
- Time: 18.7s
- Rating: M
- High risk present: no
- Overlap vs C0 (Jaccard): 0.43
- Warnings:
  - death_or_grief.miscarriage_abortion (severe, conf=0.75)
  - death_or_grief.character_death (moderate, conf=0.85)
  - family_dynamics.deception_or_secrets (moderate, conf=0.60)
  - other.accidents (mild, conf=0.65)

### C0: Baseline Deep: OpenAI+Gemini + adversarial + verification + enrichment
- Time: 22.9s
- Rating: MA15+
- High risk present: no
- Overlap vs C0 (Jaccard): 1.00
- Warnings:
  - death_or_grief.grief (severe, conf=0.75)
  - death_or_grief.miscarriage_abortion (severe, conf=0.70)
  - sexual_content.explicit_sexual_content (severe, conf=0.45)
  - death_or_grief.character_death (moderate, conf=0.85)
  - emotional_abuse_or_toxic_relationships.manipulation (moderate, conf=0.55)
  - other.accidents (mild, conf=0.65)

### C9: Hybrid: fast-model quick; verify on high-risk with stronger model
- Time: 36.7s
- Rating: G
- High risk present: no
- Overlap vs C0 (Jaccard): 0.00
- Warnings:

### C7: Quick fast-model (OpenAI), capped + truncated
- Time: 44.3s
- Rating: G
- High risk present: no
- Overlap vs C0 (Jaccard): 0.00
- Warnings:
