# Change: Assess feedback and identify failure root causes

## Why

When users submit feedback about content issues (e.g., "This book should have warnings but shows 0"), we currently have no systematic way to understand why the analysis failed or produced unexpected results. The feedback sits in `manual_handling_scans` with context data, but there's no automated assessment that:

1. Cross-references feedback with audit logs to understand what actually happened
2. Identifies root causes (thin metadata, rate limits, false negatives, analysis errors)
3. Provides actionable insights for resolving the feedback
4. Surfaces patterns across multiple feedback items

This makes it difficult to:
- Prioritize which feedback to address first
- Understand systemic issues (e.g., "all books with thin metadata are failing")
- Improve the analysis pipeline based on real user feedback
- Quickly diagnose why a specific book analysis failed

## What Changes

- **Feedback assessment script** - New script that analyzes feedback entries and cross-references with:
  - `ai_audit_logs` (decision_type, ai_reasoning, metadata_issues, had_thin_metadata, used_web_search)
  - `books` table (description length, metadata quality)
  - `content_warnings` table (actual warnings count vs. expected)
  - `manual_handling_scans` (other related entries like `analysis_failed`, `rate_limit_exceeded`)
- **Root cause identification** - Categorize failures into:
  - Thin metadata (description too short, missing cover)
  - Rate limit errors (API quota exceeded)
  - Analysis errors (AI model failures, parsing errors)
  - False negatives (analysis completed with "no_warnings" but user expects warnings)
  - Missing analysis (no audit log, book shows as "Unknown")
- **Assessment output** - Structured report showing:
  - Root cause category for each feedback item
  - Confidence level (high/medium/low) for the assessment
  - Recommended actions (e.g., "Re-scan with forceRefresh", "Manually add warnings", "Fetch better metadata")
  - Pattern detection (e.g., "3 feedback items all related to thin metadata")
- **Integration with existing tools** - Enhance `view-feedback.ts` to optionally show assessment results

## Impact

- Affected specs: `feedback-analysis` (new capability)
- Affected code:
  - New script: `scripts/assess-feedback.ts`
  - Enhanced: `scripts/view-feedback.ts` (optional assessment display)
  - Documentation: Update feedback retrieval docs with assessment examples
