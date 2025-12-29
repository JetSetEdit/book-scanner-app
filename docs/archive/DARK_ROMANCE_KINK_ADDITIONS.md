# Dark Romance / Kink Tags - Taxonomy v2.3.0

**Date:** January 2025  
**Based on:** User feedback on Dark Romance / Kink trends (BookTok, dark romance genre)

## Summary

Added 9 critical Dark Romance / Kink tags to address gaps in the taxonomy:
- ✅ Consent spectrum (CNC, Dub-Con, Somnophilia)
- ✅ Specific dark kinks (Breeding Kink, Knife Play, Primal Play)
- ✅ Extreme themes (Human Trafficking, Cannibalism, Grooming, Incest/Pseudo-Incest)

---

## New Additions

### 1. Sexual Content Category - Added 5 Subcategories

**Consent Spectrum:**
- ✅ `cnc` - Consensual Non-Consent (CNC) (severe)
  - **Rationale:** One of the most popular tags on BookTok, distinct from actual non-consent
  - **Description:** Consensual non-consent, CNC play, or negotiated non-consent scenarios. Distinct from actual non-consent.

- ✅ `somnophilia` - Somnophilia / Sleep Play (severe)
  - **Rationale:** Very common in "dark" college romances
  - **Description:** Non-consensual or dub-consensual sexual acts while one partner is sleeping or unconscious.

- ✅ Updated `consent_ambiguity` label to include "Dub-Con"
  - **Before:** "Ambiguous or Non-Explicit Consent"
  - **After:** "Ambiguous or Non-Explicit Consent (Dub-Con)"
  - **Rationale:** "Dub-Con" is the industry term, should be included in label

**Dark Kinks:**
- ✅ `breeding_kink` - Breeding Kink (moderate)
  - **Rationale:** Distinct from "Pregnancy" - this is sexual focus on impregnation as kink
  - **Description:** Sexual focus on impregnation, breeding, or pregnancy as kink. Distinct from actual pregnancy/childbirth.

- ✅ `knife_play` - Knife Play / Blood Play (severe)
  - **Rationale:** We have "Weapons" and "Blood" (phobia), but need a tag for when this is sexualized
  - **Description:** Sexualized use of knives, blood play, or weapon play in sexual contexts.

- ✅ `primal_play` - Primal Play (moderate)
  - **Rationale:** Hunting/chasing dynamics, often paired with "Touch Her and You Die" tropes
  - **Description:** Hunting/chasing dynamics, primal kink, or "touch her and you die" tropes in sexual/romantic contexts.

### 2. Violence Category - Added 2 Subcategories

- ✅ `human_trafficking` - Human Trafficking (severe)
  - **Rationale:** Distinct from just "Kidnapping." A major theme in dark mafia romance.
  - **Description:** Human trafficking, sex trafficking, or forced servitude. Distinct from general kidnapping.

- ✅ `cannibalism` - Cannibalism (severe)
  - **Rationale:** Surprisingly popular in the "horror romance" niche (e.g., Butcher & Blackbird)
  - **Description:** Cannibalism, eating human flesh, or cannibalistic themes.

### 3. Emotional Abuse / Toxic Relationships - Added 1 Subcategory

- ✅ `grooming` - Grooming (severe)
  - **Rationale:** Distinct from "Power Imbalance." Essential for dark age-gap books.
  - **Description:** Grooming, predatory behavior, or manipulation of vulnerable individuals (often in age-gap or power imbalance contexts).

### 4. Family Dynamics Category - Added 1 Subcategory

- ✅ `incest_taboo` - Incest / Pseudo-Incest (severe)
  - **Rationale:** "Taboo" covers this, but often readers want to know specifically if it's step-siblings vs. blood relations.
  - **Description:** Incest, pseudo-incest (step-siblings), or blood relation sexual/romantic content.

---

## Updated Statistics

**Before (v2.2.0):**
- Categories: 14
- Subcategories: 116

**After (v2.3.0):**
- Categories: 14
- Subcategories: 125

**New additions:**
- 9 new subcategories
- 1 label update (consent_ambiguity → includes "Dub-Con")

---

## AI Prompt Updates

Updated the AI prompt to detect:
- **CNC (Consensual Non-Consent)**: Negotiated non-consent scenarios
- **Dub-Con**: Ambiguous consent (industry term)
- **Somnophilia**: Sleep/unconscious sexual acts
- **Breeding Kink**: Sexual focus on impregnation
- **Knife Play / Blood Play**: Sexualized weapon/blood use
- **Primal Play**: Hunting/chasing dynamics
- **Grooming**: Predatory behavior, manipulation
- **Human Trafficking**: Distinct from kidnapping
- **Cannibalism**: Eating human flesh
- **Incest / Pseudo-Incest**: Step-siblings, blood relations

**Genre Signals Added:**
- Dark romance → check for CNC, dub-con, somnophilia, breeding kink, knife play, grooming, human trafficking
- Horror romance → check for cannibalism, extreme kinks
- Mafia romance → check for human trafficking, violence
- Age-gap romance → check for grooming, power imbalance

---

## Coverage for Dark Romance Genre

**Now covers all major Dark Romance / Kink tags:**
- ✅ CNC (Consensual Non-Consent) - **Most popular BookTok tag**
- ✅ Dub-Con (Dubious Consent) - Industry standard term
- ✅ Somnophilia - Common in dark college romances
- ✅ Breeding Kink - Distinct from pregnancy
- ✅ Knife Play / Blood Play - Sexualized violence
- ✅ Primal Play - Hunting/chasing tropes
- ✅ Grooming - Age-gap / power imbalance
- ✅ Human Trafficking - Mafia romance staple
- ✅ Cannibalism - Horror romance niche
- ✅ Incest / Pseudo-Incest - Taboo content

**The taxonomy is now comprehensive for Dark Romance content warnings!** 🎉

---

## Files Updated

1. ✅ `lib/config/taxonomy-v2.ts` - All 9 subcategories added
2. ✅ `lib/content-warning-agent.ts` - AI prompt updated with detection logic
3. ✅ `TAXONOMY.csv` - Regenerated (125 subcategories)
4. ✅ All tests passing

---

## Severity Levels

**Severe (7):**
- CNC, Somnophilia, Knife Play, Human Trafficking, Cannibalism, Grooming, Incest/Pseudo-Incest

**Moderate (2):**
- Breeding Kink, Primal Play

**Rationale:** Most dark romance/kink content is severe due to the nature of the themes, but some (breeding kink, primal play) are moderate as they're more about power dynamics than explicit harm.

---

## Ready for Production

All Dark Romance / Kink tags have been added:
- ✅ Consent spectrum covered
- ✅ Specific dark kinks included
- ✅ Extreme themes addressed
- ✅ AI prompt updated for detection
- ✅ Industry terminology used (CNC, Dub-Con)

**The taxonomy now comprehensively covers Dark Romance content warnings!** 🚀

