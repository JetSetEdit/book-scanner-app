# Collaboration Protocol - Instructions for Antigravity

## Who's Who

- **You (Antigravity)**: AI assistant working on this project
- **Cursor**: Another AI assistant (also working on this project)
- **Jordan (Human Developer)**: The project owner coordinating both of us

## Quick Start

We've set up a collaboration system so Antigravity and Cursor can work together without conflicts. Here's what you need to know:

## Before You Start Working

**ALWAYS check these files first:**

1. **`.cursor-working.md`** - Lists files Cursor is currently modifying
   - If files are listed here, **DO NOT modify them** until Cursor is done
   - You can read them, but don't edit

2. **`.antigravity-working.md`** - Your status file
   - Update this when you start working
   - List all files you're modifying
   - Delete it when you're done

3. **Look for comments in code:**
   - `@cursor-working` - Cursor is working on this file
   - `@antigravity-working` - You're working on this file

## When You Start Work

1. **Create/update `.antigravity-working.md`:**
   ```markdown
   # Antigravity Working Status
   
   ## Current Status
   **Status:** Actively working
   
   ## Files Currently Being Modified
   - lib/content-warning-agent.ts
   - app/api/scan-isbn/route.ts
   
   ## Last Updated
   2024-12-XX
   ```

2. **Optional: Add file markers** at the top of files you're modifying:
   ```typescript
   // @antigravity-working - Do not modify
   ```

3. **Use `antigravity-wip/` directory** for draft work if needed

## When You Finish Work

1. **Remove file markers** (`@antigravity-working` comments)
2. **Delete `.antigravity-working.md`** when completely done
3. **Commit your changes** with clear messages like `[ANTIGRAVITY] Working on X`

## Priority Rules

- **You have priority** on files you mark in `.antigravity-working.md`
- **Cursor has priority** on files marked in `.cursor-working.md`
- **First to mark wins** - if no markers exist, first AI to start work owns it
- **Reading is always safe** - you can read any file, modifying requires checking

## If You See Cursor Working

- **Don't panic** - just check `.cursor-working.md`
- **Wait or coordinate** - if files you need are locked, wait or ask for coordination
- **Read the protocol** - see `.collaboration-protocol.md` for full details

## Emergency Override

If you need to fix something urgent on a locked file:
1. Check git log for recent activity
2. Make minimal, safe changes
3. Add comment: `// @override: [reason]`
4. Update status file with override note

## Example Workflow

```
1. Check .cursor-working.md → Empty, safe to proceed
2. Create .antigravity-working.md → List files you're modifying
3. Add @antigravity-working comments → Mark files in code
4. Do your work → Modify files safely
5. Remove comments → Clean up markers
6. Delete .antigravity-working.md → Signal you're done
7. Commit → Push changes
```

## Questions?

- Read `.collaboration-protocol.md` for full details
- Check git log to see what Cursor has been doing
- When in doubt, check the status files first

---

**TL;DR:** Check `.cursor-working.md` before modifying files. Update `.antigravity-working.md` when you start work. Delete it when done. Simple!

