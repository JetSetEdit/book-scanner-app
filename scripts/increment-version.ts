/**
 * Version Increment Script
 * 
 * Automatically increments the version number for each deployment.
 * Updates both lib/config/version.ts and package.json
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

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
  
  // Update APP_VERSION_LABEL (extract beta number from version)
  // Format: 1.01.0 -> "Public Beta 1.01" (major.minor format)
  const versionParts = newVersion.split('.')
  const major = versionParts[0] || '1'
  const minor = versionParts[1] || '01'
  const versionLabel = `Public Beta ${major}.${minor}`
  content = content.replace(
    /export const APP_VERSION_LABEL = "Public Beta [\d.]+"/,
    `export const APP_VERSION_LABEL = "${versionLabel}"`
  )
  
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
  
  console.log(`\n✅ Version incremented successfully!`)
  console.log(`   New version: ${newVersion}`)
  console.log(`   Build date: ${buildDate}`)
  console.log(`\n💡 Remember to commit these changes before deploying.`)
}

main()

