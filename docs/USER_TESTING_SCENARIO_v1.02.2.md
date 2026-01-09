# User Testing Scenario - v1.03.0 Updates

**Date:** 2026-01-09  
**Version:** 1.03.0  
**Tester:** _______________  
**Environment:** Production (subtextscanner.com.au)

## Overview

This testing scenario covers the new features and improvements in v1.02.2:
- Enhanced feedback system with context prefilling
- State-based support resources
- Quick Exit button for sensitive content
- Expanded support resources (LGBTIQA+, substance use, grief, bullying, racism)

---

## Pre-Testing Setup

- [ ] Clear browser cache and cookies
- [ ] Hard refresh the page (Cmd+Shift+R / Ctrl+Shift+R)
- [ ] Verify you're on the production site: `subtextscanner.com.au`
- [ ] Check browser console for errors (F12 → Console tab)
- [ ] Note your location/state (for state-based services testing)

---

## Test Scenario 1: Feedback System - Context Prefilling

### Objective
Test that feedback forms automatically prefill with book context and smart type detection.

### Steps

1. **Navigate to a book page**
   - [ ] Go to `/book/9781501139239` (The Seven Husbands of Evelyn Hugo)
   - [ ] Verify book page loads correctly
   - [ ] Note: This book has content warnings

2. **Test "Found an error? Report this book" button**
   - [ ] Click the "Found an error? Report this book" button
   - [ ] **Check:** Feedback dialog opens
   - [ ] **Check:** Feedback type is pre-selected as "Content Issue (Wrong/Missing Warnings)"
   - [ ] **Check:** Message field is prefilled with:
     - Book title and author
     - ISBN
     - Current warnings count
     - "Issue with content warnings:" prompt
   - [ ] **Check:** All book context is visible in the prefilled message

3. **Test feedback type change**
   - [ ] Change feedback type to "Book Metadata Issue"
   - [ ] **Check:** Message updates to show metadata-specific prompt
   - [ ] **Check:** Book information remains in the message

4. **Submit feedback**
   - [ ] Add additional details to the message
   - [ ] Optionally add email
   - [ ] Click "Submit"
   - [ ] **Check:** Success toast appears
   - [ ] **Check:** Dialog closes
   - [ ] **Check:** Form resets

5. **Test from different pages**
   - [ ] Go to `/scan` page
   - [ ] Click "Feedback" in footer
   - [ ] **Check:** Feedback type defaults to "Performance Issue (Slow Scan/Loading)"
   - [ ] Go to `/collection` page
   - [ ] Click "Feedback" in footer
   - [ ] **Check:** Feedback type defaults to "Data Quality Issue"
   - [ ] Go to home page (`/`)
   - [ ] Click "Feedback" in footer
   - [ ] **Check:** Feedback type defaults to "General Feedback"

### Expected Results
- ✅ Feedback type auto-detects based on page
- ✅ Book context is automatically prefilled on book pages
- ✅ Message updates when feedback type changes
- ✅ All context data is captured and stored

---

## Test Scenario 2: State-Based Support Resources

### Objective
Test that support resources show state-specific services based on user location.

### Steps

1. **Check current location detection**
   - [ ] Open browser console (F12)
   - [ ] Navigate to a book with sensitive content warnings
   - [ ] Look for network request to `/api/user-location`
   - [ ] **Check:** Request returns your state (NSW, VIC, QLD, etc.)

2. **Test state-specific services display**
   - [ ] Go to a book with domestic violence or abuse warnings
   - [ ] Scroll to "Support Resources" section
   - [ ] **Check:** State-specific services appear first (if state detected)
   - [ ] **Check:** Shows "(STATE services available)" indicator
   - [ ] **Check:** National services appear after state services

3. **Test different service categories**
   - [ ] Find a book with mental health warnings
   - [ ] **Check:** State mental health services appear (if available)
   - [ ] Find a book with LGBTIQA+ discrimination warnings
   - [ ] **Check:** State LGBTIQA+ services appear (if available)
   - [ ] Find a book with substance use warnings
   - [ ] **Check:** State substance use services appear (if available)

