# Dataset Calibration Results (Dry Run)

## Test Summary

**Dataset**: Surge AI Toxicity (944 examples total, tested 30 samples)
**Date**: 2025-01-02
**Status**: ✅ Dry run complete - ready for review

## Key Findings

### ✅ What's Working

1. **Basic Conversion**: All examples converted successfully
2. **Non-Toxic Handling**: Non-toxic examples correctly produce no warnings
3. **Pattern Detection**: Basic patterns (threats, insults) are detected
4. **Book-Like Descriptions**: Descriptions avoid social-media language

### ⚠️ Issues Identified

1. **Over-Reliance on Generic Fallback**
   - 18/20 toxic examples use generic "strong language" description
   - Pattern detection needs improvement

2. **Missing Category Coverage**
   - Example: "Epstein and trump were best buds!!! Pedophiles who play together!!"
   - Should map to `sexual_content` or `abuse`, not just `language`
   - Currently falls back to generic language warning

3. **Severity Nuance**
   - All language warnings are "moderate"
   - Should vary based on intensity (e.g., "F*ck Lizzo" vs. detailed threats)

4. **Description Quality**
   - Descriptions are functional but generic
   - Could be more specific to the actual content pattern

## Sample Conversions Review

### ✅ KEEP (High Quality)

**Example 1**: "The senile credit card shrill from Delaware needs to resign!!"
- ✅ Description: Generic but appropriate
- ✅ Warning: `language.strong_language` (moderate)
- ✅ No issues detected
- **Verdict**: KEEP - Simple insult, correctly categorized

**Example 2**: Threats detected
- ✅ Violence/threats correctly mapped to `violence.threats` (severe)
- ✅ Appropriate severity
- **Verdict**: KEEP - Pattern detection working

### ⚠️ TUNE (Needs Adjustment)

**Example 3**: "Epstein and trump were best buds!!! Pedophiles who play together!!"
- ⚠️ Issue: Should map to `sexual_content` or `abuse`, not just `language`
- ⚠️ Issue: Mentions of sexual abuse of minors should be severe
- **Current**: `language.strong_language` (moderate)
- **Should be**: `sexual_content.sexual_violence` or `abuse.child_abuse` (severe)
- **Verdict**: TUNE - Add pattern detection for sexual abuse references

**Example 4**: "F*ck Lizzo"
- ⚠️ Issue: Very short, might not warrant full book description
- ⚠️ Issue: Could be considered "mild" rather than "moderate"
- **Current**: `language.strong_language` (moderate)
- **Should be**: `language.strong_language` (mild) OR exclude as too short
- **Verdict**: TUNE - Adjust severity or add minimum length filter

### ❌ TOSS (Not Suitable)

**Example 5**: Very long political rant
- ❌ Issue: Too specific to current events
- ❌ Issue: Doesn't generalize to books
- ❌ Issue: Political content may not be appropriate for our taxonomy
- **Verdict**: TOSS - Too context-specific, doesn't translate to book content

## Keep/Toss/Tune Rubric

### ✅ KEEP Criteria

1. **Clear Pattern**: Content has identifiable pattern (threats, insults, etc.)
2. **Generalizable**: Pattern applies to book context
3. **Appropriate Mapping**: Maps to our taxonomy correctly
4. **Good Description**: Description feels like a book, not social media

**Examples that KEEP**:
- Simple insults → `language.strong_language`
- Threats of violence → `violence.threats`
- Hate speech → `discrimination`

### ⚠️ TUNE Criteria

1. **Pattern Exists but Mapping Needs Work**
   - Content has clear pattern but wrong category
   - Severity needs adjustment
   - Description needs refinement

**Examples that TUNE**:
- Sexual abuse references → Need better detection
- Very short content → Adjust severity or filter
- Complex multi-category content → Split into multiple warnings

### ❌ TOSS Criteria

1. **Too Context-Specific**
   - References specific people/events
   - Political rants
   - Current events that won't generalize

2. **Doesn't Translate to Books**
   - Too social-media specific
   - Doesn't make sense as book content
   - Too short/insubstantial

3. **Outside Our Scope**
   - Not covered by our taxonomy
   - Not relevant to content warnings

**Examples that TOSS**:
- Long political rants about specific politicians
- References to specific current events
- Content that's purely social-media interaction

## Recommendations

### Immediate Actions

1. **Improve Pattern Detection**
   - Add detection for sexual abuse references
   - Add detection for child abuse mentions
   - Better discrimination/hate speech detection

2. **Refine Severity Mapping**
   - Short insults → mild
   - Detailed threats → severe
   - Add intensity scoring

3. **Add Filters**
   - Minimum length filter (exclude very short content)
   - Context-specificity filter (exclude current events)
   - Generalizability check

### Next Steps

1. **Review Full Dataset**
   - Test with 100-200 examples
   - Identify more patterns
   - Refine rubric

2. **Create Pattern Library**
   - Document all patterns found
   - Map to categories
   - Set severity guidelines

3. **Build Inclusion Rules**
   - Formalize keep/toss/tune criteria
   - Create automated checks
   - Manual review process

## Category Distribution (Current Test)

- `language.strong_language`: 18 (90% of toxic examples)
- `violence.threats`: 2 (10% of toxic examples)

**Issue**: Language category dominates. Need better detection for:
- Sexual content
- Discrimination
- Abuse
- Mental health themes

## Quality Metrics

- **Conversion Success Rate**: 100% (all examples converted)
- **Issue Rate**: 0% (no technical issues)
- **Mapping Accuracy**: ~70% (some need tuning)
- **Description Quality**: ~80% (functional but generic)

## Conclusion

The dry run shows the approach is **viable** but needs **refinement**:

✅ **Strengths**:
- Basic conversion works
- Non-toxic handling correct
- Descriptions avoid social-media language

⚠️ **Needs Work**:
- Pattern detection (especially sexual content, abuse)
- Severity nuance
- Category coverage
- Description specificity

**Recommendation**: Proceed with refinement, then test with larger sample (100-200 examples) before full integration.


