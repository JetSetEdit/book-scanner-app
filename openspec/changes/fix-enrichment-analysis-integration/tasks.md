# Tasks: Fix enrichment → analysis integration

## 1. Enrichment result type and naming

- [x] 1.1 In `lib/services/web-search-enrichment.ts`, ensure `EnrichmentResult` exposes `combinedText` and `hadResults` (add fields or aliases: `combinedText` = enriched context string, `hadResults` = true when enrichment produced any combined text). Keep backward compatibility with existing `enrichedContext` / `foundContentWarnings` if other code depends on them.
- [x] 1.2 Update any callers that rely on the enrichment result to use the agreed shape (multi-model-analysis, scan-service if it ever reads enrichment result directly).

## 2. Analysis input and short-circuit

- [x] 2.1 In `lib/services/multi-model-analysis.ts`, when description is missing or minimal and web enrichment is enabled, run enrichment **before** the first Gemini/OpenAI pass (or ensure first pass receives combined text: base description + enrichment). Build `inputText` = base description (or title+author) + optional “Additional context from community content-warnings and reviews:” + enrichment combined text when enrichment succeeded.
- [x] 2.2 Pass `inputText` (via metadata.description or equivalent) into `analyzeWithGemini` and `analyzeWithOpenAI` for the first pass when enrichment was used; ensure no code path still uses only raw `description` for that pass when enrichment text exists.
- [x] 2.3 Replace the “no description → no warnings” early exit with “no description **and** no enrichment”: only return zero warnings with reasoning when `!description?.trim() && !enrichment?.hadResults`. When `enrichment?.hadResults === true`, do not short-circuit; run full analysis with the built input text.

## 3. Needs-review safety net

- [x] 3.1 In `analyzeBookWithMultiModel()` (or in scan-service after receiving `analysisResult`), set `analysisResult.needsReview = true` when enrichment was used (`enrichment?.hadResults === true`) and `analysisResult.warnings.length === 0`.
- [x] 3.2 In `lib/services/scan-service.ts`, when persisting the scan result, store the needs-review flag (e.g. on `books` table or in audit/scan payload). Do not override existing warnings for that ISBN when the run is needs-review, or persist with a low-confidence / needs-review marker as decided in implementation.
- [ ] 3.3 (Optional, follow-up) Add or document API/UI hook so the book page can show a subtle “Needs review” banner when the flag is set; out of scope for minimal implementation if time-boxed.

## 4. SSS description fallback

- [x] 4.1 In `lib/services/scan-service.ts`, at both call sites of `assignSSS` (with warnings and with zero warnings), compute `sssDescription = descriptionForAnalysis || enrichmentContextFromResult || \`${title} by ${author}\`` using enrichment from the analysis result (e.g. `analysisResult.web_enrichment` or passed-through enrichment text). Pass `description: sssDescription` to `assignSSS`.
- [x] 4.2 Ensure enrichment context is available at the SSS call site (e.g. multi-model-analysis returns it, or scan-service keeps a reference from the analysis result).

## 5. Regression tests

- [x] 5.1 Add `lib/services/__tests__/enrichment-integration.test.ts` (or equivalent). Test 1: Enrichment-only book (empty description, enrichment with trauma-related phrases) produces warnings; assert `warnings.length > 0`, no `noWarningsReasoning`, and `needsReview !== true` for this happy path.
- [x] 5.2 Test 2: Enrichment returns content but model still returns zero warnings; assert `warnings.length === 0` and `needsReview === true`.
- [x] 5.3 Test 3: No description and no enrichment; assert zero warnings, `noWarningsReasoning` describes lack of input, and SSS default (S1) with “no information” style note where applicable.

## 6. Manual verification

- [ ] 6.1 Re-run manual Klune test: `npx tsx scripts/test-sss-assignment.ts 9781250217349` (or the Under the Whispering Door ISBN). Expect warnings to include death/grief/mental-health related items, SSS S2_MILD or S3_MODERATE with notes referring to grief/death/emotional themes, and no “no-warnings reasoning” for this ISBN.
