# Hierarchical Taxonomy Proposal

## Current Problem
Books can have multiple warnings in the same category (e.g., "Disordered eating" and "Mental health (anxiety and stress)" both under `mental_health`). This creates duplicates and makes it harder to provide specific, granular warnings.

## Solution: Parent-Child Taxonomy Structure

### Structure Overview
- **Parent Categories**: High-level groupings (e.g., "Mental Health", "Violence", "Sexual Content")
- **Child Categories**: Specific subcategories under parents (e.g., "Disordered Eating", "Anxiety", "Depression" under "Mental Health")

### Benefits
1. **Granularity**: Multiple specific warnings can exist under one parent category
2. **Organization**: Better grouping and display for users
3. **Flexibility**: Easy to add new subcategories without changing parent structure
4. **Backward Compatibility**: Can still use parent categories for legacy support

## Proposed Taxonomy Structure

### Mental Health (parent)
- `disordered_eating` - Disordered eating, eating disorders, body image issues
- `anxiety` - Anxiety, panic attacks, stress
- `depression` - Depression, mood disorders
- `ptsd` - Post-traumatic stress disorder, trauma
- `self_harm` - Self-harm behaviors (non-suicidal)
- `suicidal_ideation` - Suicidal thoughts, attempts, detailed descriptions
- `other_mental_health` - Other mental health themes

### Sexual Content (parent)
- `explicit_sexual_content` - Explicit sexual scenes, graphic descriptions
- `sexual_violence` - Sexual assault, rape, non-consensual sexual content
- `intense_romance` - Intense romantic/sexual tension, steamy scenes
- `sexual_themes` - Sexual themes, discussions, references (non-explicit)
- `other_sexual_content` - Other sexual content

### Emotional Abuse / Toxic Relationships (parent)
- `gaslighting` - Gaslighting, psychological manipulation
- `manipulation` - Manipulative behavior, emotional manipulation
- `controlling_behavior` - Controlling relationships, possessiveness
- `toxic_friendships` - Toxic friendships, unhealthy social dynamics
- `cheating` - Infidelity, cheating in relationships
- `emotional_abuse` - Emotional abuse, verbal abuse
- `other_toxic_relationships` - Other toxic relationship dynamics

### Bullying / Social Cruelty (parent)
- `bullying` - Bullying, harassment
- `hazing` - Hazing, initiation rituals
- `public_humiliation` - Public humiliation, shaming
- `social_pressure` - Intense social pressure, peer pressure
- `other_social_cruelty` - Other forms of social cruelty

### Violence (parent)
- `physical_violence` - Physical fighting, combat, brawls
- `graphic_violence` - Graphic violence, gore, detailed violence
- `weapons` - Weapons, gun violence, knife violence
- `war` - War, military violence, battle scenes
- `domestic_violence` - Domestic violence, intimate partner violence
- `torture` - Torture, extreme violence
- `other_violence` - Other forms of violence

### Substance Use (parent)
- `alcohol` - Alcohol consumption, drinking
- `drug_use` - Drug use, drug abuse
- `addiction` - Addiction, substance dependence
- `overdose` - Overdose, drug-related medical emergencies
- `other_substance_use` - Other substance-related content

### Death / Grief (parent)
- `character_death` - Character deaths, on-page deaths
- `terminal_illness` - Terminal illness, dying characters
- `grief` - Grief, mourning, loss
- `funeral_scenes` - Funeral scenes, death rituals
- `near_death` - Near-death experiences
- `past_death` - Past deaths (discussed but not shown)
- `other_death_grief` - Other death/grief-related content

### Discrimination (parent)
- `racism` - Racism, racial discrimination
- `sexism` - Sexism, gender discrimination
- `homophobia` - Homophobia, anti-LGBTQ+ content
- `transphobia` - Transphobia, anti-trans content
- `religious_discrimination` - Religious discrimination, religious intolerance
- `ableism` - Ableism, discrimination against disabilities
- `other_discrimination` - Other forms of discrimination

### Coarse Language (parent)
- `strong_language` - Strong language, profanity
- `slurs` - Slurs, hate speech
- `other_language` - Other language-related content

### Other (parent)
- `other` - Other potentially triggering content

## Database Schema Changes

### Option 1: Add `subcategory_id` field (Recommended)
```sql
ALTER TABLE public.content_warnings
ADD COLUMN IF NOT EXISTS subcategory_id TEXT;

CREATE INDEX IF NOT EXISTS content_warnings_subcategory_id_idx 
ON public.content_warnings(subcategory_id);
```

**Pros:**
- Simple addition
- Backward compatible (existing warnings still work)
- Can query by parent (`category_id`) or child (`subcategory_id`)

**Cons:**
- Need to maintain both `category_id` and `subcategory_id`

### Option 2: Hierarchical `category_id` with dot notation
Use format: `parent.child` (e.g., `mental_health.disordered_eating`)

**Pros:**
- Single field
- Easy to parse parent/child

**Cons:**
- Requires parsing logic
- Less explicit

## Implementation Plan

### Phase 1: Taxonomy Structure
1. Update `lib/config/taxonomy.ts` with hierarchical structure
2. Add helper functions to get parent/child relationships
3. Update TypeScript types

### Phase 2: Database Migration
1. Add `subcategory_id` column to `content_warnings` table
2. Create migration script
3. Update TypeScript types in `supabase.ts`

### Phase 3: AI Agent Updates
1. Update AI prompt to use subcategories
2. Update validation schemas
3. Test with sample books

### Phase 4: UI Updates
1. Update display logic to show parent categories with child details
2. Update grouping/filtering logic
3. Update severity scoring to consider subcategories

### Phase 5: Migration of Existing Data
1. Create script to map existing warnings to subcategories
2. Run migration for existing warnings
3. Verify data integrity

## Example Usage

### Before (Current)
```json
{
  "category_id": "mental_health",
  "description": "Disordered eating"
}
{
  "category_id": "mental_health", 
  "description": "Mental health (anxiety and stress)"
}
```

### After (Hierarchical)
```json
{
  "category_id": "mental_health",
  "subcategory_id": "disordered_eating",
  "description": "Disordered eating"
}
{
  "category_id": "mental_health",
  "subcategory_id": "anxiety",
  "description": "Anxiety and stress"
}
```

## Display Logic

### Collection Page
- Group warnings by parent category
- Show subcategory labels when multiple exist
- Example: "Mental Health (Disordered Eating, Anxiety)"

### Book Detail Page
- Show parent category as section header
- List subcategories underneath
- Example:
  ```
  Mental Health
    • Disordered Eating [mild]
    • Anxiety [mild]
  ```

## Questions to Consider

1. **Should subcategories be required?** Or can warnings still use just parent categories?
   - **Recommendation**: Make subcategories optional for backward compatibility

2. **How to handle severity at subcategory level?** Same severity for all subcategories or per-subcategory?
   - **Recommendation**: Per-subcategory severity (more granular)

3. **Should we allow multiple subcategories per warning?** Or one subcategory per warning?
   - **Recommendation**: One subcategory per warning (simpler, clearer)

4. **Migration strategy**: How to map existing warnings to subcategories?
   - **Recommendation**: Use AI to analyze descriptions and suggest subcategories, with manual review





