# Sarah's Feedback - Fixes Applied

## Issues Reported

1. **Toggle doesn't filter** - Setting to "Tropes Only" still shows ALL warnings including "Sexual Violence"
2. **NO Context Badges** - Expected colored badges (purple for CNC, red for assault, pink for protective stalking) are completely missing
3. **Generic Labels** - Still says "Sexual Violence" without clarifying if it's CNC/power play (trope) or actual assault (trigger)

## Root Cause

The context detection function (`getWarningContext`) was:
- Not prioritizing `subcategory_id` (most reliable indicator)
- Returning 'other' for most warnings because existing warnings have generic descriptions
- Not properly classifying `sexual_violence` subcategory as a trigger (not a trope)

## Fixes Applied

### 1. Improved Context Detection (`lib/utils/dark-romance-context.ts`)

**Priority Order:**
1. **Subcategory ID** (most reliable) → Check first
2. **Description keywords** → Fallback if subcategory doesn't match
3. **'other'** → Only if we truly can't determine

**Key Changes:**
- `sexual_violence` subcategory → Classified as `actual-assault` (trigger) by default
- `cnc` subcategory → Classified as `cnc-fantasy` (trope)
- `consent_ambiguity` subcategory → Classified as `dub-con-trope` (trope) by default
- Generic "sexual violence" in description → Classified as `actual-assault` (trigger) unless explicitly described as CNC/roleplay

**Example:**
```typescript
// Before: Returns 'other' for generic "sexual violence" warning
// After: Returns 'actual-assault' (trigger) → Won't show in "Tropes Only" mode
if (subcatLower === 'sexual_violence') {
  return 'actual-assault' // Trigger, not trope
}
```

### 2. Fixed Filtering Logic

**Before:**
- 'other' context warnings showed in all modes (correct for safety)
- But warnings that SHOULD be classified weren't being classified properly

**After:**
- Warnings with `subcategory_id = 'sexual_violence'` are now classified as `actual-assault` (trigger)
- When filtering for "Tropes Only", these warnings are correctly hidden
- When filtering for "Triggers Only", these warnings are correctly shown

### 3. Badge Display

Badges ARE implemented in the code (`components/content-warnings-list.tsx` lines 310-328), but they only show if:
- `getWarningContext()` returns a context other than 'other'
- `getContextInfo(context).label` is not empty

**Why badges might not show:**
- Existing warnings in database have generic descriptions
- Context detection returns 'other' because description doesn't match keywords
- **Solution:** Re-scan books with new AI instructions to get better descriptions

## Testing

To verify the fixes work:

1. **Test with existing book** (e.g., "Does It Hurt?" - ISBN 9781957635026):
   - Set toggle to "Tropes Only"
   - "Sexual Violence" warnings should NOT appear (they're triggers, not tropes)
   - Set toggle to "Triggers Only"
   - "Sexual Violence" warnings SHOULD appear

2. **Test with newly scanned book**:
   - Scan a dark romance book with the new AI instructions
   - Descriptions should clarify trope vs trigger
   - Badges should appear based on context detection

## Next Steps

1. **Re-scan existing books** to get better descriptions with trope/trigger context
2. **Verify badges appear** for newly scanned books
3. **Monitor user feedback** to ensure filtering works as expected

## Expected Behavior After Fix

**"Tropes Only" Mode:**
- ✅ Shows: CNC, Dub-Con (Trope), Protective Stalking
- ❌ Hides: Sexual Violence, Actual Assault, Predatory Stalking

**"Triggers Only" Mode:**
- ✅ Shows: Sexual Violence, Actual Assault, Predatory Stalking
- ❌ Hides: CNC, Dub-Con (Trope), Protective Stalking

**"Both" Mode:**
- ✅ Shows: All warnings (default)

