# Large Cleanup Plan

## 📁 Documentation Organization

### Keep (Core Documentation)
- `README.md` - Main project readme
- `AGENT_README.md` - Agent documentation
- `CURRENT-ARCHITECTURE.md` - Architecture docs
- `TAXONOMY_REFERENCE.md` - Taxonomy reference
- `TAXONOMY_DESIGN_PRINCIPLES.md` - Design principles
- `TAXONOMY_MANIFESTO.md` - Manifesto
- `TAXONOMY_STRESS_TEST.md` - Stress test responses
- `BOOKTOK_EDGE_CASES.md` - Edge cases

### Archive (Move to `/docs/archive/`)
- Old session summaries
- Implementation plans (completed)
- Test results
- Old proposals
- Historical analysis files

### Remove
- `.cursor-working.md` - Temporary working files
- `.antigravity-working.md` - Temporary working files
- `ANTIGRAVITY_MESSAGE.txt` - Old message
- `FOR_ANTIGRAVITY.md` - Old message
- `OPENING_MESSAGE.md` - Old message
- Test audio files (`.mp3`)
- Old test result JSON files

## 🗑️ Code Cleanup

### Remove Unused Files
- `app/debug/` - Debug page (or protect it)
- `app/test-cover/` - Test page (or move to dev)
- Old test scripts that are no longer used
- `wordpress-dev-extension/` - If not used

### Clean Up Imports
- Remove unused imports across codebase
- Remove dead code paths
- Remove commented-out code

### Organize Scripts
- Move utility scripts to `/scripts/utils/`
- Move test scripts to `/scripts/tests/`
- Keep migration scripts in `/supabase/migrations/`

## 📊 Data Files

### Remove
- `batch-model-test-results.json` - Old test data
- `batch-model-test-results-quick.json` - Old test data
- `model-comparison-results.json` - Old test data
- `pipeline-test-results.json` - Old test data
- `description-lengths-analysis.json` - Old analysis
- `wicked_annotation.csv` - Old data
- `jordan-test-current-settings.mp3` - Test audio
- `voice_preview_jordan .mp3` - Test audio

## 🔧 Configuration

### Review
- `next.config.mjs` - Fix eslint warning
- Remove deprecated middleware convention
- Clean up unused environment variables

## 📝 Next Steps

1. Create `/docs/archive/` directory
2. Move old documentation there
3. Remove test files and old data
4. Clean up code imports
5. Organize scripts
6. Update .gitignore if needed

