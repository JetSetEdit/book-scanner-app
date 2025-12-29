# Taxonomy Implementation Status

**Based on:** User feedback on taxonomy implementation requirements

---

## ✅ Completed (Phase 1 - Critical)

### 1. Disclaimer Text
**Status:** ✅ **COMPLETE**
- Added disclaimer near "Content Analysis" heading
- Text: "Content warnings help readers make informed choices — they're not judgments about books or readers."
- Location: `components/book-details.tsx`

### 2. Subcategory Validation
**Status:** ✅ **COMPLETE**
- Added `validateSubcategory()` function to `lib/config/taxonomy-v2.ts`
- Added validation in `lib/services/scan-service.ts` when saving warnings
- Invalid subcategory_ids are logged and skipped (subcategory set to null)
- Prevents invalid data from being saved

### 3. Reasoning Link Reliability
**Status:** ✅ **COMPLETE**
- Improved reasoning popover to always show sources/justification
- Shows "No source notes added yet." if neither reasoning nor source_url exists
- Works for both AI and verified warnings
- Location: `components/content-warnings-list.tsx`

---

## 🚧 In Progress / Next Steps

### 4. Two Display Modes (Quick Check / Reader Mode)
**Status:** 🚧 **TODO**
- Need to add mode toggle
- Quick Check: Show only top-level categories with highest severity
- Reader Mode: Show expanded subcategories with descriptions
- Location: `components/content-warnings-list.tsx`

### 5. Sorting Functionality
**Status:** 🚧 **TODO**
- Sort by severity (severe → mild)
- Sort by category A–Z
- Location: `components/content-warnings-list.tsx`

### 6. Highest Severity Summary
**Status:** 🚧 **TODO**
- Show "Highest severity: Severe" (or 2–3 most severe categories)
- Location: `components/content-warnings-list.tsx`

### 7. ISBN Scanning Hardening
**Status:** 🚧 **TODO**
- Add timeouts to external API calls
- Add visible error messages
- Add "Skip metadata / create book anyway" path
- Add cached lookups
- Location: `lib/services/scan-service.ts`, `app/api/scan-isbn/route.ts`

---

## 📋 Future (Phase 2 & 3)

### 8. Data Model Update
**Status:** 📋 **FUTURE**
- Add `notes` field (optional short summary)
- Add `evidence` JSONB field (array of sources)
- Ensure `confidence` field exists (currently `confidence_score`)

### 9. Admin UI
**Status:** 📋 **FUTURE**
- Add/remove subcategories via dropdown
- Override severity per book
- Add notes
- Add evidence links
- Mark source (author/publisher vs AI/community)

### 10. Taxonomy as CSV Source of Truth
**Status:** 📋 **FUTURE**
- Currently TypeScript-based (works fine)
- Could migrate to CSV loading if needed
- Current approach is valid - TypeScript provides type safety

---

## Acceptance Criteria Status

- [x] Disclaimer text visible
- [x] Subcategory validation on save
- [x] Reasoning never leads to dead end
- [ ] Every warning rendered maps to a taxonomy subcategory (needs verification)
- [ ] Parent Mode usable in ~3 seconds per book (needs implementation)
- [ ] Manual ISBN entry never spins forever (needs timeout implementation)

---

## Files Modified

1. ✅ `components/book-details.tsx` - Added disclaimer
2. ✅ `components/content-warnings-list.tsx` - Improved reasoning link
3. ✅ `lib/config/taxonomy-v2.ts` - Added validation functions
4. ✅ `lib/services/scan-service.ts` - Added validation on save

---

## Next Priority

1. **Two Display Modes** - High impact for user experience
2. **Sorting & Summary** - Improves usability
3. **ISBN Scanning Hardening** - Prevents user frustration

---

## Notes

- Current implementation is production-ready for basic use
- Phase 1 critical items are complete
- Phase 2 items (display modes, sorting) are nice-to-have but not blocking
- Phase 3 items (admin UI, data model updates) can be added based on user feedback

