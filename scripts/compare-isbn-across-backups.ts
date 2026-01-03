#!/usr/bin/env tsx
/**
 * Compare ISBNs across database backups to see if content warnings changed
 * 
 * Usage: npx tsx scripts/compare-isbn-across-backups.ts
 */

import dotenv from 'dotenv';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: '.env.local' });
dotenv.config();

interface BookRecord {
  isbn: string;
  title: string;
  id?: string;
  has_warnings?: boolean;
  warning_count?: number;
}

interface BackupData {
  backup_name: string;
  backup_date: string;
  books: Map<string, BookRecord>;
  warnings: Map<string, number>; // isbn -> warning count
}

async function main() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('\n🔍 Comparing ISBNs Across Backups and Current Database\n');
  console.log('═'.repeat(80));

  // Get current database state
  console.log('\n📊 Current Database State:');
  const { data: currentBooks } = await supabase
    .from('books')
    .select('isbn, title, id');

  const { data: currentWarnings } = await supabase
    .from('content_warnings')
    .select('book_id, id');

  // Map current state
  const currentState = new Map<string, { title: string; warning_count: number }>();
  const warningCounts = new Map<string, number>();
  
  currentWarnings?.forEach(w => {
    const count = warningCounts.get(w.book_id) || 0;
    warningCounts.set(w.book_id, count + 1);
  });

  currentBooks?.forEach(book => {
    if (book.isbn && book.id) {
      currentState.set(book.isbn, {
        title: book.title || 'Unknown',
        warning_count: warningCounts.get(book.id) || 0,
      });
    }
  });

  console.log(`   Books in current DB: ${currentState.size}`);
  console.log(`   Books with warnings: ${Array.from(currentState.values()).filter(b => b.warning_count > 0).length}`);
  console.log(`   Books without warnings: ${Array.from(currentState.values()).filter(b => b.warning_count === 0).length}`);

  // Load backups
  const backupsDir = join(process.cwd(), 'backups');
  const backups: BackupData[] = [];

  try {
    // Find all backup directories, including nested ones
    const findAllBackups = (dir: string, basePath: string = ''): string[] => {
      const results: string[] = [];
      const entries = readdirSync(dir);
      
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const relativePath = join(basePath, entry);
        
        if (statSync(fullPath).isDirectory()) {
          if (entry.startsWith('backup-')) {
            results.push(relativePath);
          } else {
            // Recursively search in subdirectories
            results.push(...findAllBackups(fullPath, relativePath));
          }
        }
      }
      
      return results;
    };
    
    const backupDirs = findAllBackups(backupsDir).sort();

    console.log(`\n📦 Found ${backupDirs.length} backup directories`);

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

          const books = new Map<string, BookRecord>();
          const warnings = new Map<string, number>();

          // Process books
          if (Array.isArray(booksData)) {
            booksData.forEach((book: any) => {
              if (book.isbn) {
                books.set(book.isbn, {
                  isbn: book.isbn,
                  title: book.title || 'Unknown',
                  id: book.id,
                });
              }
            });
          }

          // Process warnings - count by book_id, then map to ISBN
          const warningCountsByBookId = new Map<string, number>();
          if (Array.isArray(warningsData)) {
            warningsData.forEach((w: any) => {
              if (w.book_id) {
                const count = warningCountsByBookId.get(w.book_id) || 0;
                warningCountsByBookId.set(w.book_id, count + 1);
              }
            });
          }

          // Map book_id to ISBN
          books.forEach((book, isbn) => {
            if (book.id) {
              const count = warningCountsByBookId.get(book.id) || 0;
              warnings.set(isbn, count);
            }
          });

          backups.push({
            backup_name: backupDir,
            backup_date: backupDir.replace('backup-', '').replace('T', ' ').replace(/-/g, ':').slice(0, -3),
            books,
            warnings,
          });

          console.log(`   ✅ Loaded: ${backupDir} (${books.size} books, ${Array.from(warnings.values()).filter(c => c > 0).length} with warnings)`);
        }
      } catch (error) {
        console.log(`   ⚠️  Skipped: ${backupDir} (${error instanceof Error ? error.message : 'unknown error'})`);
      }
    }
  } catch (error) {
    console.error('Error reading backups:', error);
  }

  // Find ISBNs that appear in multiple backups
  console.log('\n\n🔍 Analyzing ISBN Changes Across Iterations:\n');
  console.log('─'.repeat(80));

  const allIsbns = new Set<string>();
  currentState.forEach((_, isbn) => allIsbns.add(isbn));
  backups.forEach(backup => {
    backup.books.forEach((_, isbn) => allIsbns.add(isbn));
  });

  const changes: Array<{
    isbn: string;
    title: string;
    history: Array<{ backup: string; warning_count: number }>;
    current: number;
    changed: boolean;
  }> = [];

  for (const isbn of allIsbns) {
    const history: Array<{ backup: string; warning_count: number }> = [];
    
    // Get warning counts from each backup
    for (const backup of backups) {
      if (backup.books.has(isbn)) {
        const warningCount = backup.warnings.get(isbn) || 0;
        history.push({
          backup: backup.backup_date,
          warning_count: warningCount,
        });
      }
    }

    // Get current state
    const current = currentState.get(isbn);
    const currentCount = current?.warning_count || 0;
    const title = current?.title || backups.find(b => b.books.has(isbn))?.books.get(isbn)?.title || 'Unknown';

    // Check if warnings changed
    const previousCount = history.length > 0 ? history[history.length - 1].warning_count : 0;
    const changed = currentCount !== previousCount || history.some(h => h.warning_count !== currentCount);

    if (changed || history.length > 0) {
      changes.push({
        isbn,
        title,
        history,
        current: currentCount,
        changed,
      });
    }
  }

  // Group by change type
  const gainedWarnings = changes.filter(c => c.current > 0 && (c.history.length === 0 || c.history[c.history.length - 1].warning_count === 0));
  const lostWarnings = changes.filter(c => c.current === 0 && c.history.length > 0 && c.history[c.history.length - 1].warning_count > 0);
  const warningCountChanged = changes.filter(c => {
    if (c.history.length === 0) return false;
    const last = c.history[c.history.length - 1].warning_count;
    return c.current !== last && c.current > 0 && last > 0;
  });
  const alwaysHadWarnings = changes.filter(c => c.current > 0 && c.history.length > 0 && c.history.every(h => h.warning_count > 0));
  const neverHadWarnings = changes.filter(c => c.current === 0 && (c.history.length === 0 || c.history.every(h => h.warning_count === 0)));

  console.log(`\n📊 Summary:`);
  console.log(`   Total ISBNs analyzed: ${changes.length}`);
  console.log(`   📈 Gained warnings: ${gainedWarnings.length}`);
  console.log(`   📉 Lost warnings: ${lostWarnings.length}`);
  console.log(`   🔄 Warning count changed: ${warningCountChanged.length}`);
  console.log(`   ✅ Always had warnings: ${alwaysHadWarnings.length}`);
  console.log(`   ✅ Never had warnings: ${neverHadWarnings.length}`);

  // Show examples of each category
  if (gainedWarnings.length > 0) {
    console.log(`\n\n📈 Books That GAINED Warnings (Previously None):`);
    console.log('─'.repeat(80));
    gainedWarnings.slice(0, 10).forEach(book => {
      console.log(`\n   ${book.isbn} - ${book.title}`);
      console.log(`   Before: 0 warnings`);
      console.log(`   Now: ${book.current} warnings`);
      if (book.history.length > 0) {
        console.log(`   Last backup: ${book.history[book.history.length - 1].backup} (${book.history[book.history.length - 1].warning_count} warnings)`);
      }
    });
    if (gainedWarnings.length > 10) {
      console.log(`\n   ... and ${gainedWarnings.length - 10} more`);
    }
  }

  if (lostWarnings.length > 0) {
    console.log(`\n\n📉 Books That LOST Warnings (Previously Had Some):`);
    console.log('─'.repeat(80));
    lostWarnings.slice(0, 10).forEach(book => {
      console.log(`\n   ${book.isbn} - ${book.title}`);
      const last = book.history[book.history.length - 1];
      console.log(`   Before: ${last.warning_count} warnings (${last.backup})`);
      console.log(`   Now: 0 warnings`);
    });
    if (lostWarnings.length > 10) {
      console.log(`\n   ... and ${lostWarnings.length - 10} more`);
    }
  }

  if (warningCountChanged.length > 0) {
    console.log(`\n\n🔄 Books With Changed Warning Counts:`);
    console.log('─'.repeat(80));
    warningCountChanged.slice(0, 10).forEach(book => {
      const last = book.history[book.history.length - 1];
      console.log(`\n   ${book.isbn} - ${book.title}`);
      console.log(`   Before: ${last.warning_count} warnings`);
      console.log(`   Now: ${book.current} warnings`);
    });
    if (warningCountChanged.length > 10) {
      console.log(`\n   ... and ${warningCountChanged.length - 10} more`);
    }
  }

  // Show Romance books specifically
  const romanceBooks = changes.filter(c => 
    c.title.toLowerCase().includes('romance') ||
    c.title.toLowerCase().includes('love') ||
    c.title.toLowerCase().includes('dating')
  );

  if (romanceBooks.length > 0) {
    console.log(`\n\n💕 Romance Books Analysis:`);
    console.log('─'.repeat(80));
    console.log(`   Total Romance books: ${romanceBooks.length}`);
    console.log(`   With warnings: ${romanceBooks.filter(b => b.current > 0).length}`);
    console.log(`   Without warnings: ${romanceBooks.filter(b => b.current === 0).length}`);
    console.log(`   Gained warnings: ${romanceBooks.filter(b => gainedWarnings.includes(b)).length}`);
    console.log(`   Lost warnings: ${romanceBooks.filter(b => lostWarnings.includes(b)).length}`);
  }

  console.log('\n');
  console.log('═'.repeat(80));
  console.log('\n✅ Analysis Complete!\n');
}

main().catch(console.error);

