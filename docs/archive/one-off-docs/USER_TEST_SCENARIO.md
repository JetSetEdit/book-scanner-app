# Real User Test Scenario: Dark Romance Reader Testing New Features

## Test User Profile
**Name:** Sarah (Dark Romance Reader)  
**Goal:** Find books with CNC/power play dynamics but avoid actual sexual assault scenes  
**Current Concern:** Previous warnings were too generic - couldn't tell if content was the trope she seeks or a trigger she needs to avoid

---

## Test Scenario 1: "Corrupt" by Penelope Douglas

### Step 1: Navigate to Site
1. Open browser → Go to `https://subtext-books.vercel.app`
2. Click "Scan" button in navigation
3. See the scan page with ISBN input field

### Step 2: Scan the Book
1. Enter ISBN: `9780349444086` (Corrupt by Penelope Douglas)
2. Click "Scan" or press Enter
3. Wait for multi-model analysis to complete (should see progress updates)
4. Page redirects to book details page

### Step 3: Check Content Warnings Section
**What Sarah Should See:**

1. **"Content Analysis" Heading**
   - Should see the disclaimer: "Content warnings help readers make informed choices — they're not judgments about books or readers."

2. **Trope vs Trigger Toggle** (NEW!)
   - Should see a dropdown selector: "Show Warnings For:"
   - Options: "Both" | "Tropes Only" | "Triggers Only"
   - Default should be "Both"
   - Below it, explanation text:
     - "Tropes: CNC, protective stalking, power play dynamics (what dark romance readers seek)"
     - "Triggers: Actual assault, predatory stalking, real trauma (what readers need to avoid)"

3. **Content Warnings with Context Badges** (NEW!)
   - Look for warnings about sexual content
   - **Should see a colored badge above the description:**
     - If it's CNC: Purple badge saying "CNC/Fantasy Power Play"
     - If it's actual assault: Red badge saying "Sexual Assault/Real Non-Consent"
     - If it's dub-con: Indigo badge saying "Dub-Con (Trope)"
   
4. **Check Description Quality**
   - **Good description should say something like:**
     - "Contains dubious consent scenes where power dynamics blur consent (common in dark romance). Framed as fantasy/power play within the relationship, not traumatic assault."
   - **Bad description (should NOT see):**
     - "Non-consensual sexual acts, including dubious consent and sexual coercion" (too generic)

5. **Check Stalking Warning**
   - If there's a stalking warning, should see:
     - Pink badge: "Protective Stalking/Obsession" OR
     - Red badge: "Predatory Stalking"
   - Description should clarify: "Protective/obsessive stalking behavior where the MMC watches from afar, framed as protective/romantic (dark romance trope), not threatening."

### Step 4: Test the Toggle
1. **Set to "Tropes Only"**
   - Should only see warnings with purple/pink/indigo badges (CNC, protective stalking, dub-con tropes)
   - Should NOT see red badges (actual assault, predatory stalking)
   - This shows Sarah only the content she's seeking

2. **Set to "Triggers Only"**
   - Should only see warnings with red badges (actual assault, predatory stalking)
   - Should NOT see purple/pink/indigo badges
   - This shows Sarah only what she needs to avoid

3. **Set back to "Both"**
   - Should see all warnings again
   - This is the default view

### Step 5: Verify No False Positives
- **Animal Death:** Should NOT appear (Sarah's instant-refund trigger)
- **Cheating:** Should NOT appear (Sarah's hard boundary)
- If these appear, that's a problem

---

## Test Scenario 2: "Does It Hurt?" by H.D. Carlton

### Step 1: Scan Another Dark Romance
1. Go back to scan page
2. Enter ISBN: `9781957635026` (Does It Hurt?)
3. Scan the book

### Step 2: Check Warnings
**What Sarah Should See:**

1. **Sexual Content Warning**
   - Should have a badge (CNC/Fantasy or Actual Assault)
   - Description should clarify if it's within the relationship dynamic or actual assault
   - Should NOT just say "sexual violence" generically

2. **Stalking Warning (if present)**
   - Should have protective vs predatory distinction
   - Should clarify if it's romantic/protective or threatening

3. **Reasoning Link**
   - Click "Reasoning" button
   - Should see source citations (not generalizations)
   - Should NOT see: "Given the high likelihood..." or "Author is known for..."

---

## Test Scenario 3: Verify Toggle Persists

1. Set toggle to "Tropes Only" on one book
2. Navigate to another book page
3. **Expected:** Toggle should remember the preference (stored in localStorage)
4. **If it resets:** Preference isn't persisting (bug)

---

## Success Criteria

### ✅ PASS if:
- [ ] Context badges appear on relevant warnings
- [ ] Descriptions answer: "Is this within the couple's dynamic or actual assault?"
- [ ] Descriptions answer: "Is it fantasy/power play or actual trauma?"
- [ ] Stalking warnings clarify: "Protective or threatening?"
- [ ] Toggle filters warnings correctly (Tropes Only shows only tropes, etc.)
- [ ] Toggle preference persists across page navigations
- [ ] No animal death or cheating warnings (Sarah's hard boundaries)
- [ ] Reasoning cites sources, not generalizations

### ❌ FAIL if:
- [ ] No context badges appear
- [ ] Descriptions are generic ("non-consensual sexual acts" without context)
- [ ] Toggle doesn't filter warnings
- [ ] Toggle resets on page navigation
- [ ] False positives (animal death, cheating) appear
- [ ] Reasoning generalizes ("Author is known for...")

---

## Real User Experience Flow

**Sarah's Mental Model:**
1. "I want to read dark romance with CNC and protective stalking"
2. "But I need to avoid actual sexual assault scenes"
3. "The old warnings didn't help - they were too generic"
4. "Now I can see badges that tell me immediately: is this what I want or what I need to avoid?"
5. "I can filter to only see tropes, so I know what I'm getting into"
6. "The descriptions actually answer my questions now"

**What Makes This Better:**
- **Before:** "Non-consensual sexual acts" → Sarah doesn't know if it's CNC (wants) or assault (avoids)
- **After:** Badge says "CNC/Fantasy Power Play" + description clarifies "framed as fantasy/power play within the relationship" → Sarah knows this is what she's seeking

---

## Notes for Testing

- Test on **production URL** (not localhost) to verify deployment
- Test with **real dark romance books** that Sarah mentioned
- Verify **badges appear correctly** (colors, labels)
- Verify **toggle works** (filters warnings as expected)
- Check **mobile view** (toggle should work on mobile too)
- Verify **no console errors** (open DevTools)

---

## Expected User Feedback

**If working correctly, Sarah should say:**
- "Finally! I can see if it's CNC or actual assault"
- "The badges make it so clear - I don't have to read the whole description"
- "The toggle is perfect - I can filter to only see tropes I'm seeking"
- "The descriptions actually answer my questions now"

**If not working, Sarah might say:**
- "Still too generic - doesn't tell me if it's CNC or assault"
- "Badges aren't showing up"
- "Toggle doesn't do anything"
- "Same problem as before"

