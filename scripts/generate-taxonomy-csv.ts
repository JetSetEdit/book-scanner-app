import fs from 'fs';
import path from 'path';
import { WARNING_CATEGORIES, getSeverityScore, type WarningSubcategory } from '../lib/config/taxonomy-v2';

// Define headers with combined ID first for easy lookup
const CSV_HEADER = 'Full ID,Category ID,Category Name,Subcategory ID,Subcategory Name,Default Severity,Default Score,Description';

function escapeCsv(field: string | number | undefined): string {
  if (field === undefined || field === null) return '';
  const stringField = String(field);
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
}

function generateCsv() {
  const rows = [CSV_HEADER];
  let count = 0;

  console.log('🔄 Generating TAXONOMY.csv from source of truth...');

  for (const cat of WARNING_CATEGORIES) {
    for (const sub of cat.subcategories) {
      // 1. Calculate Score (handles the fallback logic from hints)
      const score = getSeverityScore(sub);
      
      // 2. Build Combined ID
      const fullId = `${cat.id}.${sub.id}`;

      // 3. Construct Row
      const row = [
        escapeCsv(fullId),
        escapeCsv(cat.id),
        escapeCsv(cat.userLabel),
        escapeCsv(sub.id),
        escapeCsv(sub.userLabel),
        escapeCsv(sub.defaultSeverityHint), // e.g. 'severe'
        escapeCsv(score),                   // e.g. 9
        escapeCsv(sub.shortDescription)
      ].join(',');

      rows.push(row);
      count++;
    }
  }

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
