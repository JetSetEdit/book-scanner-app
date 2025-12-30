#!/usr/bin/env node
/**
 * Clear Database Script
 * WARNING: This will delete ALL data from the database
 * Make sure you have a backup before running this!
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearTable(tableName) {
  console.log(`🗑️  Clearing ${tableName}...`);
  
  const { error } = await supabase
    .from(tableName)
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using a condition that's always true)
  
  if (error) {
    console.error(`❌ Error clearing ${tableName}:`, error.message);
    return false;
  }
  
  console.log(`✅ ${tableName} cleared`);
  return true;
}

async function main() {
  // Safety check
  const args = process.argv.slice(2);
  if (args[0] !== '--confirm') {
    console.error('⚠️  WARNING: This will delete ALL data from the database!');
    console.error('⚠️  Make sure you have a backup before proceeding!');
    console.error('\nTo proceed, run: node scripts/clear-database.js --confirm');
    process.exit(1);
  }
  
  console.log('🗑️  Starting database clear...\n');
  
  // Clear in order (respecting foreign key constraints)
  const tables = [
    'content_warnings',           // Has foreign key to books
    'ai_audit_logs',              // Has foreign key to books
    'warning_validations',        // Has foreign key to content_warnings
    'rlhf_warning_examples',      // May have foreign keys
    'rlhf_reviews',               // May have foreign keys
    'rlhf_comparisons',           // May have foreign keys
    'rlhf_category_comparisons',  // May have foreign keys
    'spice_ratings',              // May have foreign keys
    'author_context',             // May have foreign keys
    'scans',                      // May have foreign keys
    'books'                       // Parent table (clear last)
  ];
  
  for (const table of tables) {
    const success = await clearTable(table);
    if (!success) {
      console.error(`\n❌ Failed to clear ${table}. Aborting.`);
      process.exit(1);
    }
  }
  
  console.log('\n✅ Database cleared successfully!');
}

main().catch((error) => {
  console.error('❌ Clear failed:', error);
  process.exit(1);
});

