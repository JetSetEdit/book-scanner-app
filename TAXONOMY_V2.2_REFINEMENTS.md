# Taxonomy v2.2.0 Refinements

**Date:** January 2025  
**Based on:** User feedback and comparison with Does the Dog Die

## Summary

Implemented all suggested improvements:
- ✅ Added missing phobias (vomiting, trypophobia, dental trauma)
- ✅ Expanded discrimination (fatphobia, classism, antisemitism, islamophobia)
- ✅ Created Family Dynamics category
- ✅ Added modern anxieties (school shootings, accidents)
- ✅ Fixed categorization issues (animal death, pregnancy/childbirth)

---

## Changes Made

### 1. Phobias Category - Added 3 Subcategories

**Added:**
- `vomiting` - Vomiting / Emetophobia (mild)
- `trypophobia` - Trypophobia (mild)
- `dental_trauma` - Dental Trauma (moderate)

**Rationale:** These are highly requested warnings that are distinct from other categories.

### 2. Discrimination Category - Added 4 Subcategories

**Added:**
- `fatphobia` - Fatphobia / Body Shaming (moderate)
- `classism` - Classism / Poverty (moderate)
- `antisemitism` - Antisemitism (severe)
- `islamophobia` - Islamophobia (severe)

**Rationale:** For granularity parity with LGBTQ+ discrimination subcategories, and to address common discrimination types.

### 3. Violence Category - Added 1 Subcategory

**Added:**
- `school_shootings` - School Shootings / Mass Violence (severe)

**Rationale:** Distinct trauma trigger, especially for US audiences.

### 4. New Category: Family Dynamics

**Created new category:**
- `family_dynamics` - Family Dynamics

**Subcategories:**
- `parental_abandonment` - Parental Abandonment (moderate)
- `foster_care_adoption` - Foster Care / Adoption Trauma (moderate)
- `other_family_dynamics` - Other Family Dynamics (mild)

**Rationale:** Family-related trauma is distinct from general emotional abuse and deserves its own category.

### 5. Other Category - Added 1 Subcategory

**Added:**
- `accidents` - Car Accidents / Crashes (moderate)

**Rationale:** Common trauma trigger distinct from natural disasters.

### 6. Categorization Fixes

**Moved:**
- `animal_death` - Moved from `phobias` → `death_or_grief`
  - **Rationale:** Animal death is a grief trigger, not a phobia trigger
  
- `pregnancy_childbirth` - Moved from `death_or_grief` → `medical_health`
  - **Rationale:** Pregnancy/childbirth is a medical/health topic, not inherently about death/grief

---

## Updated Statistics

**Before (v2.1.0):**
- Categories: 13
- Subcategories: 104

**After (v2.2.0):**
- Categories: 14
- Subcategories: 116

**New additions:**
- 1 new category (Family Dynamics)
- 12 new subcategories
- 2 subcategories moved to better categories

---

## AI Prompt Updates

Updated the AI prompt to detect:
- Vomiting/emetophobia triggers
- Trypophobia patterns
- Dental trauma scenes
- Fatphobia and body shaming
- Classism and poverty depictions
- Antisemitism and Islamophobia
- School shootings and mass violence
- Parental abandonment
- Foster care/adoption trauma
- Car/plane accidents

---

## Comparison with Does the Dog Die

**Now covers:**
- ✅ Vomiting (emetophobia) - **Most requested warning**
- ✅ Animal death (moved to appropriate category)
- ✅ School shootings
- ✅ Car accidents
- ✅ Fatphobia
- ✅ Classism
- ✅ Antisemitism & Islamophobia (specific, not just "religious discrimination")
- ✅ Family abandonment
- ✅ Foster care trauma

**Remaining gaps (if any):**
- Most common triggers now covered
- Taxonomy is comprehensive for text-based content warnings

---

## Files Updated

1. **lib/config/taxonomy-v2.ts**
   - Added 12 new subcategories
   - Created Family Dynamics category
   - Moved 2 subcategories
   - Updated version to 2.2.0

2. **lib/content-warning-agent.ts**
   - Updated phobia detection
   - Enhanced discrimination detection
   - Added family dynamics detection
   - Added accident detection

3. **TAXONOMY.csv** - Regenerated with all changes

---

## Testing

✅ All tests passing
✅ Build successful
✅ No breaking changes
✅ Backward compatible

---

## Next Steps

1. Test with books that have these specific triggers
2. Monitor usage of new subcategories
3. Gather user feedback on categorization improvements
4. Consider any additional refinements based on real-world usage

---

## Conclusion

The taxonomy is now **even more comprehensive** and addresses all the gaps identified:
- ✅ Emetophobia (most requested warning)
- ✅ Specific religious discrimination (antisemitism, islamophobia)
- ✅ Body shaming distinct from eating disorders
- ✅ Family dynamics as separate category
- ✅ Modern anxieties (school shootings, accidents)
- ✅ Better categorization (animal death, pregnancy)

**Ready for production!** 🚀

