# Third-Party Psychology & NLP Resources Policy

This document is the single source of truth for third-party psychology, NLP, or similar resources that are **considered or used** for content warnings, SSS (Subtext Suitability Scale), emotional-intensity, or related features. It defines permitted use and attribution so the project stays compliant when launching as a revenue-supporting product (affiliate links fund hosting, Supabase, API credits, domain, etc.).

**Related**: For **book metadata and datasets**, see [DATA_SOURCING_POLICY.md](DATA_SOURCING_POLICY.md). This policy covers **research code and reference datasets** (e.g. trigger-warning corpora, emotion-trigger datasets).

---

## Policy Summary

| License     | Permitted use                    | Requirement                                      |
|------------|-----------------------------------|--------------------------------------------------|
| **MIT**    | Use and modify code/data          | Explicit attribution (NOTICE or this doc)        |
| **GPL-3.0**| Do **not** embed code             | Methodology/ideas only; reimplement in our code |
| **Unlicensed** | No assumed license            | Cite paper/repo; seek permission if redistributing |

---

## Resources Listed

### 1. acl23-trigger-warning-assignment (MattiWe)

| Field | Value |
|-------|--------|
| **Name** | acl23-trigger-warning-assignment |
| **Source** | https://github.com/MattiWe/acl23-trigger-warning-assignment |
| **Paper** | Trigger Warning Assignment as a Multi-Label Document Classification Problem (ACL 2023); Trigger Warnings: Bootstrapping a Violence Detector for Fan Fiction (EMNLP 2023 Findings) |
| **License** | MIT |
| **Permitted use** | Embed with attribution |
| **Attribution** | If code or data from this repo is used in the project, add: "Copyright (c) 2023 Matti Wiegmann. Licensed under the MIT License." (e.g. in NOTICE or in an "Attribution" section below). |
| **Status** | Not currently embedded; may be used for benchmarking or validation in future. |

---

### 2. EmoTrigger (smritisingh26)

| Field | Value |
|-------|--------|
| **Name** | EmoTrigger |
| **Source** | https://github.com/smritisingh26/EmoTrigger |
| **Paper** | "Language Models (Mostly) Do Not Consider Emotion Triggers When Predicting Emotion" (NAACL 2024). https://aclanthology.org/2024.naacl-short.51/ |
| **License** | Not specified (no LICENSE file in repo) |
| **Permitted use** | Cite-only / ideas-only |
| **Attribution** | Cite the paper when referencing. If we ever embed code or redistribute their data, seek permission from the authors first. |
| **Status** | Referenced for research context; no code or data embedded. |

---

### 3. CovidET (honglizhan)

| Field | Value |
|-------|--------|
| **Name** | CovidET |
| **Source** | https://github.com/honglizhan/CovidET |
| **Paper** | "Why Do You Feel This Way? Summarizing Triggers of Emotions in Social Media Posts" (EMNLP 2022). https://aclanthology.org/2022.emnlp-main.642/ |
| **License** | Not specified (no LICENSE file in repo) |
| **Permitted use** | Cite-only / ideas-only |
| **Attribution** | Cite the paper when referencing. If we ever embed code or redistribute their data, seek permission from the authors first. |
| **Status** | Referenced for research context; no code or data embedded. |

---

### 4. ACE-NLP (knowlab)

| Field | Value |
|-------|--------|
| **Name** | ACE-NLP (Adverse Childhood Experiences NLP) |
| **Source** | https://github.com/knowlab/ACE-NLP |
| **License** | Not specified (no LICENSE file in repo) |
| **Permitted use** | Cite-only / ideas-only |
| **Attribution** | Cite the repo/paper when referencing. If we ever embed code or redistribute their data, seek permission from the authors first. |
| **Status** | Referenced for research context; no code or data embedded. |

---

### 5. LitEmo (giacomohandjaras)

| Field | Value |
|-------|--------|
| **Name** | LitEmo (Emotions in Literature) |
| **Source** | https://github.com/giacomohandjaras/LitEmo |
| **License** | GPL-3.0 |
| **Permitted use** | **Methodology/ideas only** — do **not** copy or link GPL code into the Subtext codebase. Use only concepts from papers; reimplement in our own code. |
| **Attribution** | When referencing their research, cite the repo or associated papers. |
| **Status** | No GPL code from LitEmo is present in the codebase; any use is ideas-only. |

---

## Third-Party Attribution (when MIT code/data is used)

**acl23-trigger-warning-assignment** (methodology / institutional warning taxonomy referenced in content-warning analysis):

- **Project**: acl23-trigger-warning-assignment — Trigger Warning Assignment as a Multi-Label Document Classification Problem (ACL 2023); violence detector for fan fiction (EMNLP 2023 Findings).
- **Source**: https://github.com/MattiWe/acl23-trigger-warning-assignment
- **Copyright**: Copyright (c) 2023 Matti Wiegmann.
- **License**: MIT License.

**What “acl23-informed” means today:** We **ship their label taxonomy** (no fic text) in-repo at `lib/reference/acl23-label-set/` with a NOTICE (MIT attribution). The pipeline does not yet *use* these labels; “informed” means (1) **attribution** — we credit the project when referring to trigger-warning / violence classification, (2) **conceptual alignment** — our design is in the same spirit as their work, and (3) **reference data** — their coarse/fine labels and fine→coarse map are available for mapping to our taxonomy or for benchmarking. To make use concrete we can: reference this label set in prompts, map it to `lib/config/taxonomy-v2.ts`, or use their full dataset (Zenodo) for benchmarking; attribution and NOTICE remain.

#### Using the acl23 dataset (allowed under MIT)

