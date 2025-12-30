# Sarah's Browser Test Results (Production)

**Date:** Testing as Sarah (Dark Romance Reader)  
**Book:** "Does It Hurt?" by H.D. Carlton (ISBN: 9781957635026)  
**URL:** https://subtext-books.vercel.app/book/9781957635026

## ✅ What's Working

1. **Toggle Feature Exists**
   - Dropdown shows: "Both", "Tropes Only", "Triggers Only"
   - Can successfully change selection
   - Toggle changed to "Tropes Only" successfully

2. **Disclaimer Text**
   - Shows: "Content warnings help readers make informed choices — they're not judgments about books or readers."

3. **Reasoning Popover**
   - Clicking "Reasoning" button opens popover
   - Shows AI reasoning text

## ❌ Issues (Same as Sarah's Original Feedback)

1. **Toggle Doesn't Filter**
   - Set to "Tropes Only"
   - All 3 warnings still showing:
     - Kidnapping/Confinement
     - Power Imbalance
     - Emotional Distress
   - **Expected:** Should hide warnings that are triggers (not tropes)

2. **No Context Badges**
   - No colored badges visible (purple for CNC, red for assault, pink for protective stalking)
   - **Expected:** Badges should appear above warning descriptions

3. **Generic Labels**
   - Warnings don't clarify if they're tropes or triggers
   - No distinction between "CNC/power play" vs "actual assault"

## 🔍 Analysis

### Why Filtering Might Not Work

The warnings shown (Kidnapping, Power Imbalance, Emotional Distress) are likely:
- Classified as `'other'` in context detection
- `'other'` warnings show in all modes (safety feature)
- They don't match the specific dark romance categories (CNC, stalking, etc.)

### Why Badges Don't Show

- Badges only appear if `getWarningContext()` returns a specific context (not 'other')
- These warnings probably don't match the dark romance keywords
- May need re-scan with updated AI instructions to get better descriptions

### Sarah's Specific Issue

Sarah reported "Sexual Violence" warnings showing in "Tropes Only" mode. However:
- Current view shows: Kidnapping, Power Imbalance, Emotional Distress
- No "Sexual Violence" warnings visible in this view
- May need to check if there are more warnings or if this book needs re-scanning

## 📋 Recommendations

1. **Re-scan the book** with updated AI instructions to get:
   - Better descriptions that clarify trope vs trigger
   - Proper subcategory IDs (cnc, consent_ambiguity, sexual_violence)
   - Descriptions that match context detection keywords

2. **Test with a book that has "Sexual Violence" warnings** to verify filtering works

3. **Check database** to see what warnings this book actually has and their subcategory_ids

## 🎯 Expected Behavior After Fix

**"Tropes Only" Mode:**
- ✅ Shows: CNC, Dub-Con (Trope), Protective Stalking
- ❌ Hides: Sexual Violence, Actual Assault, Predatory Stalking

**"Triggers Only" Mode:**
- ✅ Shows: Sexual Violence, Actual Assault, Predatory Stalking
- ❌ Hides: CNC, Dub-Con (Trope), Protective Stalking

