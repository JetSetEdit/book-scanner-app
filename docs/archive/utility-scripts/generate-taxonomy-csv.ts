import { WARNING_CATEGORIES } from '../lib/config/taxonomy-v2';

console.log('Category ID,Category Name,Subcategory ID,Subcategory Name,Default Severity,Description');
for (const category of WARNING_CATEGORIES) {
  for (const subcategory of category.subcategories) {
    const description = subcategory.shortDescription.replace(/,/g, ';');
    const severity = subcategory.defaultSeverityHint || 'varies';
    console.log(`${category.id},${category.userLabel},${subcategory.id},${subcategory.userLabel},${severity},${description}`);
  }
}

