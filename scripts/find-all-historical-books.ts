#!/usr/bin/env tsx
/**
 * Find all books that ever existed by checking git history
 */

import { execSync } from 'child_process';

async function main() {
  console.log('\n🔍 Finding All Historical Books from Git History\n');
  console.log('═'.repeat(80));

  // Get all commits that mention books, ISBNs, or restoration
  const commits = execSync(
    'git log --all --oneline --grep="book\|isbn\|restore\|sample\|collection" -i',
    { encoding: 'utf-8' }
  ).split('\n').filter(l => l.trim());

  console.log(`\n📚 Found ${commits.length} relevant commits\n`);

  const allIsbns = new Set<string>();
  const bookReferences: Array<{
    commit: string;
    date: string;
    message: string;
    isbns: string[];
  }> = [];

  // Check specific commits that mention books
  const keyCommits = [
    '1f270f2', // Restore original collection: 5 books
    'ba5a8c8', // Add sample books restoration API
    '19c2fd1', // Clear all books and covers
  ];

  for (const commitHash of keyCommits) {
    try {
      const commitInfo = execSync(
        `git log ${commitHash} --format="%H %ai %s" -1`,
        { encoding: 'utf-8' }
      ).trim();

      const [hash, ...dateParts] = commitInfo.split(' ');
      const date = dateParts.slice(0, 2).join(' ');
      const message = commitInfo.split('  ').slice(1).join('  ');

      // Try to extract ISBNs from the commit
      const diff = execSync(
        `git show ${commitHash} --no-patch --format="%B"`,
        { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
      );

      // Look for ISBN patterns
      const isbnMatches = diff.match(/\b\d{10,13}\b/g) || [];
      const isbns = [...new Set(isbnMatches.filter(isbn => 
        isbn.length === 10 || isbn.length === 13
      ))];

      if (isbns.length > 0 || message.includes('book') || message.includes('ISBN')) {
        bookReferences.push({
          commit: hash,
          date,
          message,
          isbns,
        });

        isbns.forEach(isbn => allIsbns.add(isbn));
      }
    } catch (error) {
      // Commit might not exist
    }
  }

  // Also check the restore-sample-books file if it exists in history
  try {
    const restoreFile = execSync(
      'git log --all --format="%H" -- "**/restore-sample-books*" | head -1',
      { encoding: 'utf-8' }
    ).trim();

    if (restoreFile) {
      const fileContent = execSync(
        `git show ${restoreFile}:app/api/restore-sample-books/route.ts`,
        { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
      );

      // Extract ISBNs from the file
      const isbnMatches = fileContent.match(/['"](\d{10,13})['"]/g) || [];
      const isbns = isbnMatches.map(m => m.replace(/['"]/g, ''));

      console.log(`\n📖 Found restore-sample-books file in commit ${restoreFile}`);
      console.log(`   ISBNs found: ${isbns.length}`);
      isbns.forEach(isbn => allIsbns.add(isbn));
    }
  } catch (error) {
    // File might not exist
  }

  console.log(`\n\n📊 SUMMARY:`);
  console.log(`   Total unique ISBNs found in history: ${allIsbns.size}`);
  console.log(`   Commits with book references: ${bookReferences.length}`);

  if (bookReferences.length > 0) {
    console.log(`\n\n📝 Key Commits:`);
    bookReferences.forEach(ref => {
      console.log(`\n   ${ref.commit.substring(0, 7)} - ${ref.date}`);
      console.log(`   ${ref.message}`);
      if (ref.isbns.length > 0) {
        console.log(`   ISBNs: ${ref.isbns.slice(0, 5).join(', ')}${ref.isbns.length > 5 ? '...' : ''}`);
      }
    });
  }

  if (allIsbns.size > 0) {
    console.log(`\n\n📚 All Historical ISBNs Found:`);
    const isbnArray = Array.from(allIsbns).sort();
    isbnArray.forEach((isbn, idx) => {
      if (idx < 20) {
        console.log(`   ${isbn}`);
      }
    });
    if (isbnArray.length > 20) {
      console.log(`   ... and ${isbnArray.length - 20} more`);
    }
  }

  console.log('\n');
  console.log('═'.repeat(80));
  console.log('\n✅ Historical Book Search Complete!\n');
}

main().catch(console.error);

