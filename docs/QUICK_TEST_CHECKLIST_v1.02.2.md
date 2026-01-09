# Quick Test Checklist - v1.03.0

**Quick 10-minute smoke test before going live**

## Critical Path Tests

### 1. Quick Exit Button (2 min)
- [ ] Go to book with domestic violence warnings
- [ ] **Check:** Red "Quick Exit" button appears top-right
- [ ] Click button → **Check:** Redirects to google.com
- [ ] Press Escape key → **Check:** Redirects to google.com
- [ ] Go to book with mild warnings only → **Check:** No Quick Exit button

### 2. Feedback Context Prefilling (2 min)
- [ ] Go to any book page
- [ ] Click "Found an error? Report this book"
- [ ] **Check:** Feedback type = "Content Issue"
- [ ] **Check:** Message prefilled with book title, author, ISBN, warnings count
- [ ] Change feedback type → **Check:** Message updates
- [ ] Submit → **Check:** Success message appears

### 3. State-Based Services (2 min)
- [ ] Go to book with sensitive content warnings
- [ ] Scroll to Support Resources
- [ ] **Check:** State-specific services appear (if state detected)
- [ ] **Check:** Shows "(STATE services available)" indicator
- [ ] **Check:** National services also appear

### 4. Enhanced Support Resources (2 min)
- [ ] Find book with LGBTIQA+ warnings → **Check:** LGBTIQA+ section appears
- [ ] Find book with substance use warnings → **Check:** Substance Use section appears
- [ ] Find book with grief warnings → **Check:** Grief section appears
- [ ] Find book with bullying warnings → **Check:** Bullying section appears

### 5. General Functionality (2 min)
- [ ] Scan a new book → **Check:** Progress indicators appear
- [ ] Search for a book → **Check:** Search works
- [ ] Navigate between pages → **Check:** No errors

## ✅ All Critical Tests Pass?

- [ ] Yes - Ready for production
- [ ] No - See issues below

**Issues:**
_________________________________________________________________
