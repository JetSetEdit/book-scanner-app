## Context

The iOS app homepage needs a beautiful, book-focused design that communicates the Subtext brand and makes the app's purpose immediately clear. The design should feel premium, literary, and trustworthy - matching the serious nature of content warnings for books.

## Goals / Non-Goals

### Goals
- Create a visually striking homepage that communicates brand identity
- Establish a cohesive color system that can be reused across all screens
- Design intuitive navigation structure
- Make search functionality prominent and accessible
- Use typography that feels literary and book-focused
- Ensure the design is accessible and readable

### Non-Goals
- Complex animations or interactions (keep it simple for Phase 1)
- Multiple homepage variants (one design to start)
- Dark mode support initially (can add later)
- Custom fonts (use system fonts with serif design where appropriate)

## Design Decisions

### Decision: Serif typography for brand identity
**Rationale**: Serif fonts evoke books, literature, and reading. Using serif for the app name, tagline, and key brand elements creates a strong connection to the book-focused purpose of the app.

**Alternatives considered**:
- Sans-serif only: Less distinctive, doesn't connect to book theme
- Custom fonts: Adds complexity and bundle size

### Decision: Warm, earthy color palette
**Rationale**: Colors that evoke paper, books, and libraries (warm beiges, browns, earth tones) create a cohesive book-focused aesthetic. The palette should feel premium and trustworthy.

**Color Palette**:
- **Background**: Warm beige/cream (paper-like)
- **Primary**: Dark brown/charcoal (text color, main elements)
- **Secondary**: Medium brown (supporting text, icons)
- **Highlight**: Warm brown/orange (accent, selected states)

**Alternatives considered**:
- Bright, modern colors: Doesn't match book/literary theme
- Monochrome: Too stark, lacks warmth

### Decision: Bottom tab navigation
**Rationale**: Standard iOS pattern that's familiar and accessible. Four main sections provide clear app structure without overwhelming users.

**Tab Structure**:
- Home (current screen)
- Scan (barcode scanning)
- Bookshelf (saved/scanned books)
- Settings (preferences)

**Alternatives considered**:
- Side navigation: Less common on iOS, takes more space
- Top tabs: Less accessible on large phones

### Decision: Prominent search bar
**Rationale**: Search is a primary function - users need to find books. Making it prominent on the homepage ensures it's always accessible.

**Search Design**:
- Rounded rectangle with subtle border
- Magnifying glass icon
- Placeholder text: "Search by title, author, ISBN, genre"
- Semi-transparent white background
- Prominent placement near top

**Alternatives considered**:
- Hidden search (tap to reveal): Less discoverable
- Full-width search bar: Too dominant, takes focus from brand

### Decision: Large brand logo/initial
**Rationale**: Strong visual identity with large "S" initial creates memorable first impression. Reinforces brand name "Subtext" and makes the app feel established.

**Alternatives considered**:
- Small logo: Less impactful
- Full wordmark only: Less distinctive

## Design Specifications

### Color System

**Background Color**:
- RGB: (242, 240, 224) or similar warm beige
- Purpose: Main screen background, evokes paper/books

**Primary Color**:
- RGB: (92, 77, 51) or similar dark brown
- Purpose: Main text, logo, primary UI elements

**Secondary Color**:
- RGB: (133, 120, 92) or similar medium brown
- Purpose: Supporting text, icons, secondary UI elements

**Highlight/Accent Color**:
- RGB: (173, 115, 56) or similar warm brown/orange
- Purpose: Selected states, accents, active indicators

### Typography

**Brand Typography** (Serif):
- App Name: Large, bold serif (44pt, bold)
- Tagline: Medium serif (30pt, semibold, italic for second line)
- Logo Initial: Extra large serif (120pt, black)

**UI Typography** (System/Serif mix):
- Search placeholder: System serif (16pt, medium)
- Description text: System serif (17pt, medium)
- Tab labels: System serif (12pt, semibold)

### Layout Structure

**Header Section**:
- Logo circle (44x44pt) with "S" initial
- Search bar (full width minus logo spacing)
- Horizontal padding: 24pt
- Top padding: 8pt

**Hero Section**:
- Large "S" logo (120pt)
- "Subtext" app name (44pt)
- Tagline in two lines (30pt each)
- Vertical spacing: 16pt between elements

**Body Section**:
- Description text (17pt)
- Horizontal padding: 12pt
- Centered alignment

**Navigation Section**:
- Bottom tab bar with 4 tabs
- Tab spacing: 36pt
- Bottom padding: 10pt
- Selected indicator: Capsule shape (24x3pt) in highlight color

### Component Specifications

**Search Bar**:
- Height: ~44pt (comfortable tap target)
- Corner radius: 16pt
- Background: White with 60% opacity
- Border: 1pt, light beige
- Icon: Magnifying glass, secondary color
- Text: Secondary color, serif font

**Tab Item**:
- Icon size: 18pt
- Label size: 12pt, semibold serif
- Selected state: Highlight color
- Unselected state: Secondary color
- Indicator: Capsule in highlight color when selected

## Visual Hierarchy

1. **Primary**: Large "S" logo and "Subtext" name
2. **Secondary**: Tagline and search bar
3. **Tertiary**: Description text
4. **Navigation**: Bottom tabs (always accessible)

## Accessibility Considerations

- Color contrast ratios meet WCAG AA standards
- Text sizes are readable (minimum 16pt for body text)
- Tap targets are at least 44x44pt
- Icons have text labels
- Color is not the only indicator of state (shape/position also used)

## Responsive Considerations

- Design works on iPhone SE (smallest) to iPhone Pro Max (largest)
- Text scales appropriately (minimum scale factor 0.8)
- Spacing adjusts proportionally
- Search bar text truncates gracefully on small screens

## Open Questions

- Should we support dark mode? (Defer to later phase)
- Do we need custom app icon design? (Separate task)
- Should search be functional in Phase 1 or just visual? (Phase 2)
- Do we need onboarding screens? (Defer to later)
