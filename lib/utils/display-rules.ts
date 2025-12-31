/**
 * Display Rules for Content Warnings
 * 
 * Prevents overwhelming users with too many warnings and provides
 * better UX through intelligent collapsing and filtering.
 */

import { Database } from '@/types/supabase';
import { calculateSeverityScore } from './severity-scoring';

type ContentWarning = Database['public']['Tables']['content_warnings']['Row'];

export interface DisplayRule {
  id: string;
  name: string;
  description: string;
  apply: (warnings: ContentWarning[]) => ContentWarning[];
}

/**
 * Show only top N warnings by severity + confidence
 */
export function topWarningsBySeverity(
  warnings: ContentWarning[],
  limit: number = 5
): ContentWarning[] {
  // Score each warning
  const scored = warnings.map((w) => ({
    warning: w,
    score: calculateSeverityScore([w]) + (w.confidence_score || 0.5) * 10,
  }));
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  // Return top N
  return scored.slice(0, limit).map((s) => s.warning);
}

/**
 * Collapse sibling warnings (e.g., hide physical_violence if graphic_violence exists)
 */
export function collapseSiblings(warnings: ContentWarning[]): ContentWarning[] {
  const siblingGroups: Record<string, string[]> = {
    // Violence hierarchy: graphic > physical
    'violence.graphic_violence': ['violence.physical_violence'],
    // Sexual content hierarchy: explicit > themes
    'sexual_content.explicit_sexual_content': ['sexual_content.sexual_themes'],
    // Mental health: severe > moderate > mild
    'mental_health.suicidal_ideation': ['mental_health.casual_suicidal_ideation'],
  };
  
  const visible = new Set<string>();
  const hidden = new Set<string>();
  
  // First pass: mark what should be visible
  for (const warning of warnings) {
    const key = `${warning.category_id}.${warning.subcategory_id}`;
    visible.add(key);
  }
  
  // Second pass: hide siblings of more severe warnings
  for (const warning of warnings) {
    const key = `${warning.category_id}.${warning.subcategory_id}`;
    
    // Check if this warning has siblings that should be hidden
    for (const [parentKey, siblings] of Object.entries(siblingGroups)) {
      if (key === parentKey && visible.has(key)) {
        // Hide all siblings
        for (const sibling of siblings) {
          hidden.add(sibling);
        }
      }
    }
  }
  
  // Filter out hidden warnings
  return warnings.filter((w) => {
    const key = `${w.category_id}.${w.subcategory_id}`;
    return !hidden.has(key);
  });
}

/**
 * Hide mild warnings unless user opts in
 */
export function hideMildByDefault(
  warnings: ContentWarning[],
  showMild: boolean = false
): ContentWarning[] {
  if (showMild) return warnings;
  return warnings.filter((w) => w.severity !== 'mild');
}

/**
 * Apply all display rules
 */
export function applyDisplayRules(
  warnings: ContentWarning[],
  options: {
    topN?: number;
    collapseSiblings?: boolean;
    hideMild?: boolean;
    showMild?: boolean;
  } = {}
): ContentWarning[] {
  let result = [...warnings];
  
  // 1. Collapse siblings first (before filtering)
  if (options.collapseSiblings !== false) {
    result = collapseSiblings(result);
  }
  
  // 2. Hide mild if not opted in
  if (options.hideMild !== false) {
    result = hideMildByDefault(result, options.showMild || false);
  }
  
  // 3. Show top N
  if (options.topN && options.topN > 0) {
    result = topWarningsBySeverity(result, options.topN);
  }
  
  return result;
}

/**
 * Default display rules configuration
 */
export const DEFAULT_DISPLAY_RULES = {
  topN: 5,
  collapseSiblings: true,
  hideMild: true,
  showMild: false,
};