4. **Test fallback behavior**
   - [ ] If state detection fails, **Check:** Only national services show
   - [ ] **Check:** No errors in console
   - [ ] **Check:** Support resources section still displays correctly

### Expected Results
- ✅ State is detected from IP geolocation
- ✅ State-specific services appear when available
- ✅ National services always available as fallback
- ✅ Services are organized by category

---

## Test Scenario 3: Quick Exit Button

### Objective
Test the Quick Exit button appears for sensitive content and works correctly.

### Steps

1. **Test button visibility**
   - [ ] Go to a book with domestic violence warnings
   - [ ] **Check:** Floating "Quick Exit" button appears in top-right corner
   - [ ] **Check:** Inline "Quick Exit" button appears in support resources section
   - [ ] Go to a book with sexual assault warnings
   - [ ] **Check:** Quick Exit buttons appear
   - [ ] Go to a book with only mild content warnings (no abuse/violence)
   - [ ] **Check:** Quick Exit buttons do NOT appear

2. **Test button functionality**
   - [ ] On a book with sensitive content, click the floating "Quick Exit" button
   - [ ] **Check:** Immediately redirects to google.com
   - [ ] **Check:** No confirmation dialog
   - [ ] **Check:** Browser history shows google.com (not the book page)

3. **Test keyboard shortcut**
   - [ ] Go back to a book with sensitive content
   - [ ] Press the Escape key
   - [ ] **Check:** Immediately redirects to google.com
   - [ ] **Check:** Works without clicking anything

4. **Test button styling**
   - [ ] **Check:** Floating button is red/destructive color
   - [ ] **Check:** Button has shadow and is easily visible
   - [ ] **Check:** Button has logout icon
   - [ ] **Check:** Button text is "Quick Exit"

### Expected Results
- ✅ Quick Exit appears only for abuse/violence/sexual assault content
- ✅ Button redirects immediately to google.com
- ✅ Escape key works as shortcut
- ✅ Button is visually prominent and accessible

---

## Test Scenario 4: Enhanced Support Resources

### Objective
Test that all new support resource categories appear correctly.

### Steps

1. **Test Mental Health Resources**
   - [ ] Find a book with suicide, depression, or anxiety warnings
   - [ ] **Check:** "Mental Health & Crisis Support" section appears
   - [ ] **Check:** Shows: Lifeline, Beyond Blue, Kids Helpline, MensLine
   - [ ] **Check:** State-specific mental health services appear (if state detected)

2. **Test Domestic Violence Resources**
   - [ ] Find a book with domestic violence or abuse warnings
   - [ ] **Check:** "Domestic Violence & Sexual Assault" section appears
   - [ ] **Check:** Shows: 1800RESPECT, DVConnect, Safe Steps
   - [ ] **Check:** State-specific DV services appear (if state detected)

3. **Test LGBTIQA+ Resources**
   - [ ] Find a book with queerphobia, homophobia, or transphobia warnings
   - [ ] **Check:** "LGBTIQA+ Support" section appears
   - [ ] **Check:** Shows: QLife, Minus18, Switchboard, TransHub
   - [ ] **Check:** State-specific LGBTIQA+ services appear (if state detected)

4. **Test Substance Use Resources**
   - [ ] Find a book with drug/alcohol/addiction warnings
   - [ ] **Check:** "Substance Use & Addiction" section appears
   - [ ] **Check:** Shows: Alcohol & Drug Foundation, DirectLine, Counselling Online
   - [ ] **Check:** State-specific substance use services appear (if state detected)

5. **Test Grief Resources**
   - [ ] Find a book with death, grief, or terminal illness warnings
   - [ ] **Check:** "Grief & Bereavement" section appears
   - [ ] **Check:** Shows: GriefLine, Australian Centre for Grief, Lifeline

