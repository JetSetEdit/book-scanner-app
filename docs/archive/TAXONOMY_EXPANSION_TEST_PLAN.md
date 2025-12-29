# Taxonomy Expansion Test Plan

## Test Books with Known Triggers

### 1. Phobias Testing

**Book: "Harry Potter and the Chamber of Secrets" (ISBN: 9780439064873)**
- **Expected:** `phobias` → `snakes` (basilisk)
- **Test:** Verify AI detects snake phobia trigger

**Book: "The Hobbit" (ISBN: 9780547928227)**
- **Expected:** `phobias` → `spiders` (Shelob scene)
- **Test:** Verify AI detects spider phobia trigger

**Book: Medical memoirs with needle scenes**
- **Expected:** `phobias` → `needles` or `medical_health` → `medical_procedures`
- **Test:** Verify AI detects medical procedure triggers

### 2. LGBTQ+ Discrimination Testing

**Book: "The Seven Husbands of Evelyn Hugo" (ISBN: 9781501139239)**
- **Expected:** Check for `lesbophobia` if present
- **Test:** Verify AI detects LGBTQ+ specific discrimination

**Book: "Red, White & Royal Blue" (ISBN: 9781250316776)**
- **Expected:** Check for `biphobia` or `queerphobia` if present
- **Test:** Verify AI detects subtle LGBTQ+ discrimination

**Book: "Felix Ever After" (ISBN: 9780062820259)**
- **Expected:** Check for `misgendering` or `transphobia`
- **Test:** Verify AI detects trans-specific issues

### 3. Medical/Health Testing

**Book: "The Handmaid's Tale" (ISBN: 9780385490818)**
- **Expected:** `medical_health` → `infertility`
- **Test:** Verify AI detects infertility as medical health issue

**Book: "The Fault in Our Stars" (ISBN: 9780525478812)**
- **Expected:** `medical_health` → `cancer`
- **Test:** Verify AI detects cancer content

### 4. Religious/Cult Testing

**Book: "The Handmaid's Tale" (ISBN: 9780385490818)**
- **Expected:** `religious_cult` → `cult_content` or `religious_trauma`
- **Test:** Verify AI detects cult dynamics

**Book: "Educated" (ISBN: 9780399590504)**
- **Expected:** `religious_cult` → `religious_trauma` or `cult_content`
- **Test:** Verify AI detects religious extremism/cult content

### 5. Police Brutality Testing

**Book: "The Hate U Give" (ISBN: 9780062498533)**
- **Expected:** `violence` → `police_brutality`
- **Test:** Verify AI detects police brutality specifically

**Book: "Just Mercy" (ISBN: 9780812994520)**
- **Expected:** `violence` → `police_brutality` or systemic violence
- **Test:** Verify AI detects state violence

### 6. Stalking/Financial Abuse Testing

**Book: Dark romance with stalking themes**
- **Expected:** `emotional_abuse_or_toxic_relationships` → `stalking`
- **Test:** Verify AI detects stalking explicitly

**Book: Books with financial control themes**
- **Expected:** `emotional_abuse_or_toxic_relationships` → `financial_abuse`
- **Test:** Verify AI detects financial abuse

### 7. Subtle Emotional Triggers Testing

**Book: "The Seven Husbands of Evelyn Hugo"**
- **Expected:** `death_or_grief` → `grief_processing`
- **Test:** Verify AI detects grief processing vs just death

**Book: Books with divorce themes**
- **Expected:** `death_or_grief` → `divorce`
- **Test:** Verify AI detects divorce/separation

## Validation Checklist

- [ ] All new categories appear in taxonomy
- [ ] All new subcategories appear in taxonomy
- [ ] AI prompt includes subtle trigger detection
- [ ] Test books generate expected warnings
- [ ] No validation errors in taxonomy structure
- [ ] Database schema supports new categories (if needed)

## Next Steps

1. Run test scans on sample books
2. Verify warnings match expected categories
3. Check for false positives/negatives
4. Refine AI prompt if needed
5. Monitor real-world usage

