# Content Warning Accuracy Benchmark (v1.03.31)

**Date:** January 15, 2026
**Scope:** Complete Database Audit (63 Books)
**Overall Status:** ⚠️ Significant Safety Gaps Detected

---

## 🛑 Category 1: The "Silent Failures" (0 Warnings)
*These books exist in the database but have NO warnings attached. This is likely due to API timeouts or silent errors during the scan process.*

| Book | Reality | App Result | Risk Level |
| :--- | :--- | :--- | :--- |
| **The Handmaid's Tale** | **Extreme** (Systemic Rape, Slavery) | **No Warnings** | 🚨 **CRITICAL** |
| **It Ends With Us** | **Severe** (Domestic Violence) | **No Warnings** | 🚨 **CRITICAL** |
| **The Great Alone** | **Severe** (Domestic Violence) | **No Warnings** | 🚨 **CRITICAL** |
| **The Time Traveler's Wife** | **Severe** (Miscarriage, Death) | **No Warnings** | ⚠️ High |

*Note: Children's books like "Goodnight Moon" and "Crazy Action Contraptions" also have 0 warnings, which is correct.*

---

## 🛑 Category 2: The "Under-Reactors" (Severity Mismatch)
*The app found the topic but rated it "Moderate" or "Mild" when it is clearly Severe.*

| Book | Trigger | App Rating | Should Be |
| :--- | :--- | :--- | :--- |
| **A Little Life** | Self-Harm / Abuse | **Moderate** | **EXTREME** |
| **A Game of Thrones** | Rape / Incest | **Moderate** | **Severe** |
| **Gone Girl** | Murder / Gore | **Mild** | **Severe** |
| **The Woman in the Window** | Suicide / Alcoholism | **Missed / Moderate** | **Severe** |
| **Red Rising** | Sexual Assault | **Missed** | **Severe** |

---

## 🛑 Category 3: The "Hallucinations" (False Positives)
*The app flagged severe triggers that do not exist, likely from scraping bad data.*

| Book | Flagged As | Reality | Source of Error |
| :--- | :--- | :--- | :--- |
| **The Princess Knight** | **Sexual Assault** | Clean (YA Fantasy) | Scraped a "Paste Magazine" listicle. |
| **Bad Magic** | **Sexual Violence** | Clean (Middle Grade) | Scraped a generic warning list. |
| **The Pledge** | **Sexual Violence** | Clean (YA Dystopian) | Likely scraped bad metadata. |

---

## ✅ Category 4: The "Success Stories"
*The app performed perfectly on these titles.*

| Book | Trigger | Why it worked |
| :--- | :--- | :--- |
| **The Hate U Give** | Police Brutality | Nailed the social context. |
| **The Fault in Our Stars** | Cancer / Death | Identified terminal illness context. |
| **Sweet Venom** | Somnophilia | Identified niche Dark Romance kink. |
| **Addicted for Now** | Sex Addiction | Title/Blurb made it explicit. |
| **1984** | Surveillance / Torture | Identified classic Dystopian themes. |

---

## 🛠 Recommended Fixes

### 1. Retry Logic for "Silent Failures"
*   **Immediate Fix:** Run a script to re-scan all books with 0 warnings (excluding Children's genres).
*   **Code Fix:** Ensure API timeouts or errors explicitly mark the scan as "Failed" rather than "Completed with 0 warnings."

### 2. Hard-Coded Severity Floor
*   If keywords like **"Rape"**, **"Suicide"**, **"Abuse"**, or **"Torture"** appear in the AI reasoning or evidence, **Override Severity to SEVERE**. Do not trust the LLM's "Moderate" assessment.

### 3. Source Whitelisting
*   Disable scraping from generic sites like *Paste Magazine*, *Reddit*, or *Pinterest*.
*   Prioritize *StoryGraph*, *Common Sense Media*, and *Kirkus*.

### 4. Thriller Tuning
*   Update the prompt to explicitly look for **"Alcoholism"** and **"Suicide"** in Psychological Thrillers, as these are the most common missed triggers in that genre.
