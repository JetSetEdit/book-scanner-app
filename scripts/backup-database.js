#!/usr/bin/env node
/**
 * Database Backup Script
 * Exports all data from Supabase to JSON files
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BACKUP_DIR = path.join(__dirname, '../backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

// Create backup directory
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}
fs.mkdirSync(backupPath, { recursive: true });

async function backupTable(tableName) {
  console.log(`📦 Backing up ${tableName}...`);
  
  const { data, error } = await supabase
    .from(tableName)
    .select('*');
  
  if (error) {
    console.error(`❌ Error backing up ${tableName}:`, error.message);
    return null;
  }
  
  const filePath = path.join(backupPath, `${tableName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  
  console.log(`✅ ${tableName}: ${data?.length || 0} records`);
  return data;
}

async function main() {
  console.log('🔄 Starting database backup...\n');
  
  const tables = [
    'books',
    'content_warnings',
    'ai_audit_logs'
  ];
  
  const backup = {
    timestamp: new Date().toISOString(),
    tables: {}
  };
  
  for (const table of tables) {
    const data = await backupTable(table);
    if (data) {
      backup.tables[table] = {
        count: data.length,
        file: `${table}.json`
      };
    }
  }
  
  // Save backup manifest
  const manifestPath = path.join(backupPath, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(backup, null, 2));
  
  console.log(`\n✅ Backup complete!`);
  console.log(`📁 Location: ${backupPath}`);
  console.log(`\n📊 Summary:`);
  Object.entries(backup.tables).forEach(([table, info]) => {
    console.log(`   ${table}: ${info.count} records`);
  });
  
  return backupPath;
}

main()
  .then((backupPath) => {
    console.log(`\n💾 Backup saved to: ${backupPath}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  });

