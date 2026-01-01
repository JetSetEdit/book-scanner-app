#!/usr/bin/env node
/**
 * Clear Data but Keep Schema Script
 * WARNING: This will delete ALL DATA from tables but keeps the schema/columns
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

async function clearTableData(tableName) {
  console.log(`🗑️  Clearing data from ${tableName}...`);
  
  const { error } = await supabase
    .from(tableName)
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using a condition that's always true)
  
  if (error) {
    console.error(`❌ Error clearing ${tableName}:`, error.message);
    return false;
  }
  
  console.log(`✅ ${tableName} data cleared (schema preserved)`);
  return true;
}

async function main() {
  // Safety check
  const args = process.argv.slice(2);
  if (args[0] !== '--confirm') {
    console.error('⚠️  WARNING: This will delete ALL DATA from the database!');
    console.error('⚠️  Schema and columns will be preserved, but all rows will be deleted!');
    console.error('⚠️  Make sure you have a backup before proceeding!');
    console.error('\nTo proceed, run: node scripts/clear-data-keep-schema.js --confirm');
    process.exit(1);
  }
  
  console.log('🗑️  Starting data clear (keeping schema)...\n');
  
  // Clear in order (respecting foreign key constraints)
  // Start with child tables, end with parent tables
  const tables = [
    'warning_validations',        // Child of content_warnings
    'rlhf_warning_examples',       // Child of content_warnings
    'content_warnings',            // Child of books
    'ai_audit_logs',               // Child of books
    'spice_ratings',               // Child of books
    'rlhf_comparisons',            // Child of books
    'rlhf_reviews',                // Child of books
    'scans',                       // Child of books
    'manual_handling_scans',       // Standalone
    'rlhf_category_comparisons',   // Standalone
    'author_context',              // Standalone
    'books'                        // Parent table (clear last)
  ];
  
  for (const table of tables) {
    const success = await clearTableData(table);
    if (!success) {
      console.error(`\n❌ Failed to clear ${table}. Aborting.`);
      process.exit(1);
    }
  }
  
  console.log('\n✅ All data cleared successfully!');
  console.log('✅ Schema and columns preserved!');
  console.log('\n📊 Database is now clean and ready for fresh scans.');
}

main().catch((error) => {
  console.error('❌ Clear failed:', error);
  process.exit(1);
});

