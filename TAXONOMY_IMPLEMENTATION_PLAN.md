# Taxonomy Implementation Plan - Feedback Response

**Based on:** User feedback on taxonomy implementation requirements

---

## Current State Analysis

### ✅ Already Implemented
1. **Database Schema:**
   - `category_id` and `subcategory_id` fields exist
   - `severity`, `reasoning`, `source_url` fields exist
   - `is_author_approved`, `source` fields exist

2. **Taxonomy Structure:**
   - TypeScript-based taxonomy (`taxonomy-v2.ts`)
   - 14 categories, 125 subcategories
   - Helper functions: `getCategoryById`, `getSubcategoryById`

3. **UI Components:**
   - `ContentWarningsList` component exists
   - Shows warnings with severity, category, subcategory
   - Has reasoning popover (but needs improvement)

### ❌ Needs Implementation

1. **Taxonomy as Source of Truth:**
   - Currently TypeScript, feedback suggests CSV
   - Need validation that `subcategory_id` exists in taxonomy

2. **Data Model:**
   - Current schema doesn't match suggested structure exactly
   - Missing: `notes`, `evidence` array, `confidence` field

3. **UI Requirements:**
   - No "Quick Check" (Parent Mode) vs "Reader Mode" toggle
   - No sorting by severity/category
   - No "highest severity" summary

4. **Copy Guardrails:**
   - No disclaimer text about content warnings

5. **Reasoning Link:**
   - Exists but may not be reliable/consistent

6. **ISBN Scanning:**
   - Need timeouts, error handling, fallback paths

7. **Admin Workflow:**
   - No admin UI for managing warnings

---

## Implementation Priority

### Phase 1: Critical (Before Launch)
1. ✅ Add disclaimer text
2. ✅ Validate subcategory_id against taxonomy
3. ✅ Improve reasoning link reliability
4. ✅ Add ISBN scanning timeouts/fallbacks

### Phase 2: Important (Post-Launch)
5. Add two display modes (Quick Check / Reader Mode)
6. Add sorting functionality
7. Add "highest severity" summary

### Phase 3: Nice to Have
8. Update data model to match suggested structure
9. Add admin UI
10. Load taxonomy from CSV (or keep TypeScript but ensure it's source of truth)

---

## Implementation Details

### 1. Disclaimer Text
**Location:** Near "Content Analysis" heading in `components/book-details.tsx`

**Text:**
> "Content warnings help readers make informed choices — they're not judgments about books or readers."

### 2. Subcategory Validation
**Location:** API endpoints that save warnings

**Action:** Validate `subcategory_id` exists in taxonomy before saving

### 3. Reasoning Link
**Location:** `components/content-warnings-list.tsx`

**Action:** Ensure reasoning always shows sources/justification, or "No source notes added yet."

### 4. ISBN Scanning Hardening
**Location:** `lib/services/scan-service.ts` and `app/api/scan-isbn/route.ts`

**Actions:**
- Add timeouts
- Add visible error messages
- Add "Skip metadata / create book anyway" path
- Add cached lookups

### 5. Two Display Modes
**Location:** `components/content-warnings-list.tsx`

**Actions:**
- Add mode toggle (Quick Check / Reader Mode)
- Quick Check: Show only top-level categories with highest severity
- Reader Mode: Show expanded subcategories with descriptions

### 6. Sorting & Summary
**Location:** `components/content-warnings-list.tsx`

**Actions:**
- Add sort by severity (severe → mild)
- Add sort by category A–Z
- Show "Highest severity: Severe" summary

### 7. Data Model Update
**Location:** Database migration + API endpoints

**Actions:**
- Add `notes` field (optional short summary)
- Add `evidence` JSONB field (array of sources)
- Ensure `confidence` field exists (currently `confidence_score`)

### 8. Admin UI
**Location:** New admin page or component

**Actions:**
- Add/remove subcategories via dropdown
- Override severity per book
- Add notes
- Add evidence links
- Mark source (author/publisher vs AI/community)

---

## Acceptance Criteria

- [ ] Every warning rendered maps to a taxonomy subcategory
- [ ] Parent Mode usable in ~3 seconds per book
- [ ] Reasoning never leads to dead end
- [ ] Manual ISBN entry never spins forever
- [ ] Disclaimer text visible
- [ ] Subcategory validation on save
- [ ] Two display modes work correctly

---

## Next Steps

1. Start with Phase 1 (Critical items)
2. Test thoroughly
3. Move to Phase 2
4. Consider Phase 3 based on user feedback

