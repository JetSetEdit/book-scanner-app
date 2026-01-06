#!/usr/bin/env tsx
/**
 * Backfill audit logs for books that have AI-generated warnings but no audit log.
 * This fixes the issue where books show as "not analyzed" even though they have warnings.
 */

import dotenv from 'dotenv';

// Load environment variables first, before any imports
dotenv.config({ path: '.env.local' });
dotenv.config(); // Also load .env if it exists

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function backfillMissingAuditLogs() {
  console.log('🔄 Backfilling missing audit logs for books with warnings...\n');

  // Find books that have AI-generated warnings but no audit log
  const { data: booksWithWarnings, error: booksError } = await supabaseAdmin
    .from('books')
    .select(`
      id,
      isbn,
      title,
      author,
      description,
      content_warnings!inner (
        id,
        source,
        severity
      ),
      ai_audit_logs (
        id,
        decision_type
      )
    `)
    .eq('content_warnings.source', 'ai_generated');

  if (booksError) {
    console.error('Error fetching books:', booksError);
    return;
  }

  if (!booksWithWarnings || booksWithWarnings.length === 0) {
    console.log('✅ No books found with warnings but missing audit logs.');
    return;
  }

  console.log(`Found ${booksWithWarnings.length} book(s) with AI-generated warnings.\n`);

  let backfilled = 0;
  let skipped = 0;

  for (const book of booksWithWarnings) {
    const warnings = (book.content_warnings as any[]) || [];
    const auditLogs = (book.ai_audit_logs as any[]) || [];
    
    // Check if book already has an audit log
    const hasAuditLog = auditLogs.some(log => 
      log.decision_type === 'warnings_generated' || log.decision_type === 'no_warnings'
    );

    if (hasAuditLog) {
      skipped++;
      continue;
    }

    // Count AI-generated warnings
    const aiWarnings = warnings.filter(w => w.source === 'ai_generated');
    const warningCount = aiWarnings.length;

    if (warningCount === 0) {
      skipped++;
      continue;
    }

    console.log(`📖 "${book.title}" by ${book.author || 'Unknown'}`);
    console.log(`   ISBN: ${book.isbn}`);
    console.log(`   Warnings: ${warningCount}`);
    console.log(`   Status: Missing audit log - creating one...`);

    // Create audit log
    const { error: insertError } = await supabaseAdmin
      .from('ai_audit_logs')
      .insert({
        book_id: book.id,
        isbn: book.isbn,
        decision_type: 'warnings_generated',
        warnings_count: warningCount,
        ai_reasoning: `[BACKFILLED] Book has ${warningCount} AI-generated warning(s) but was missing an audit log. This audit log was created retroactively from existing warnings. Original analysis was completed but audit log creation may have failed.`,
        confidence_level: 'medium', // Medium confidence since we're backfilling
        book_title: book.title,
        book_author: book.author,
        description_length: book.description?.length || null,
        model_version: 'backfilled',
        taxonomy_version: '2.5.0',
        pipeline_path: 'backfill_script'
      });

    if (insertError) {
      console.error(`   ❌ Failed to create audit log: ${insertError.message}`);
    } else {
      console.log(`   ✅ Created audit log`);
      backfilled++;
    }
    console.log('');
  }

  console.log('\n📊 Summary:');
  console.log(`   Books processed: ${booksWithWarnings.length}`);
  console.log(`   Audit logs created: ${backfilled}`);
  console.log(`   Skipped (already have audit logs): ${skipped}`);
  console.log('\n✅ Backfill complete!');
}

backfillMissingAuditLogs().catch(console.error);

