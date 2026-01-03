#!/usr/bin/env tsx
/**
 * Comprehensive ISBN Analysis Across All Backups
 * Extracts all ISBNs from all backups and compares with current database
 */

import dotenv from 'dotenv';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

dotenv.config({ path: '.env.local' });
dotenv.config();

interface BookData {
  isbn: string;
  title: string;
  warning_count: number;
}

async function main() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('\n🔍 COMPREHENSIVE ISBN ANALYSIS ACROSS ALL BACKUPS\n');
  console.log('═'.repeat(80));

  // Get current database state
  const { data: currentBooks } = await supabase
    .from('books')
    .select('isbn, title, id');

  const { data: currentWarnings } = await supabase
    .from('content_warnings')
    .select('book_id');

  const warningCounts = new Map<string, number>();
  currentWarnings?.forEach(w => {
    const count = warningCounts.get(w.book_id) || 0;
    warningCounts.set(w.book_id, count + 1);
  });

  const currentState = new Map<string, BookData>();
  currentBooks?.forEach(book => {
    if (book.isbn && book.id) {
      currentState.set(book.isbn, {
        isbn: book.isbn,
        title: book.title || 'Unknown',
        warning_count: warningCounts.get(book.id) || 0,
      });
    }
  });

  console.log(`\n📊 Current Database: ${currentState.size} books`);

  // Load all backups
  const backupsDir = join(process.cwd(), 'backups');
  const allBackups: Array<{
    name: string;
    date: string;
    books: Map<string, BookData>;
  }> = [];

  const findAllBackups = (dir: string, basePath: string = ''): string[] => {
    const results: string[] = [];
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const relativePath = join(basePath, entry);
        
        if (statSync(fullPath).isDirectory()) {
          if (entry.startsWith('backup-')) {
            results.push(relativePath);
          } else {
            results.push(...findAllBackups(fullPath, relativePath));
          }
        }
      }
    } catch (error) {
      // Skip if can't read
    }
    return results;
  };

  const backupDirs = findAllBackups(backupsDir).sort();

  console.log(`\n📦 Found ${backupDirs.length} backup directories\n`);

  for (const backupDir of backupDirs) {
    const backupPath = join(backupsDir, backupDir);
    const booksPath = join(backupPath, 'books.json');
    const warningsPath = join(backupPath, 'content_warnings.json');

    try {
      if (readFileSync(booksPath, 'utf-8')) {
        const booksData = JSON.parse(readFileSync(booksPath, 'utf-8'));
        const warningsData = readFileSync(warningsPath, 'utf-8') 
          ? JSON.parse(readFileSync(warningsPath, 'utf-8'))
          : [];

        const books = new Map<string, BookData>();
        const warningCountsByBookId = new Map<string, number>();

        // Process warnings
        if (Array.isArray(warningsData)) {
          warningsData.forEach((w: any) => {
            if (w.book_id) {
              const count = warningCountsByBookId.get(w.book_id) || 0;
              warningCountsByBookId.set(w.book_id, count + 1);
            }
          });
        }

        // Process books
        if (Array.isArray(booksData)) {
          booksData.forEach((book: any) => {
            if (book.isbn) {
              const warningCount = book.id ? (warningCountsByBookId.get(book.id) || 0) : 0;
              books.set(book.isbn, {
                isbn: book.isbn,
                title: book.title || 'Unknown',
                warning_count: warningCount,
              });
            }
          });
        }

        const dateStr = backupDir.replace('backup-', '').replace('T', ' ').replace(/-/g, ':').slice(0, -3);
        allBackups.push({
          name: backupDir,
          date: dateStr,
          books,
        });

        console.log(`   ✅ ${backupDir}`);
        console.log(`      ${books.size} books, ${Array.from(books.values()).filter(b => b.warning_count > 0).length} with warnings`);
      }
    } catch (error) {
      console.log(`   ⚠️  ${backupDir} - ${error instanceof Error ? error.message : 'error'}`);
    }
  }

  // Collect all unique ISBNs from all backups
  const allIsbns = new Set<string>();
  currentState.forEach((_, isbn) => allIsbns.add(isbn));
  allBackups.forEach(backup => {
    backup.books.forEach((_, isbn) => allIsbns.add(isbn));
  });

  console.log(`\n\n📊 TOTAL UNIQUE ISBNs FOUND: ${allIsbns.size}`);

  // Analyze each ISBN
  const analysis: Array<{
    isbn: string;
    title: string;
    inCurrentDb: boolean;
    currentWarnings: number;
    backupHistory: Array<{ date: string; warnings: number }>;
    status: string;
  }> = [];

  for (const isbn of allIsbns) {
    const current = currentState.get(isbn);
    const backupHistory: Array<{ date: string; warnings: number }> = [];

    for (const backup of allBackups) {
      const book = backup.books.get(isbn);
      if (book) {
        backupHistory.push({
          date: backup.date,
          warnings: book.warning_count,
        });
      }
    }

    const title = current?.title || allBackups.find(b => b.books.has(isbn))?.books.get(isbn)?.title || 'Unknown';
    
    let status = '';
    if (!current) {
      status = '❌ DELETED';
    } else if (current.warning_count > 0) {
      status = '✅ HAS WARNINGS';
    } else {
      status = '✨ NO WARNINGS';
    }

    analysis.push({
      isbn,
      title,
      inCurrentDb: !!current,
      currentWarnings: current?.warning_count || 0,
      backupHistory,
      status,
    });
  }

  // Categorize
  const deleted = analysis.filter(a => !a.inCurrentDb);
  const gainedWarnings = analysis.filter(a => 
    a.inCurrentDb && 
    a.currentWarnings > 0 && 
    (a.backupHistory.length === 0 || a.backupHistory[a.backupHistory.length - 1].warnings === 0)
  );
  const lostWarnings = analysis.filter(a => 
    a.inCurrentDb && 
    a.currentWarnings === 0 && 
    a.backupHistory.length > 0 && 
    a.backupHistory[a.backupHistory.length - 1].warnings > 0
  );
  const alwaysSafe = analysis.filter(a => 
    a.inCurrentDb && 
    a.currentWarnings === 0 && 
    (a.backupHistory.length === 0 || a.backupHistory.every(h => h.warnings === 0))
  );
  const alwaysHadWarnings = analysis.filter(a => 
    a.inCurrentDb && 
    a.currentWarnings > 0 && 
    a.backupHistory.length > 0 && 
    a.backupHistory.every(h => h.warnings > 0)
  );

  console.log(`\n\n📈 ANALYSIS SUMMARY:`);
  console.log(`   Total ISBNs: ${analysis.length}`);
  console.log(`   ❌ Deleted: ${deleted.length}`);
  console.log(`   📈 Gained warnings: ${gainedWarnings.length}`);
  console.log(`   📉 Lost warnings: ${lostWarnings.length}`);
  console.log(`   ✨ Always safe: ${alwaysSafe.length}`);
  console.log(`   ✅ Always had warnings: ${alwaysHadWarnings.length}`);

  // Show deleted books
  if (deleted.length > 0) {
    console.log(`\n\n❌ DELETED BOOKS (${deleted.length}):`);
    console.log('─'.repeat(80));
    deleted.slice(0, 30).forEach(book => {
      const lastBackup = book.backupHistory[book.backupHistory.length - 1];
      console.log(`\n   ${book.isbn} - ${book.title}`);
      if (lastBackup) {
        console.log(`   Last seen: ${lastBackup.date} (${lastBackup.warnings} warnings)`);
      }
    });
    if (deleted.length > 30) {
      console.log(`\n   ... and ${deleted.length - 30} more`);
    }
  }

  // Show books that lost warnings
  if (lostWarnings.length > 0) {
    console.log(`\n\n📉 BOOKS THAT LOST WARNINGS (${lostWarnings.length}):`);
    console.log('─'.repeat(80));
    lostWarnings.forEach(book => {
      const lastBackup = book.backupHistory[book.backupHistory.length - 1];
      console.log(`\n   ${book.isbn} - ${book.title}`);
      console.log(`   Before: ${lastBackup.warnings} warnings (${lastBackup.date})`);
      console.log(`   Now: 0 warnings`);
    });
  }

  console.log('\n');
  console.log('═'.repeat(80));
  console.log('\n✅ Analysis Complete!\n');
}

main().catch(console.error);

