import fs from 'fs';
import path from 'path';
import { WARNING_CATEGORIES, getSeverityScore, WarningSubcategory } from '../lib/config/taxonomy-v2';

// 1. Define Headers
const CSV_HEADER = 'Full ID,Category ID,Category Name,Subcategory ID,Subcategory Name,Default Severity,Default Score,Description';

function escapeCsv(field: string | number | undefined | null): string {
  if (field === undefined || field === null) return '';
  const stringField = String(field);
  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
}

function generateCsv() {
  const rows = [CSV_HEADER];
  let count = 0;

  console.log('🔄 Generating TAXONOMY.csv from source of truth (lib/config/taxonomy-v2.ts)...');

  // 2. Iterate and Build Rows
  for (const cat of WARNING_CATEGORIES) {
    // Process subcategories
    for (const sub of cat.subcategories) {
      // Combined Key
      const fullId = `${cat.id}.${sub.id}`;
      
      // Get score (using helper which handles defaults)
      const score = getSeverityScore(sub);
      
      const row = [
        escapeCsv(fullId),
        escapeCsv(cat.id),
        escapeCsv(cat.userLabel),
        escapeCsv(sub.id),
        escapeCsv(sub.userLabel),
        escapeCsv(sub.defaultSeverityHint || cat.defaultSeverityHint || ''),
        escapeCsv(score),
        escapeCsv(sub.shortDescription)
      ].join(',');

      rows.push(row);
      count++;
    }
  }

  // 3. Write File
  const outputPath = path.join(process.cwd(), 'TAXONOMY.csv');
  try {
    fs.writeFileSync(outputPath, rows.join('\n'));
    console.log(`✅ Successfully wrote ${count} taxonomy entries to:`);
    console.log(`   ${outputPath}`);
  } catch (err) {
    console.error('❌ Failed to write CSV:', err);
    process.exit(1);
  }
}

// Execute
generateCsv();
