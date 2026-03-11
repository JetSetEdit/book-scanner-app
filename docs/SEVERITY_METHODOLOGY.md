# How Subtext Determines Warning Severity

**Plain-English summary for review committees and curriculum adoption**

Subtext labels content warnings with a severity level: **mild**, **moderate**, or **severe**. Severity is not chosen by an AI in a black box. It is produced by a **fixed set of rules and signals** so that the same type of content is treated consistently across books.

---

## 1. What we use as input (signals)

For each warning we consider:

- **How often** the content appears (single mention vs repeated vs central theme).
- **How explicit** it is (vague reference vs moderate detail vs graphic).
- **How close to the reader** it is (e.g. on-page vs referenced in passing).
- **How central** it is to the story (throwaway vs minor vs central theme).
- **Topic baseline** from our taxonomy (some topics are treated as more serious by default).
- **Context** (e.g. educational or historical context, or condemned by the narrative) can lower severity; endorsed or exploitative presentation can keep it higher.

These are combined into a single score using a defined formula.

---

## 2. How we turn that into mild / moderate / severe

- The formula uses the signals above to produce a **numeric score**.
- That score is mapped to labels using **fixed thresholds**:
  - **Mild**: score below 0.35  
  - **Moderate**: score from 0.35 to below 0.70  
  - **Severe**: score 0.70 and above  

So severity is **computed**, not guessed. The same inputs always give the same severity band.

---

## 3. Special rules for high‑risk topics

For a small set of serious topics (e.g. sexual violence, suicidal ideation, torture, infanticide or intentional harm to children), we apply a **floor**: if the system has identified that topic, we do not label it below **moderate**, even when the signals are limited. That avoids underplaying the most serious content.

---

## 4. Multiple models and “highest severity wins”

When we use more than one AI model to analyse a book, we **merge** their warnings. If one model says “mild” and another says “severe” for the same type of content, we keep the **higher** severity. We do not average down. That keeps our labels on the cautious side when models disagree.

---

## 5. What this means for you

- Severity is **rule- and signal-based**, not arbitrary.
- The **method is consistent** across books and over time.
- We **do not** invent categories or severities; every warning maps to a defined category in our taxonomy.
- For formal review, you can describe our approach as: *“Severity is computed from frequency, explicitness, proximity, centrality, and topic baseline, using fixed thresholds and floors for high‑risk topics, with a ‘highest severity wins’ rule when multiple models are used.”*

---

*This document reflects the implementation in the Subtext codebase (e.g. `lib/utils/severity-computation.ts`, `lib/services/multi-model-analysis.ts`) and is intended for curriculum committees, librarians, and institutional review.*
