# Categorical Shielding Verification Test

## Overview
This document describes how to test the categorical shielding implementation to ensure it prevents spoilers in content warning reasoning fields.

## Test Script
The test script `scripts/test-categorical-shielding.ts` will:
1. Test "A Little Life" (ISBN: 9780385539258) - a book that previously had spoiler issues
2. Analyze all generated reasoning fields for spoiler indicators
3. Verify that reasoning uses categorical language (e.g., "Contains themes of X")
4. Report any narrative plot descriptions found

## Running the Test

### Option 1: Using Local Environment Variables
```bash
# Set API key in .env.local
echo "OPENAI_API_KEY=your-key-here" > .env.local

# Run the test
npx tsx scripts/test-categorical-shielding.ts
```

### Option 2: Using Vercel MCP (if configured)
If you have Vercel MCP server configured, you can fetch the API key:
```bash
# The script will automatically use OPENAI_API_KEY from environment
npx tsx scripts/test-categorical-shielding.ts
```

### Option 3: Direct Environment Variable
```bash
OPENAI_API_KEY=your-key-here npx tsx scripts/test-categorical-shielding.ts
```

## Expected Output

### ✅ Success Case
```
✅ PASSED: All reasoning fields use categorical language
   Categorical shielding is working correctly!
```

Example of good categorical reasoning:
- ✅ "Contains pervasive themes of systemic exploitation and sexual violence involving minors"
- ✅ "Contains themes of character loss and accidental death"

### ❌ Failure Case
```
❌ FAILED: Reasoning fields contain potential spoilers
```

Example of bad narrative reasoning (should NOT appear):
- ❌ "Character is sold as a child prostitute"
- ❌ "Main character dies in a fire at the end"

## What the Test Checks

1. **Spoiler Indicators**: Looks for narrative elements like:
   - Character names or relationships
   - Specific plot events ("sold as", "dies", "killed")
   - Chapter numbers or timing
   - Character-specific details

2. **Categorical Language**: Verifies use of:
   - "Contains themes of..."
   - "Depictions of..."
   - "References to..."
   - Clinical, matter-of-fact language

3. **Severity Independence**: Ensures high severity scores don't trigger narrative details

## Manual Verification

You can also manually test any ISBN:
```bash
npx tsx scripts/test-agent.ts <ISBN>
```

Then review the `reasoning` field in each warning to ensure it:
- Uses categorical taxonomy language
- Avoids specific plot points
- Describes content type, not story events

## Architecture Verification

Run the structural verification (no API key needed):
```bash
npx tsx scripts/verify-categorical-shielding.ts
```

This checks that all prompt modifications are in place without making API calls.