6. **Test Bullying Resources**
   - [ ] Find a book with bullying or hazing warnings
   - [ ] **Check:** "Bullying Support" section appears
   - [ ] **Check:** Shows: Kids Helpline, eSafety, Bullying No Way

7. **Test Racism Resources**
   - [ ] Find a book with racism, antisemitism, or islamophobia warnings
   - [ ] **Check:** "Racism & Discrimination" section appears
   - [ ] **Check:** Shows: Australian Human Rights, Lifeline, Beyond Blue

8. **Test Multiple Categories**
   - [ ] Find a book with multiple warning types
   - [ ] **Check:** All relevant resource sections appear
   - [ ] **Check:** Sections are properly separated with borders
   - [ ] **Check:** No duplicate sections

### Expected Results
- ✅ All resource categories appear when relevant warnings are present
- ✅ State-specific services appear first when available
- ✅ National services always available
- ✅ Sections are well-organized and readable

---

## Test Scenario 5: Feedback Data Retrieval

### Objective
Test that feedback data is properly stored and can be retrieved.

### Steps

1. **Submit test feedback**
   - [ ] Submit feedback from a book page with context
   - [ ] Note the feedback details you submitted

2. **Retrieve feedback using script**
   - [ ] Open terminal
   - [ ] Run: `npx tsx scripts/view-feedback.ts --limit=5`
   - [ ] **Check:** Your test feedback appears in the list
   - [ ] **Check:** Book title, author, ISBN are present
   - [ ] **Check:** Warnings count is recorded
   - [ ] **Check:** App version is recorded
   - [ ] **Check:** Context data includes all relevant information

3. **Retrieve feedback using SQL**
   - [ ] Use Supabase MCP or dashboard
   - [ ] Query: `SELECT * FROM manual_handling_scans WHERE reason = 'user_feedback' ORDER BY created_at DESC LIMIT 5`
   - [ ] **Check:** Feedback entries have `book_id`, `book_title`, `book_author`
   - [ ] **Check:** `context_data` JSONB field contains warnings_count, analysis_status
   - [ ] **Check:** `app_version` field is populated
   - [ ] **Check:** `user_agent` field is populated

### Expected Results
- ✅ Feedback is stored with full context
- ✅ All new columns are populated correctly
- ✅ Context data is accessible via scripts and SQL
- ✅ Feedback can be queried by book, type, status

---

## Test Scenario 6: General Functionality

### Objective
Test that existing functionality still works with new updates.

### Steps

1. **Test book scanning**
   - [ ] Go to `/scan` page
   - [ ] Scan a new book (not already in database)
   - [ ] **Check:** Progress indicators appear immediately
   - [ ] **Check:** Status updates show throughout scan
   - [ ] **Check:** Book page loads after scan completes

2. **Test content warnings display**
   - [ ] View a book with warnings
   - [ ] **Check:** Warnings are grouped by category
   - [ ] **Check:** Accordion sections can be expanded/collapsed
   - [ ] **Check:** Category badges show warning counts
   - [ ] **Check:** Dynamic summary appears above warnings

3. **Test search functionality**
   - [ ] Use search bar in navbar
   - [ ] **Check:** Search works correctly
   - [ ] **Check:** Results display properly

4. **Test mobile responsiveness**
   - [ ] Resize browser to mobile size (or use mobile device)
   - [ ] **Check:** Quick Exit button is accessible
   - [ ] **Check:** Support resources are readable
   - [ ] **Check:** Feedback dialog works on mobile
   - [ ] **Check:** All buttons are tappable

### Expected Results
- ✅ All existing functionality works
- ✅ New features don't break existing features
- ✅ Mobile experience is good
- ✅ No console errors

---

## Test Scenario 7: Edge Cases & Error Handling

### Objective
Test edge cases and error scenarios.

### Steps

