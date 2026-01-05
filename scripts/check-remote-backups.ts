#!/usr/bin/env tsx
/**
 * Check remote git branches for backup files
 */

import { execSync } from 'child_process';

async function main() {
  console.log('\n🔍 Checking Remote Repositories for Backups\n');
  console.log('═'.repeat(80));

  // Get all remote branches
  const remoteBranches = execSync('git branch -r', { encoding: 'utf-8' })
    .split('\n')
    .map(b => b.trim())
    .filter(b => b && !b.includes('HEAD'));

  console.log(`\n📦 Found ${remoteBranches.length} remote branches\n`);

  const branchesWithBackups: Array<{
    branch: string;
    files: string[];
    commit: string;
    date: string;
  }> = [];

  for (const branch of remoteBranches) {
    try {
      // Check if branch has backup files
      const files = execSync(
        `git ls-tree -r ${branch} --name-only | grep -E "(backup.*\\.json|books\\.json|content_warnings\\.json)"`,
        { encoding: 'utf-8', stdio: 'pipe' }
      ).split('\n').filter(f => f.trim());

      if (files.length > 0) {
        // Get latest commit with backup files
        const commitInfo = execSync(
          `git log ${branch} --oneline --format="%h %ai" -1 -- "${files[0]}"`,
          { encoding: 'utf-8', stdio: 'pipe' }
        ).trim();

        branchesWithBackups.push({
          branch,
          files: files.slice(0, 10), // Limit to first 10 files
          commit: commitInfo.split(' ')[0] || 'unknown',
          date: commitInfo.split(' ').slice(1).join(' ') || 'unknown',
        });
      }
    } catch (error) {
      // Branch might not exist or have no backup files
    }
  }

  if (branchesWithBackups.length === 0) {
    console.log('❌ No backup files found in remote branches');
    return;
  }

  console.log(`\n✅ Found ${branchesWithBackups.length} branches with backup files:\n`);

  for (const branchInfo of branchesWithBackups) {
    console.log(`\n📁 ${branchInfo.branch}`);
    console.log(`   Commit: ${branchInfo.commit}`);
    console.log(`   Date: ${branchInfo.date}`);
    console.log(`   Files: ${branchInfo.files.length}`);
    branchInfo.files.slice(0, 5).forEach(file => {
      console.log(`      - ${file}`);
    });
    if (branchInfo.files.length > 5) {
      console.log(`      ... and ${branchInfo.files.length - 5} more`);
    }
  }

  // Check if we can extract data from these branches
  console.log(`\n\n🔍 Checking if we can extract ISBNs from remote backups...\n`);

  for (const branchInfo of branchesWithBackups) {
    const booksFile = branchInfo.files.find(f => f.includes('books.json'));
    if (booksFile) {
      try {
        const content = execSync(
          `git show ${branchInfo.branch}:${booksFile}`,
          { encoding: 'utf-8', stdio: 'pipe', maxBuffer: 10 * 1024 * 1024 }
        );
        
        const books = JSON.parse(content);
        if (Array.isArray(books)) {
          const isbns = books.map((b: any) => b.isbn).filter(Boolean);
          console.log(`\n   ${branchInfo.branch}:`);
          console.log(`      Books: ${books.length}`);
          console.log(`      ISBNs: ${isbns.length}`);
          console.log(`      Sample ISBNs: ${isbns.slice(0, 5).join(', ')}`);
        }
      } catch (error) {
        console.log(`   ${branchInfo.branch}: Could not parse (${error instanceof Error ? error.message : 'error'})`);
      }
    }
  }

  console.log('\n');
  console.log('═'.repeat(80));
  console.log('\n✅ Remote Backup Check Complete!\n');
}

main().catch(console.error);


