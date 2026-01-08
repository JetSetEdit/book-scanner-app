/**
 * Version Increment Script
 * 
 * Automatically increments the version number for each deployment.
 * Updates both lib/config/version.ts and package.json
 * Auto-generates changelog entries when significant user-facing changes are detected
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

interface VersionParts {
  major: number
  minor: number
  patch: number
}

function parseVersion(version: string): VersionParts {
  const parts = version.split('.').map(Number)
  return {
    major: parts[0] || 1,
    minor: parts[1] || 0,
    patch: parts[2] || 0
  }
}

function formatVersion(parts: VersionParts): string {
  return `${parts.major}.${String(parts.minor).padStart(2, '0')}.${parts.patch}`
}

function incrementVersion(version: string): string {
  const parts = parseVersion(version)
  parts.patch += 1
  return formatVersion(parts)
}

function getBuildDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function updateVersionFile(newVersion: string, buildDate: string) {
  const versionFilePath = join(process.cwd(), 'lib/config/version.ts')
  let content = readFileSync(versionFilePath, 'utf-8')
  
  // Update APP_VERSION
  content = content.replace(
    /export const APP_VERSION = "[\d.]+"/,
    `export const APP_VERSION = "${newVersion}"`
  )
  
  // APP_VERSION_LABEL is static "Public Beta" - no need to update
  
  // Update APP_BUILD_DATE
  content = content.replace(
    /export const APP_BUILD_DATE = "[\d-]+"/,
    `export const APP_BUILD_DATE = "${buildDate}"`
  )
  
  writeFileSync(versionFilePath, content, 'utf-8')
  console.log(`✅ Updated lib/config/version.ts`)
}

function updatePackageJson(newVersion: string) {
  const packageJsonPath = join(process.cwd(), 'package.json')
  const content = readFileSync(packageJsonPath, 'utf-8')
  const packageJson = JSON.parse(content)
  
  packageJson.version = newVersion
  
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8')
  console.log(`✅ Updated package.json`)
}

interface CommitInfo {
  hash: string
  message: string
  type: 'feat' | 'fix' | 'docs' | 'chore' | 'refactor' | 'perf' | 'test' | 'other'
  isUserFacing: boolean
}

function getLastChangelogVersion(): string | null {
  try {
    const changelogPath = join(process.cwd(), 'lib/config/changelog.ts')
    const content = readFileSync(changelogPath, 'utf-8')
    const match = content.match(/version: "([\d.]+)"/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

function getRecentCommits(sinceVersion: string): CommitInfo[] {
  try {
    // Skip git operations if not in a git repo or during build (Vercel doesn't have .git)
    if (!existsSync('.git') || process.env.VERCEL === '1') {
      return []
    }
    
    // Get commits since the last changelog entry version
    // Use git log to find commits after the last changelog version
    const lastChangelogVersion = getLastChangelogVersion()
    
    let logOutput: string
    if (lastChangelogVersion) {
      // Try to find a commit that mentions the last changelog version
      // If found, get commits since then; otherwise use last 3 days
      try {
        const versionCommit = execSync(
          `git log --oneline --grep="${lastChangelogVersion}" --format="%H" -1`,
          { encoding: 'utf-8', cwd: process.cwd(), stdio: ['ignore', 'pipe', 'ignore'] }
        ).trim()
        
        if (versionCommit) {
          logOutput = execSync(
            `git log --oneline --no-merges ${versionCommit}..HEAD`,
            { encoding: 'utf-8', cwd: process.cwd(), stdio: ['ignore', 'pipe', 'ignore'] }
          ).trim()
        } else {
          // Fallback to last 3 days if version commit not found
          logOutput = execSync(
            `git log --oneline --no-merges --since="3 days ago"`,
            { encoding: 'utf-8', cwd: process.cwd(), stdio: ['ignore', 'pipe', 'ignore'] }
          ).trim()
        }
      } catch {
        // Fallback to last 3 days
        logOutput = execSync(
          `git log --oneline --no-merges --since="3 days ago"`,
          { encoding: 'utf-8', cwd: process.cwd(), stdio: ['ignore', 'pipe', 'ignore'] }
        ).trim()
      }
    } else {
      // No changelog found, use last 3 days
      logOutput = execSync(
        `git log --oneline --no-merges --since="3 days ago"`,
        { encoding: 'utf-8', cwd: process.cwd(), stdio: ['ignore', 'pipe', 'ignore'] }
      ).trim()
    }
    
    if (!logOutput) return []
    
    const commits: CommitInfo[] = []
    const lines = logOutput.split('\n')
    
    for (const line of lines) {
      const match = line.match(/^([a-f0-9]+)\s+(.+)$/)
      if (!match) continue
      
      const [, hash, message] = match
      
      // Parse conventional commit format
      let type: CommitInfo['type'] = 'other'
      let isUserFacing = false
      
      if (message.startsWith('feat:')) {
        type = 'feat'
        isUserFacing = true
      } else if (message.startsWith('fix:')) {
        type = 'fix'
        // Only user-facing if it mentions UI, UX, or user-visible issues
        isUserFacing = /ui|ux|user|visible|display|modal|page|component|button|link|error message|bug/i.test(message)
      } else if (message.startsWith('docs:')) {
        type = 'docs'
        isUserFacing = /changelog|release notes|what's new/i.test(message)
      } else if (message.startsWith('chore:')) {
        type = 'chore'
        isUserFacing = false
      } else if (message.startsWith('refactor:')) {
        type = 'refactor'
        isUserFacing = false
      } else if (message.startsWith('perf:')) {
        type = 'perf'
        isUserFacing = true // Performance improvements are user-facing
      }
      
      // Check for user-facing keywords even if not conventional commit
      if (!isUserFacing) {
        isUserFacing = /add|improve|update|enhance|new feature|user|ui|ux|modal|page|component|button|link|fix.*display|fix.*visible/i.test(message.toLowerCase())
      }
      
      commits.push({ hash, message, type, isUserFacing })
    }
    
    return commits
  } catch (error) {
    // Silently fail - this is expected in CI/build environments without git
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Could not fetch git commits for changelog analysis:', error)
    }
    return []
  }
}

function shouldUpdateChangelog(commits: CommitInfo[]): boolean {
  if (commits.length === 0) return false
  
  // Threshold: At least one feat commit OR 2+ user-facing fix commits OR 3+ user-facing commits total
  const featCount = commits.filter(c => c.type === 'feat' && c.isUserFacing).length
  const fixCount = commits.filter(c => c.type === 'fix' && c.isUserFacing).length
  const userFacingCount = commits.filter(c => c.isUserFacing).length
  
  return featCount >= 1 || fixCount >= 2 || userFacingCount >= 3
}

function generateChangelogEntry(commits: CommitInfo[], newVersion: string, buildDate: string): string {
  const userFacingCommits = commits.filter(c => c.isUserFacing)
  
  // Limit to most recent 8 commits to keep changelog concise
  const recentCommits = userFacingCommits.slice(0, 8)
  
  // Group by type
  const features = recentCommits.filter(c => c.type === 'feat')
  const fixes = recentCommits.filter(c => c.type === 'fix')
  const perf = recentCommits.filter(c => c.type === 'perf')
  const docs = recentCommits.filter(c => c.type === 'docs' && c.isUserFacing)
  
  // Generate title based on primary change type
  let title = 'Improvements'
  if (features.length > 0) {
    title = features.length === 1 ? 'New feature' : 'New features'
  } else if (fixes.length >= 2) {
    title = 'Bug fixes'
  } else if (perf.length > 0) {
    title = 'Performance improvements'
  }
  
  // Generate changes list (limit to 6 items max)
  const changes: string[] = []
  
  // Prioritize features, then fixes, then perf, then docs
  const allChanges = [
    ...features.map(c => c.message.replace(/^feat:\s*/i, '').trim()),
    ...fixes.map(c => c.message.replace(/^fix:\s*/i, '').trim()),
    ...perf.map(c => c.message.replace(/^perf:\s*/i, '').trim()),
    ...docs.map(c => c.message.replace(/^docs:\s*/i, '').trim()),
  ]
  
  // Take first 6 changes and clean them up
  const cleanedChanges = allChanges
    .slice(0, 6)
    .map(c => {
      // Remove version bump references
      c = c.replace(/bump version to [\d.]+/i, '').trim()
      // Capitalize first letter
      if (c.length > 0) {
        c = c.charAt(0).toUpperCase() + c.slice(1)
      }
      return c
    })
    .filter(c => c.length > 0)
  
  if (cleanedChanges.length === 0) {
    cleanedChanges.push('Various improvements and bug fixes')
  }
  
  // Format as TypeScript code
  return `  {
    version: "${newVersion}",
    date: "${buildDate}",
    title: "${title}",
    changes: [
${cleanedChanges.map(c => `      "${c.replace(/"/g, '\\"')}"`).join(',\n')}
    ],
  },`
}

function updateChangelog(newVersion: string, buildDate: string, commits: CommitInfo[]) {
  const changelogPath = join(process.cwd(), 'lib/config/changelog.ts')
  let content = readFileSync(changelogPath, 'utf-8')
  
  // Find the CHANGELOG array start
  const arrayStart = content.indexOf('export const CHANGELOG: ChangelogEntry[] = [')
  if (arrayStart === -1) {
    console.warn('⚠️  Could not find CHANGELOG array, skipping update')
    return false
  }
  
  // Find the first entry (after the opening bracket)
  const firstEntryStart = content.indexOf('  {', arrayStart)
  if (firstEntryStart === -1) {
    console.warn('⚠️  Could not find first changelog entry, skipping update')
    return false
  }
  
  // Generate new entry
  const newEntry = generateChangelogEntry(commits, newVersion, buildDate)
  
  // Insert after the opening bracket
  const insertPosition = firstEntryStart
  const before = content.substring(0, insertPosition)
  const after = content.substring(insertPosition)
  
  content = before + newEntry + '\n' + after
  
  writeFileSync(changelogPath, content, 'utf-8')
  console.log(`✅ Updated lib/config/changelog.ts`)
  return true
}

function main() {
  const versionFilePath = join(process.cwd(), 'lib/config/version.ts')
  const versionFileContent = readFileSync(versionFilePath, 'utf-8')
  
  // Extract current version
  const versionMatch = versionFileContent.match(/export const APP_VERSION = "([\d.]+)"/)
  if (!versionMatch) {
    console.error('❌ Could not find APP_VERSION in version.ts')
    process.exit(1)
  }
  
  const currentVersion = versionMatch[1]
  const newVersion = incrementVersion(currentVersion)
  const buildDate = getBuildDate()
  
  console.log(`📦 Incrementing version: ${currentVersion} → ${newVersion}`)
  console.log(`📅 Build date: ${buildDate}`)
  
  updateVersionFile(newVersion, buildDate)
  updatePackageJson(newVersion)
  
  // Check for significant changes and auto-update changelog
  const recentCommits = getRecentCommits(currentVersion)
  if (shouldUpdateChangelog(recentCommits)) {
    console.log(`\n📝 Detected significant user-facing changes, updating changelog...`)
    const updated = updateChangelog(newVersion, buildDate, recentCommits)
    if (updated) {
      console.log(`   Added changelog entry for ${newVersion}`)
    }
  } else {
    console.log(`\n💡 No significant user-facing changes detected (threshold not met)`)
    console.log(`   Changelog will not be auto-updated. Add entry manually if needed.`)
  }
  
  console.log(`\n✅ Version incremented successfully!`)
  console.log(`   New version: ${newVersion}`)
  console.log(`   Build date: ${buildDate}`)
  console.log(`\n💡 Remember to commit these changes before deploying.`)
}

main()

