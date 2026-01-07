# Dark Romance Trope vs Trigger Distinction - Fix

## Problem Identified

**Sarah's Review of "Corrupt" by Penelope Douglas:**
- The system was using generic warnings that didn't distinguish between:
  - **Tropes** (what dark romance readers seek): CNC, protective stalking, power play dynamics
  - **Actual Triggers** (what readers avoid): Real assault, threatening stalking

**Specific Issues:**
1. **Sexual Violence**: System said "non-consensual sexual acts, including dubious consent and sexual coercion" but didn't clarify if it's CNC (trope) vs actual assault (trigger)
2. **Stalking**: System flagged "stalking behavior" but didn't distinguish protective/obsessive (trope) vs threatening (trigger)
3. **Reasoning**: Too generic - "common in Dark Romance genre" doesn't help readers know if it's what they want or need to avoid

## Solution Implemented

### 1. Enhanced AI Instructions for Dark Romance Detection

**Updated `lib/content-warning-agent.ts`:**
- Added detailed guidance on distinguishing tropes vs triggers
- **CNC vs Actual Assault**: Clear criteria for when to use `cnc` (consensual roleplay) vs `non_consensual_sexual_acts` (actual violation)
- **Stalking**: Distinction between protective/obsessive (trope) vs threatening (trigger)
- **Reasoning Requirements**: Must clarify trope context in reasoning field

**Key Changes:**
```typescript
**2. Dark Romance / Kink Detection (CRITICAL - TROPE vs TRIGGER DISTINCTION):**

**Consent Spectrum - MUST Distinguish:**
- **CNC (Consensual Non-Consent)** - Use when:
  * Negotiated beforehand, consensual roleplay, power dynamics that are part of the fantasy
  * Characters discuss boundaries, use safewords, or establish consent framework
  * **Reasoning MUST clarify**: "CNC/power play dynamics (consensual roleplay)" or "Negotiated non-consent scenarios (dark romance trope)"
  
- **Actual Sexual Assault** - Use when:
  * Actual non-consensual sexual acts that are NOT part of a consensual dynamic
  * **Reasoning MUST clarify**: "Contains depictions of actual sexual assault" or "Non-consensual sexual acts (not consensual roleplay)"

**Stalking - MUST Distinguish:**
- **Protective/Obsessive Stalking (Dark Romance Trope)** - Use when:
  * "Watching over you" protective behavior, possessive but not threatening
  * **Reasoning MUST clarify**: "Protective/obsessive stalking behavior (dark romance trope)" or "Possessive surveillance dynamics (not threatening)"
  
- **Threatening/Dangerous Stalking (Actual Trigger)** - Use when:
  * Actual threatening behavior, fear-inducing surveillance
  * **Reasoning MUST clarify**: "Threatening stalking behavior" or "Dangerous surveillance that creates fear"
```

### 2. Updated Reasoning Instructions

**Added to both GPT-4o and Gemini instructions:**
- Reasoning must clarify trope vs trigger context
- Examples of good vs bad reasoning for dark romance
- Emphasis: "Dark Romance readers need to know: Is this the trope I'm seeking, or an actual trigger I need to avoid?"

**Examples Added:**
- ✅ GOOD: "CNC/power play dynamics (consensual roleplay) - contains consensual non-consent scenarios"
- ✅ GOOD: "Protective/obsessive stalking behavior (dark romance trope) - possessive surveillance dynamics, not threatening"
- ❌ BAD: "Dubious consent common in Dark Romance genre" (doesn't clarify if it's trope or trigger)
- ❌ BAD: "Stalking behavior frequent in Enemies to Lovers" (doesn't clarify protective vs threatening)

### 3. Updated Gemini Instructions

**Updated `lib/services/multi-model-service.ts`:**
- Added same dark romance detection guidance
- Added trope vs trigger distinction rules
- Added reasoning requirements with examples

## Expected Impact

**Before:**
- Warning: "Non-consensual sexual acts, including dubious consent and sexual coercion"
- Reasoning: "Common in Dark Romance genre" ❌
- User confusion: Is this CNC (what I want) or actual assault (what I need to avoid)?

**After:**
- Warning: "Consensual Non-Consent (CNC)" or "Non-Consensual Sexual Acts"
- Reasoning: "CNC/power play dynamics (consensual roleplay) - contains consensual non-consent scenarios" ✅
- User clarity: This is the trope I'm seeking, not an actual trigger

**Before:**
- Warning: "Stalking"
- Reasoning: "Frequent in Enemies to Lovers" ❌
- User confusion: Is this protective (what I want) or threatening (what I need to avoid)?

**After:**
- Warning: "Stalking"
- Reasoning: "Protective/obsessive stalking behavior (dark romance trope) - possessive surveillance dynamics, not threatening" ✅
- User clarity: This is the trope I'm seeking, not an actual trigger

## Files Modified

1. ✅ `lib/content-warning-agent.ts` - Enhanced dark romance detection instructions
2. ✅ `lib/services/multi-model-service.ts` - Added dark romance detection to Gemini instructions
3. ✅ Reasoning instructions updated in both files

## Next Steps

1. **Test with "Corrupt" by Penelope Douglas** (ISBN: 9780349444086)
   - Verify CNC vs actual assault distinction
   - Verify protective vs threatening stalking distinction
   - Verify reasoning clarity

2. **Monitor User Feedback**
   - Track if dark romance readers find warnings more helpful
   - Check if trope vs trigger distinction is clear

3. **Consider UI Enhancements** (Future)
   - Could add a "Trope" vs "Trigger" badge to warnings
   - Could add glossary tooltips for dark romance terms

## Taxonomy Subcategories Available

The taxonomy already has the right subcategories:
- ✅ `cnc` - Consensual Non-Consent (severe)
- ✅ `consent_ambiguity` - Ambiguous or Non-Explicit Consent (Dub-Con) (severe)
- ✅ `non_consensual_sexual_acts` - Non-Consensual Sexual Acts (severe)
- ✅ `stalking` - Stalking (severe)

The issue was **not** missing subcategories, but **AI not using them correctly** and **reasoning not clarifying trope vs trigger context**.

## Summary

This fix addresses Sarah's core complaint: **The system now distinguishes between dark romance tropes (what readers seek) and actual triggers (what readers avoid)**, making warnings more useful for dark romance readers who need to know if content is the trope they want or something they need to avoid.

