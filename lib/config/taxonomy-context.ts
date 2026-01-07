/**
 * Context Modifiers for Taxonomy v2.5.0+
 * 
 * These modifiers provide a second axis of nuance beyond category/subcategory,
 * allowing for more precise and trustworthy content warnings.
 */

export type ContextModifier =
  | 'historical_context'
  | 'quoted_or_discussed'
  | 'character_held_bias'
  | 'condemned_by_narrative'
  | 'endorsed_by_narrative'
  | 'educational_or_analytical'
  | 'satire_or_parody';

export const CONTEXT_MODIFIERS: Array<{
  id: ContextModifier;
  label: string;
  description: string;
}> = [
  {
    id: 'historical_context',
    label: 'Historical Context',
    description: 'Content appears in historical setting or period-appropriate context.',
  },
  {
    id: 'quoted_or_discussed',
    label: 'Quoted or Discussed',
    description: 'Content is quoted, discussed, or referenced rather than directly depicted or directed at a character.',
  },
  {
    id: 'character_held_bias',
    label: 'Character-Held Bias',
    description: 'Bias or discriminatory content is held by a character, not the narrative voice.',
  },
  {
    id: 'condemned_by_narrative',
    label: 'Condemned by Narrative',
    description: 'Content is explicitly condemned or shown as negative by the narrative.',
  },
  {
    id: 'endorsed_by_narrative',
    label: 'Endorsed by Narrative',
    description: 'Content is endorsed, normalized, or presented positively by the narrative. Rare but important for trust.',
  },
  {
    id: 'educational_or_analytical',
    label: 'Educational or Analytical',
    description: 'Content appears in educational, analytical, or informational context.',
  },
  {
    id: 'satire_or_parody',
    label: 'Satire or Parody',
    description: 'Content appears in satirical or parodic context.',
  },
];

/**
 * Evidence source types
 */
export type EvidenceSource = 'text' | 'community' | 'author_note';

/**
 * Evidence span with location and confidence
 */
export interface EvidenceSpan {
  source: EvidenceSource;
  location?: {
    chapter?: number;
    page?: number;
    span_start?: number;
    span_end?: number;
  };
  excerpt?: string; // Safe-truncated excerpt (max 200 chars)
  confidence: number; // 0-1
}

/**
 * Severity computation signals
 */
export interface SeveritySignals {
  frequency: number; // How often (0-1, normalized)
  explicitness: number; // Graphic detail (0-1)
  proximity: number; // On-page vs off-page (0-1, 1 = on-page)
  centrality: number; // Theme vs throwaway (0-1, 1 = central theme)
  intensity_markers: string[]; // e.g., ['weapons', 'coercion', 'threats']
}

/**
 * Enhanced content warning structure
 */
export interface EnhancedContentWarning {
  subcategory_id: string;
  severity: 'mild' | 'moderate' | 'severe';
  modifiers: ContextModifier[];
  evidence: EvidenceSpan[];
  severity_signals?: SeveritySignals; // Optional, computed if not provided
  other_note?: string; // Required if subcategory_id starts with 'other_'
  description?: string; // Description of the warning (preserved from AI response)
  reasoning?: string; // AI reasoning for the warning assignment (preserved from AI response)
  taxonomy_version: string; // Track which taxonomy version was used
  is_spoiler?: boolean; // True if this warning reveals major plot twists or significant plot points
  model_source?: 'openai' | 'gemini'; // Track which model generated this warning (for dev mode)
}

/**
 * Check if a subcategory requires an "other_note"
 */
export function requiresOtherNote(subcategoryId: string): boolean {
  return subcategoryId.startsWith('other_');
}

/**
 * Validate that "other" subcategories have notes
 */
export function validateOtherNote(
  subcategoryId: string,
  note?: string
): { valid: boolean; error?: string } {
  if (requiresOtherNote(subcategoryId)) {
    if (!note || note.trim().length === 0) {
      return {
        valid: false,
        error: `Subcategory "${subcategoryId}" requires an "other_note" field`,
      };
    }
    if (note.trim().length < 10) {
      return {
        valid: false,
        error: `"other_note" must be at least 10 characters for subcategory "${subcategoryId}"`,
      };
    }
  }
  return { valid: true };
}


