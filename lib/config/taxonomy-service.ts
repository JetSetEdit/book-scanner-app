import { WARNING_CATEGORIES, getSeverityScore, WarningSubcategory } from './taxonomy-v2';
import { supabaseAdmin } from '@/lib/supabase/admin';

// In-memory cache for overrides
// Map<"category.subcategory", severity_score>
let severityOverrides: Record<string, number> = {};
let lastRefreshTime = 0;
const REFRESH_INTERVAL_MS = 1000 * 60 * 5; // 5 minutes

/**
 * Refresh overrides from the database.
 * Designed to be safe to call frequently (uses time-based throttling).
 */
export async function refreshSeverityOverrides(force = false) {
  const now = Date.now();
  if (!force && now - lastRefreshTime < REFRESH_INTERVAL_MS) {
    return;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('taxonomy_severity_overrides')
      .select('subcategory_id, severity_score');

    if (error) {
      console.error('Failed to fetch severity overrides:', error);
      return;
    }

    if (data) {
      severityOverrides = data.reduce((acc, row) => ({
        ...acc,
        [row.subcategory_id]: row.severity_score
      }), {});
      lastRefreshTime = now;
      console.log(`Updated severity overrides: ${Object.keys(severityOverrides).length} entries`);
    }
  } catch (err) {
    console.error('Unexpected error refreshing overrides:', err);
  }
}

/**
 * Get the effective severity score (0-10) for a subcategory.
 * Priority:
 * 1. Database Override (RLHF)
 * 2. Static Taxonomy Definition (Code)
 * 3. Default Fallback (5)
 */
export function getDynamicSeverityScore(categoryId: string, subcategoryId: string): number {
  const fullId = `${categoryId}.${subcategoryId}`;
  
  // 1. Check DB override
  if (severityOverrides[fullId] !== undefined) {
    return severityOverrides[fullId];
  }

  // 2. Fallback to static definition
  const category = WARNING_CATEGORIES.find(c => c.id === categoryId);
  const sub = category?.subcategories.find(s => s.id === subcategoryId);
  
  // Use existing helper to resolve hint ('severe') -> score (9)
  if (sub) {
    const staticScore = getSeverityScore(sub);
    if (staticScore !== undefined) return staticScore;
  }

  return 5; // Default middle ground if unknown
}
