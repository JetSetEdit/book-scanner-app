# Severity Icon Research & Recommendations

## Current State
- **Severe**: AlertTriangle (red)
- **Moderate**: AlertCircle (orange)  
- **Mild**: Info (yellow)

## Research Findings

### Industry Best Practices

**Common Severity Icon Patterns:**
1. **Progressive Intensity** - Icons that visually escalate:
   - ⚠️ → ⚠️⚠️ → ⚠️⚠️⚠️ (multiple symbols)
   - Circle → Triangle → Diamond (increasing complexity)
   - Single → Double → Triple lines (increasing weight)

2. **Visual Weight** - Icons that get "heavier":
   - Thin → Medium → Thick strokes
   - Outline → Half-filled → Filled
   - Small → Medium → Large

3. **Semantic Meaning**:
   - **Severe**: Stop sign, X, Ban, AlertTriangle (danger)
   - **Moderate**: Warning, Caution, AlertCircle (attention)
   - **Mild**: Info, Lightbulb, Circle (information)

### Lucide Icon Options

**Option 1: Progressive Alert System**
- **Severe**: `AlertTriangle` (current) ✅
- **Moderate**: `AlertCircle` (current) ✅
- **Mild**: `Info` (current) ✅
- **Pros**: Clear semantic meaning, widely understood
- **Cons**: AlertCircle and Info can look similar at small sizes

**Option 2: Shield-Based (Matches Your Shield Icon)**
- **Severe**: `ShieldAlert` or `ShieldX` (if available)
- **Moderate**: `Shield` (half protection)
- **Mild**: `ShieldCheck` (safe/verified)
- **Pros**: Consistent with Shield icon used elsewhere
- **Cons**: May not convey severity clearly

**Option 3: Progressive Intensity**
- **Severe**: `AlertTriangle` (filled/danger)
- **Moderate**: `AlertCircle` (outline/attention)
- **Mild**: `Circle` or `Info` (minimal/info)
- **Pros**: Clear visual hierarchy
- **Cons**: Circle might be too subtle

**Option 4: Book-Themed (On-Brand)**
- **Severe**: `BookX` or `BookOpen` with alert
- **Moderate**: `BookOpen` (neutral)
- **Mild**: `BookMarked` (safe/verified)
- **Pros**: Matches book theme
- **Cons**: May not convey severity clearly

### Custom SVG Icon Approach

**Creating On-Brand Custom Icons:**

1. **Design Principles:**
   - Minimalist (matches your design language)
   - Geometric shapes
   - Consistent stroke weight (1.5-2px)
   - Simple, recognizable at 12-16px size

2. **Severity Visual System:**
   ```
   Mild:     [○]  Circle (minimal, open)
   Moderate: [△]  Triangle (attention, warning)
   Severe:   [▲]  Filled triangle (danger, urgent)
   ```

   Or progressive bars:
   ```
   Mild:     [|]  Single bar
   Moderate: [||] Double bar
   Severe:   [|||] Triple bar
   ```

3. **Implementation:**
   - Create SVG files in `public/icons/severity/`
   - Use React component wrapper
   - Match stroke width to Lucide icons (1.5px)
   - Use current color scheme

### Recommendation

**Best Option: Enhanced Current Icons with Better Visual Distinction**

Keep the current icons but improve visual distinction:

1. **Severe**: `AlertTriangle` ✅ (keep - clear danger signal)
2. **Moderate**: `AlertCircle` → Consider `AlertCircle` with different styling OR `AlertOctagon` (more distinct)
3. **Mild**: `Info` → Consider `Circle` with `i` OR `Info` with lighter weight

**Alternative: Custom Minimal Icons**

Create simple, geometric custom icons that match your minimalist aesthetic:

```svg
<!-- Mild: Simple circle -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <circle cx="12" cy="12" r="8"/>
</svg>

<!-- Moderate: Triangle outline -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M12 4L20 20H4L12 4Z"/>
</svg>

<!-- Severe: Filled triangle -->
<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 4L20 20H4L12 4Z"/>
</svg>
```

**Pros:**
- Matches minimalist design language
- Clear visual progression (circle → triangle outline → filled triangle)
- On-brand and unique
- Scales perfectly

**Cons:**
- Requires custom SVG creation
- Slightly more maintenance

### Next Steps

1. **Quick Win**: Try `AlertOctagon` for moderate (more distinct than AlertCircle)
2. **Better**: Create custom geometric icons matching your brand
3. **Best**: Design custom icons with subtle book/literary theme

Would you like me to:
- A) Try different Lucide icon combinations?
- B) Create custom SVG icons matching your minimalist aesthetic?
- C) Design book-themed custom icons?