1. **Test with no state detection**
   - [ ] If possible, test from a location where state can't be detected
   - [ ] **Check:** National services still appear
   - [ ] **Check:** No errors in console
   - [ ] **Check:** Support resources section displays correctly

2. **Test with invalid book context**
   - [ ] Submit feedback from a page without book context
   - [ ] **Check:** Feedback still submits successfully
   - [ ] **Check:** General feedback type is used
   - [ ] **Check:** No errors occur

3. **Test Quick Exit on non-sensitive content**
   - [ ] Go to a book with only mild warnings
   - [ ] **Check:** Quick Exit button does NOT appear
   - [ ] **Check:** Escape key does NOT trigger exit

4. **Test feedback submission errors**
   - [ ] Try submitting feedback without message
   - [ ] **Check:** Error message appears
   - [ ] **Check:** Form doesn't submit
   - [ ] **Check:** User can correct and resubmit

### Expected Results
- ✅ Graceful fallbacks for missing data
- ✅ Error messages are user-friendly
- ✅ No crashes or broken states
- ✅ System degrades gracefully

---

## Performance Testing

### Steps

1. **Page load performance**
   - [ ] Open browser DevTools → Network tab
   - [ ] Navigate to a book page
   - [ ] **Check:** Page loads in < 3 seconds
   - [ ] **Check:** API calls complete quickly
   - [ ] **Check:** No unnecessary API calls

2. **State detection performance**
   - [ ] Monitor network tab when loading book with warnings
   - [ ] **Check:** `/api/user-location` call completes quickly
   - [ ] **Check:** `/api/state-services` call completes quickly
   - [ ] **Check:** No blocking of page rendering

### Expected Results
- ✅ Page loads quickly
- ✅ State detection doesn't slow down page
- ✅ No performance regressions

---

## Accessibility Testing

### Steps

1. **Keyboard navigation**
   - [ ] Tab through the page
   - [ ] **Check:** Quick Exit button is keyboard accessible
   - [ ] **Check:** Feedback dialog is keyboard accessible
   - [ ] **Check:** All links are keyboard accessible

2. **Screen reader testing**
   - [ ] Use screen reader (VoiceOver, NVDA, etc.)
   - [ ] **Check:** Quick Exit button is announced
   - [ ] **Check:** Support resources are readable
   - [ ] **Check:** Feedback form is navigable

3. **Color contrast**
   - [ ] **Check:** Quick Exit button has sufficient contrast
   - [ ] **Check:** Support resource links are readable
   - [ ] **Check:** All text meets WCAG AA standards

### Expected Results
- ✅ All features are keyboard accessible
- ✅ Screen readers can navigate features
- ✅ Color contrast meets accessibility standards

---

## Browser Compatibility

### Steps

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Safari
- [ ] Firefox
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

For each browser:
- [ ] **Check:** Quick Exit button appears and works
- [ ] **Check:** State detection works
- [ ] **Check:** Feedback form works
- [ ] **Check:** Support resources display correctly

### Expected Results
- ✅ Works in all major browsers
- ✅ Mobile browsers work correctly
- ✅ No browser-specific issues

---

## Final Checklist

Before marking testing complete:

- [ ] All test scenarios completed
- [ ] All expected results verified
- [ ] No critical bugs found
- [ ] Performance is acceptable
- [ ] Accessibility requirements met
- [ ] Browser compatibility confirmed
- [ ] Feedback data is being captured correctly
- [ ] State-based services are working
- [ ] Quick Exit button works as expected

---

## Issues Found

Document any issues discovered during testing:

### Critical Issues (Blocking)
1. 
2. 
3. 

### High Priority Issues
1. 
2. 
3. 

### Medium Priority Issues
1. 
2. 
3. 

### Low Priority / Nice to Have
1. 
2. 
3. 

---

## Test Completion

- **Date Completed:** _______________
- **Tester Name:** _______________
- **Overall Status:** ☐ Pass ☐ Pass with Issues ☐ Fail
- **Ready for Production:** ☐ Yes ☐ No

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
