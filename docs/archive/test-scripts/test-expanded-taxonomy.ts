/**
 * Test script to verify expanded taxonomy works correctly
 * Tests new categories: phobias, medical_health, religious_cult, and expanded subcategories
 */

import { WARNING_CATEGORIES, getCategoryById, getSubcategoryById, validateSubcategoryParent } from '../lib/config/taxonomy-v2';

console.log('🧪 Testing Expanded Taxonomy v2.1.0\n');

// Test 1: Verify new categories exist
console.log('Test 1: Verifying new categories exist...');
const requiredCategories = [
  'phobias',
  'medical_health',
  'religious_cult'
];

const missingCategories: string[] = [];
for (const catId of requiredCategories) {
  const category = getCategoryById(catId);
  if (!category) {
    missingCategories.push(catId);
  } else {
    console.log(`  ✅ ${catId}: ${category.userLabel} (${category.subcategories.length} subcategories)`);
  }
}

if (missingCategories.length > 0) {
  console.error(`  ❌ Missing categories: ${missingCategories.join(', ')}`);
  process.exit(1);
}

// Test 2: Verify new subcategories exist
console.log('\nTest 2: Verifying new subcategories exist...');

const requiredSubcategories = [
  // Phobias
  { category: 'phobias', subcategory: 'snakes' },
  { category: 'phobias', subcategory: 'spiders' },
  { category: 'phobias', subcategory: 'needles' },
  { category: 'phobias', subcategory: 'water' },
  
  // Medical/Health
  { category: 'medical_health', subcategory: 'infertility' },
  { category: 'medical_health', subcategory: 'cancer' },
  { category: 'medical_health', subcategory: 'medical_procedures' },
  
  // Religious/Cult
  { category: 'religious_cult', subcategory: 'cult_content' },
  { category: 'religious_cult', subcategory: 'religious_trauma' },
  { category: 'religious_cult', subcategory: 'occult' },
  
  // Expanded Discrimination
  { category: 'discrimination', subcategory: 'acephobia' },
  { category: 'discrimination', subcategory: 'lesbophobia' },
  { category: 'discrimination', subcategory: 'misgendering' },
  { category: 'discrimination', subcategory: 'biphobia' },
  { category: 'discrimination', subcategory: 'queerphobia' },
  
  // Expanded Toxic Relationships
  { category: 'emotional_abuse_or_toxic_relationships', subcategory: 'stalking' },
  { category: 'emotional_abuse_or_toxic_relationships', subcategory: 'financial_abuse' },
  
  // Expanded Violence
  { category: 'violence', subcategory: 'police_brutality' },
  
  // Expanded Death/Grief
  { category: 'death_or_grief', subcategory: 'divorce' },
  { category: 'death_or_grief', subcategory: 'grief_processing' },
];

const missingSubcategories: string[] = [];
for (const { category, subcategory } of requiredSubcategories) {
  const isValid = validateSubcategoryParent(category, subcategory);
  if (!isValid) {
    missingSubcategories.push(`${category}.${subcategory}`);
  } else {
    const subcat = getSubcategoryById(category, subcategory);
    console.log(`  ✅ ${category}.${subcategory}: ${subcat?.userLabel}`);
  }
}

if (missingSubcategories.length > 0) {
  console.error(`  ❌ Missing subcategories: ${missingSubcategories.join(', ')}`);
  process.exit(1);
}

// Test 3: Count total categories and subcategories
console.log('\nTest 3: Taxonomy statistics...');
const totalCategories = WARNING_CATEGORIES.length;
const totalSubcategories = WARNING_CATEGORIES.reduce((sum, cat) => sum + cat.subcategories.length, 0);

console.log(`  Total Categories: ${totalCategories}`);
console.log(`  Total Subcategories: ${totalSubcategories}`);

// Test 4: Verify category structure
console.log('\nTest 4: Verifying category structure...');
let structureErrors = 0;

for (const category of WARNING_CATEGORIES) {
  if (!category.id || !category.userLabel || !category.legacyCategory) {
    console.error(`  ❌ Invalid category structure: ${category.id}`);
    structureErrors++;
  }
  
  for (const subcategory of category.subcategories) {
    if (!subcategory.id || !subcategory.userLabel || !subcategory.shortDescription) {
      console.error(`  ❌ Invalid subcategory structure: ${category.id}.${subcategory.id}`);
      structureErrors++;
    }
  }
}

if (structureErrors === 0) {
  console.log('  ✅ All categories have valid structure');
} else {
  console.error(`  ❌ Found ${structureErrors} structure errors`);
  process.exit(1);
}

// Test 5: List all new categories with their subcategories
console.log('\nTest 5: New categories summary...');
for (const catId of requiredCategories) {
  const category = getCategoryById(catId);
  if (category) {
    console.log(`\n  ${category.userLabel} (${category.id}):`);
    for (const subcat of category.subcategories) {
      console.log(`    - ${subcat.userLabel} (${subcat.id}) - ${subcat.defaultSeverityHint || 'varies'}`);
    }
  }
}

console.log('\n✅ All taxonomy tests passed!');
console.log('\n📊 Summary:');
console.log(`   - Categories: ${totalCategories}`);
console.log(`   - Subcategories: ${totalSubcategories}`);
console.log(`   - New categories added: ${requiredCategories.length}`);
console.log(`   - New subcategories added: ${requiredSubcategories.length}`);