**Yes — we can use their dataset.** The project is MIT-licensed; use of their data/code is allowed with attribution (above). Options:

| Use | What | How | Attribution |
|-----|------|-----|-------------|
| **Label taxonomy only** | Their 36 institutional warning categories (no fic text). | **Done:** in-repo at `lib/reference/acl23-label-set/` (tw-coarse.json, tw-fine-closed.json, tw-fine-open.json, map-fine-to-coarse.json). See NOTICE in that directory. Map to our taxonomy or add to prompts as needed. | Doc attribution + NOTICE in `lib/reference/acl23-label-set/NOTICE`. |
| **Full dataset for benchmarking** | Fic text + multi-label tags. | 1) Download dehydrated data: [Zenodo 7976807](https://doi.org/10.5281/zenodo.7976807). 2) Optionally hydrate (their script scrapes AO3 for full text — check AO3 ToS if you do this). 3) Use a sample: treat fic title + excerpt (e.g. first 2–3k chars) as "description", run our content-warning pipeline, compare our output to their labels (e.g. violence, major character death). 4) Script in `scripts/` (e.g. `benchmark-acl23.ts`). | Keep doc attribution; add a `NOTICE` file in repo root with "Copyright (c) 2023 Matti Wiegmann. Licensed under the MIT License." for the dataset/code used. |

**Note:** Their data is **fan fiction from Archive of Our Own** (AO3). Our pipeline expects book metadata (title, author, description). For benchmarking, use fic title + a text excerpt as the "book" description so our model has something to analyze; then compare our predicted warnings to their multi-label tags. If you hydrate, ensure compliance with AO3's terms of service.

---

## GPL Confirmation

No GPL-licensed code from LitEmo or any other GPL psychology/NLP repo is present in the Subtext codebase. GPL resources are used only for methodology or ideas; implementation is our own (e.g. content-warning pipeline, SSS assignment in `lib/services/sss-assignment.ts`).

---

## Applying these resources to our model

The policy above allows the following **compliant** ways to use each resource to improve or validate our content-warning and SSS pipeline. Our model = content-warning analysis (`lib/services/multi-model-analysis.ts`, OpenAI/Gemini prompts), SSS assignment (`lib/services/sss-assignment.ts`), and taxonomy (`lib/config/taxonomy-v2.ts`, `lib/config/taxonomy-context.ts`).

| Resource | How we can apply it to our model | Where it would land | Compliant? |
|----------|-----------------------------------|---------------------|------------|
| **acl23-trigger-warning (MIT)** | Use their **dataset or label taxonomy** for benchmarking (e.g. compare our violence/content-warning output on a sample to their labels). Optionally reference their **institutional warning set** when refining our taxonomy or prompts. | Evaluation script (e.g. `scripts/`); optional prompt or taxonomy tweaks. Add attribution in NOTICE or this doc when code/data is used. | Yes (MIT + attribution). |
| **EmoTrigger (unlicensed)** | Use the **idea** that “emotion triggers” (what in the text evokes the emotion) matter for readers. Inform SSS or content-warning prompts with language like “consider what may trigger or activate readers emotionally.” **Cite** the paper (NAACL 2024) in code comments or docs. Do not embed their code or dataset. | `lib/services/sss-assignment.ts` (SSS prompt); or multi-model prompt text in `lib/services/multi-model-analysis.ts`. | Yes (ideas-only + citation). |
| **CovidET (unlicensed)** | Use the **idea** of summarizing “what triggers emotions” in text. Inform prompt design for SSS or advisory descriptions (e.g. “summarize what in the content may trigger distress”). **Cite** the paper (EMNLP 2022). Do not embed code or data. | Same as above: SSS or content-warning prompt wording. | Yes (ideas-only + citation). |
| **ACE-NLP (unlicensed)** | Use the **concept** of Adverse Childhood Experiences to audit our taxonomy (e.g. abuse, trauma, family violence, substance use) and ensure we cover ACE-relevant content appropriately. **Cite** the repo/paper. Do not embed their code or vectors. | Taxonomy review; optional prompt line in content-warning analysis. | Yes (ideas-only + citation). |
| **LitEmo (GPL)** | Use **research on emotions in literature** (e.g. valence/arousal, emotional arcs) to refine SSS band definitions or prompt wording. Reimplement any logic in our own code; do not copy GPL code. **Cite** the repo or papers. | `lib/services/sss-assignment.ts` (SSS prompt or triage steps); our own code only. | Yes (methodology/ideas only; no GPL code). |

**Next steps (optional)**  
- **Benchmarking**: If you want to use acl23’s dataset, download it (see their Zenodo), add a script that runs our pipeline on a sample and compares to their labels, and add the MIT attribution.  
- **Prompt refinement**: Add a short line or two to the SSS or content-warning prompts that reflect “emotion triggers” (EmoTrigger/CovidET) or “reader activation” (LitEmo), with a comment citing the paper.  
- **Taxonomy audit**: Walk taxonomy subcategories against ACE-relevant themes and cite ACE-NLP in a doc or comment where the audit is documented.

---

## Adding a New Resource

When evaluating a new third-party psychology/NLP (or similar) resource:

1. Add a row to the table above (or a new numbered section) with: Name, Source, License, Permitted use, Attribution/Citation requirement, Status.
2. If **MIT**: plan for attribution (NOTICE or this doc) before integrating code or data.
3. If **GPL**: do not embed code; use ideas-only and reimplement.
4. If **Unlicensed**: cite when referencing; document that permission should be sought if we later embed code or redistribute data.

OpenSpec capability: **third-party-resource-compliance**.
