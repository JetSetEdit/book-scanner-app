# Design: Feedback Assessment System

## Context

User feedback about content issues often indicates a problem with the analysis pipeline, but currently there's no systematic way to diagnose why analysis failed or produced unexpected results. This design proposes an assessment system that cross-references feedback with audit logs and book data to identify root causes.

## Goals

- Automatically identify why feedback indicates a failure
- Categorize root causes for prioritization
- Provide actionable recommendations
- Surface patterns across multiple feedback items

## Non-Goals

- Auto-fixing issues (assessment only, not remediation)
- Real-time assessment (batch analysis of feedback)
- Replacing manual review (augmenting, not replacing)

## Decisions

### Decision: Cross-reference multiple data sources

**What**: Assessment queries:
- `manual_handling_scans` (feedback entry)
- `ai_audit_logs` (analysis decisions and reasoning)
- `books` (metadata quality)
- `content_warnings` (actual warnings)
- `manual_handling_scans` with other reasons (analysis_failed, rate_limit_exceeded)

**Why**:
- Single source of truth doesn't exist - need to correlate across tables
- Audit logs contain `ai_reasoning` that explains "no_warnings" decisions
- Book metadata quality affects analysis success
- Other manual_handling_scans entries may indicate related issues

**Alternatives considered**:
- Only check audit logs: Misses cases where analysis never ran
- Only check book metadata: Doesn't explain why analysis failed
- **Chosen**: Multi-source correlation for comprehensive assessment

### Decision: Root cause categories

**What**: Categorize failures into:
1. **Thin metadata** - Description too short, missing cover, insufficient data for analysis
2. **Rate limit** - API quota exceeded, analysis couldn't complete
3. **Analysis error** - AI model failures, parsing errors, unexpected exceptions
4. **False negative** - Analysis completed with "no_warnings" but user expects warnings (high confidence)
5. **Missing analysis** - No audit log exists, book shows as "Unknown"
6. **Metadata mismatch** - Book exists but feedback references different ISBN/title
7. **Unknown** - Insufficient data to determine cause

**Why**:
- Each category has different remediation strategies
- Helps prioritize (false negatives are more urgent than thin metadata)
- Enables pattern detection across feedback

**Alternatives considered**:
- Binary pass/fail: Too simplistic, doesn't guide action
- **Chosen**: Categorized root causes with confidence levels

### Decision: Confidence levels

**What**: Assign confidence (high/medium/low) to each assessment.

**Why**:
- Some assessments are definitive (e.g., rate limit error in manual_handling_scans)
- Others are inferred (e.g., "likely false negative" based on user message)
- Helps reviewers know which assessments to trust

**High confidence**: Direct evidence (audit log with error, rate limit entry)
**Medium confidence**: Strong inference (thin metadata + no_warnings + user complaint)
**Low confidence**: Weak inference (missing data, ambiguous signals)

### Decision: Assessment as separate script, not API endpoint

**What**: Create `scripts/assess-feedback.ts` rather than `/api/admin/assess-feedback`.

**Why**:
- Assessment is batch analysis, not real-time
- Doesn't need to be exposed as API
- Can be run on-demand or scheduled
- Keeps admin routes minimal

**Alternatives considered**:
- API endpoint: Adds complexity, not needed for batch analysis
- **Chosen**: Script-based assessment

## Risks / Trade-offs

### Risk: False positives in root cause identification

**Mitigation**:
- Use confidence levels to indicate uncertainty
- Provide evidence for each assessment
- Allow manual override/correction

### Risk: Performance with large feedback volumes

**Mitigation**:
- Process in batches
- Cache book/audit log lookups
- Limit to recent feedback by default

### Trade-off: Assessment accuracy vs. speed

**Consideration**: More thorough assessment takes longer but is more accurate.

**Mitigation**:
- Start with high-confidence assessments
- Allow filtering by confidence level
- Can enhance assessment logic over time

## Migration Plan

1. **Phase 1**: Create assessment script with basic root cause detection
2. **Phase 2**: Add confidence levels and evidence
3. **Phase 3**: Integrate with view-feedback script
4. **Phase 4**: Add pattern detection across feedback

No database changes needed - assessment reads existing data.

## Open Questions

- Should assessment results be stored in database for historical tracking? (Probably not needed initially)
- Should assessment run automatically on new feedback? (Defer to future)
- How to handle feedback about books that don't exist yet? (Assess based on ISBN/stub page context)
