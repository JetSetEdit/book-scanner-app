## 1. Create feedback assessment script

- [ ] 1.1 Create `scripts/assess-feedback.ts` with basic structure
- [ ] 1.2 Implement function to fetch feedback entry with full context
- [ ] 1.3 Implement function to fetch related audit logs for book
- [ ] 1.4 Implement function to fetch book metadata and warnings
- [ ] 1.5 Implement function to check for related manual_handling_scans entries
- [ ] 1.6 Add command-line arguments (feedback ID, ISBN, status filter)

## 2. Implement root cause detection

- [ ] 2.1 Implement "Thin metadata" detection (description length, missing cover)
- [ ] 2.2 Implement "Rate limit" detection (check manual_handling_scans for rate_limit_exceeded)
- [ ] 2.3 Implement "Analysis error" detection (check manual_handling_scans for analysis_failed)
- [ ] 2.4 Implement "False negative" detection (no_warnings + user complaint + metadata quality)
- [ ] 2.5 Implement "Missing analysis" detection (no audit log exists)
- [ ] 2.6 Implement "Metadata mismatch" detection (ISBN/title mismatch)
- [ ] 2.7 Implement "Unknown" fallback for unclassifiable cases

## 3. Add confidence levels and evidence

- [ ] 3.1 Assign confidence levels based on evidence quality
- [ ] 3.2 Collect evidence strings for each assessment
- [ ] 3.3 Format assessment output with confidence and evidence
- [ ] 3.4 Test confidence assignment logic

## 4. Generate actionable recommendations

- [ ] 4.1 Create recommendation mapping (root cause → action)
- [ ] 4.2 Include specific commands/URLs in recommendations
- [ ] 4.3 Format recommendations clearly in output
- [ ] 4.4 Test recommendation accuracy

## 5. Pattern detection

- [ ] 5.1 Implement function to group feedback by root cause
- [ ] 5.2 Implement function to detect patterns (e.g., "3 books with thin metadata")
- [ ] 5.3 Add summary statistics to assessment output
- [ ] 5.4 Test pattern detection logic

## 6. Integration and testing

- [ ] 6.1 Test assessment on real feedback entries
- [ ] 6.2 Test edge cases (missing data, ambiguous signals)
- [ ] 6.3 Validate root cause accuracy against known issues
- [ ] 6.4 Add error handling for database query failures
- [ ] 6.5 Document usage in feedback retrieval docs

## 7. Optional: Enhance view-feedback script

- [ ] 7.1 Add `--assess` flag to `view-feedback.ts`
- [ ] 7.2 Display assessment results inline with feedback
- [ ] 7.3 Test integration
- [ ] 7.4 Update documentation
