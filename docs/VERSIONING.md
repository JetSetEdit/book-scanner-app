# Version Management

This project uses automatic versioning for the Public Beta. The version is incremented automatically before each deployment to production.

## Version Format

- **Format**: `MAJOR.MINOR.PATCH` (e.g., `1.01.0`)
- **Label**: `Public Beta MINOR` (e.g., `Public Beta 1.01`)
- **Current Version**: See `lib/config/version.ts`

## Automatic Version Increment

### Option 1: Using the Prepare Deploy Script (Recommended)

Before pushing to `main` branch (which triggers Vercel deployment):

```bash
./scripts/prepare-deploy.sh
```

This will:
1. Increment the version number
2. Update `lib/config/version.ts`
3. Update `package.json`
4. Stage the version files for commit

Then commit and push:
```bash
git commit -m "chore: bump version for deployment"
git push origin main
```

### Option 2: Manual Increment

If you need to increment the version manually:

```bash
npm run version:increment
```

Then commit the changes:
```bash
git add lib/config/version.ts package.json
git commit -m "chore: bump version"
```

### Option 3: Git Hook (Automatic)

A pre-commit hook is installed that automatically increments the version when committing to the `main` branch. The hook will:
- Detect if you're on `main` branch
- Increment the version
- Stage the version files
- Continue with the commit

**Note**: Git hooks are not committed to the repository. If you clone the repo, you'll need to make the hook executable:
```bash
chmod +x .git/hooks/pre-commit
```

## Version Files

The version is stored in two places:
1. **`lib/config/version.ts`** - Application version (used by the app)
2. **`package.json`** - NPM package version

Both are updated automatically by the increment script.

## Version History

Version history is maintained in `lib/config/version.ts` in the `VERSION_HISTORY` array. You can manually add entries when incrementing for major features.

## Deployment Flow

1. Make your code changes
2. Run `./scripts/prepare-deploy.sh` (or let the git hook handle it)
3. Commit changes (version files will be included)
4. Push to `main` branch
5. Vercel automatically deploys with the new version

## Version Increment Logic

- **Patch version** (last number) is incremented for each deployment
- Example: `1.01.0` → `1.01.1` → `1.01.2`
- The build date is automatically updated to the current date

## Manual Version Override

If you need to set a specific version (e.g., for a major release), edit `lib/config/version.ts` and `package.json` manually, then commit.


