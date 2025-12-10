# Subtext Sparks System

## Overview

**Subtext Sparks** is a lightweight gamification system designed to increase user engagement and retention by rewarding meaningful actions in the Subtext platform. It's modular, non-blocking, and can be shipped as a Phase 2 feature without impacting the core safety MVP.

## Features

### Sparks (Points)
- **Scan a book**: 10 sparks
- **Make a pivot** (choose not to read risky content): 15 sparks
- **Validate a warning**: 5 sparks (future)
- **Earn a badge**: Variable (badge-specific)

### Badges
1. **First Spark** - Completed your first book scan (10 sparks)
2. **Pivot Prodigy** - Made 3+ smart pivots away from risky content (50 sparks)
3. **Scan Savant** - Scanned 10+ books (100 sparks)
4. **Safety Advocate** - Validated 20+ content warnings (75 sparks) - *Future*
5. **Spark Collector** - Earned 500+ total sparks (meta badge)

## Architecture

### Database Schema

- `user_sparks` - Tracks total sparks and activity counts per user
- `badges` - Master list of available badges
- `user_badges` - Junction table tracking earned badges
- `sparks_history` - Audit trail of all spark awards
- `user_pivots` - Tracks when users decide not to read a book

### API Routes

- `POST /api/sparks/award` - Awards sparks to authenticated user
- `POST /api/sparks/pivot` - Records a pivot and awards sparks
- `GET /api/sparks/profile` - Returns user's sparks profile and badges

### Services

- `lib/services/sparks-service.ts` - Core logic for awarding sparks and checking badges

### Components

- `components/sparks-counter.tsx` - Displays sparks count and recent badges
- `components/pivot-button.tsx` - Button to record a pivot decision

## Integration Points

### Scan Completion
Automatically awards 10 sparks when a user completes a book scan. Hooked into `/app/api/scan-isbn/route.ts`.

### Pivot Tracking
Users can click "Choose Another Book" button to record a pivot, earning 15 sparks and progressing toward "Pivot Prodigy" badge.

### Badge Checking
Automatically checks badge eligibility after each spark-awarding action. Badges are awarded automatically when thresholds are met.

## Usage

### Adding Sparks Counter to Navbar

```tsx
import { SparksCounter } from "@/components/sparks-counter"

// In navbar component:
<SparksCounter />
```

### Adding Pivot Button to Book Page

```tsx
import { PivotButton } from "@/components/pivot-button"

// In book details component:
<PivotButton bookId={book.id} isbn={book.isbn} />
```

## Migration

Run the migration to create the database tables:

```bash
# Apply migration via Supabase CLI or dashboard
supabase migration up 20251209_create_sparks_system
```

Or apply manually via Supabase SQL editor.

## Future Enhancements

1. **Premium Perks** - Use sparks to unlock features (extra AI dives, themes)
2. **Leaderboards** - Community rankings (optional, privacy-conscious)
3. **Streaks** - Daily scan streaks for retention
4. **Achievement Notifications** - Toast notifications when badges are earned
5. **Badge Showcase** - Profile page showing all earned badges

## Design Principles

- **Non-blocking**: Sparks system failures don't impact core functionality
- **Modular**: Can be enabled/disabled without code changes
- **Transparent**: All spark awards are logged in `sparks_history`
- **Privacy-first**: User data stays private, no public leaderboards by default
- **Retention-focused**: Designed to bring users back, not just reward one-time actions

## Testing

To test the system:

1. Run a book scan - should award 10 sparks
2. Record 3 pivots - should earn "Pivot Prodigy" badge
3. Check `/api/sparks/profile` - should return sparks and badges
4. View navbar - should show sparks counter (if logged in)

## Notes

- Sparks are awarded asynchronously to avoid blocking scan completion
- Badge checking happens automatically after spark awards
- User must be authenticated to earn sparks
- Pivots are unique per user per book (can't pivot twice on same book)

