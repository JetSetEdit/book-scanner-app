# Book Analysis Methods Review

**Date:** 2025-12-30  
**Purpose:** Review all books in database and identify which analysis variant was used

## Analysis Variants Identified

### 1. **Single-Model (GPT-4o) - Legacy**
- **Model:** `gpt-4o-2024-11-20`
- **Taxonomy Versions:** `1.0.0`, `2.0.0`, `2.3.0`
- **Pipeline Paths:**
  - `metadata_only` - No web search, metadata only
  - `web_search_cached` - Web search with cached results
  - `web_search_live` - Live web search performed
- **Endpoint:** `/api/scan-isbn`
- **Status:** Legacy, still in use for some books

### 2. **Multi-Model (GPT-4o + Gemini) - Current**
- **Models:** `gpt-4o-2024-11-20` + `gemini-2.5-flash`
- **Taxonomy Version:** `2.3.0` (latest)
- **Pipeline Path:** `multi_model_combined`
- **Endpoint:** `/api/scan-multi-model`
- **Status:** Current default (always enabled)

## Books by Analysis Method

### Books Analyzed with Multi-Model (Recent)
These books were scanned using the multi-model endpoint:

1. **Does It Hurt?** (9781957635026) - H. D. Carlton
   - Last scan: 2025-12-30 03:29:44
   - Warnings: 3
   - Method: Multi-model (GPT-4o + Gemini)

2. **The Ritual** (9798777213471)
   - Last scan: 2025-12-30 01:37:48
   - Warnings: 5
   - Method: Multi-model (GPT-4o + Gemini)

3. **Fourth Wing** (9780349436999) - Rebecca Yarros
   - Last scan: 2025-12-30 00:03:16
   - Warnings: 7
   - Method: Multi-model (GPT-4o + Gemini)

4. **Corrupt** (9780349444086) - Penelope Douglas
   - Last scan: 2025-12-30 03:30:24
   - Warnings: 4
   - Method: Multi-model (GPT-4o + Gemini)

### Books Analyzed with Single-Model (Legacy)
These books were scanned using the single-model endpoint:

#### Taxonomy 2.3.0 (Latest Single-Model)
- **Corrupt** (9780349444086) - Penelope Douglas
  - Scan: 2025-12-30 03:27:06
  - Pipeline: `web_search_live`
  - Warnings: 0 (metadata scan only)

- **Taming 7** (9780349439358) - Chloe Walsh
  - Scans: 5 total
  - Latest: 2025-12-30 01:50:51
  - Pipeline: `web_search_live`
  - Warnings: 0

- **Skyshade** (9781419773792) - Alex Aster
  - Scans: 3 total
  - Latest: 2025-12-29 11:11:09
  - Pipeline: `web_search_live`
  - Taxonomy: 2.0.0 → 2.3.0

- **The Cruel Prince** (9781471407277) - Holly Black
  - Scan: 2025-12-29 10:40:17
  - Pipeline: `web_search_live`
  - Warnings: 0

#### Taxonomy 2.0.0 (Older Single-Model)
- **Fantastic Mr. Fox** (9780140328721) - Roald Dahl
  - Scans: 3 total
  - Latest: 2025-12-29 07:43:24
  - Pipeline: `web_search_cached`
  - Warnings: 1

- **Going Postal** (9780857525086) - Terry Pratchett
  - Scans: 3 total
  - Latest: 2025-12-27 13:11:46
  - Pipeline: `web_search_cached`
  - Warnings: 2

- **Corrupt** (9781518783876) - Penelope Douglas
  - Scans: 3 total
  - Latest: 2025-12-27 13:02:18
  - Pipeline: `web_search_cached`
  - Warnings: 6

- **The Ritual** (9798218160197) - Shantel Tessier
  - Scans: 3 total
  - Latest: 2025-12-27 12:55:34
  - Pipeline: `web_search_cached`
  - Warnings: 3

- **The Seven Husbands of Evelyn Hugo** (9781501161933) - Taylor Jenkins Reid
  - Scans: 3 total
  - Latest: 2025-12-27 12:43:45
  - Pipeline: `web_search_cached`
  - Warnings: 5

- **A Little Life** (9781447294832) - Hanya Yanagihara
  - Scan: 2025-12-27 12:26:38
  - Pipeline: `metadata_only` (no web search)
  - Warnings: 6

- **House of Leaves** (9780375703768) - Mark Z. Danielewski
  - Scans: 3 total
  - Latest: 2025-12-27 12:09:24
  - Pipeline: `web_search_cached`
  - Warnings: 4

- **Gender Queer** (9781549304002) - Maia Kobabe
  - Scans: 3 total
  - Latest: 2025-12-27 12:06:43
  - Pipeline: `web_search_cached`
  - Warnings: 3

- **We Were Liars** (9781760111069) - E. Lockhart
  - Scan: 2025-12-27 12:04:21
  - Pipeline: `web_search_live`
  - Warnings: 3

#### Taxonomy 1.0.0 (Very Old)
- **It Ends with Us** (9781501110368) - Colleen Hoover
  - Scans: 6 total
  - Latest: 2025-12-27 12:18:11
  - Taxonomy: 1.0.0 → 2.0.0
  - Pipeline: `web_search_cached`, `web_search_live`

- **A Court of Thorns and Roses** (9781526605399) - Sarah J. Maas
  - Scans: 2 total
  - Latest: 2025-12-13 09:15:52
  - Taxonomy: 1.0.0 → 2.0.0
  - Pipeline: `metadata_only`, `web_search_live`

## Summary Statistics

### By Taxonomy Version
- **Taxonomy 2.3.0:** 8 books (latest, includes multi-model)
- **Taxonomy 2.0.0:** 40+ books (most common)
- **Taxonomy 1.0.0:** 2 books (very old)

### By Pipeline Path
- **web_search_live:** Most recent scans, live web search
- **web_search_cached:** Older scans, cached web results
- **metadata_only:** No web search, metadata only
- **multi_model_combined:** Multi-model scans (GPT-4o + Gemini)

### By Model
- **gpt-4o-2024-11-20:** All single-model scans
- **gpt-4o-2024-11-20 + gemini-2.5-flash:** Multi-model scans (recent)

## Recommendations

### Books That Should Be Re-Scanned
1. **Books with Taxonomy 1.0.0 or 2.0.0** - Should be updated to 2.3.0
2. **Books with `metadata_only` pipeline** - Should be re-scanned with web search
3. **Books with 0 warnings** - May need re-scan with multi-model for better coverage

### Priority Re-Scans
1. **Does It Hurt?** (9781957635026) - Already multi-model, but may need fresh scan for dark romance features
2. **Corrupt** (9780349444086) - Has both single-model and multi-model scans, consolidate
3. **Fourth Wing** (9780349436999) - Multi-model, but check if warnings are up to date
4. **The Ritual** (9798777213471) - Multi-model, verify warnings

## Notes

- **Null model_version:** Some audit logs have `null` model_version - these are likely metadata-only checks or failed scans
- **Multiple scans per book:** Many books have been scanned multiple times as the system evolved
- **Pipeline evolution:** `web_search_cached` → `web_search_live` → `multi_model_combined`

