import { SeveritySignals } from '../config/taxonomy-context';
import { PresenceType, DetailLevel } from '../config/taxonomy-v2';
import { getDynamicSeverityScore } from '../config/taxonomy-service';

/**
 * Compute severity from signals
 * UPDATED: Uses dynamic scoring from RLHF overrides
 */
export function computeSeverityFromSignals(
  signals: SeveritySignals,
  categoryId: string,
  subcategoryId: string
): 'mild' | 'moderate' | 'severe' {
  // 1. Calculate Base Evidence Score (0-1) from analysis
  // (frequency, explicitness, proximity, etc.)
  const evidenceScore = calculateEvidenceScore(signals);

  // 2. Get Baseline Severity (0-10) from Taxonomy/DB
  // This represents "How bad is this topic generally?"
  // If subcategoryId is missing or incomplete (e.g. from tests), it will fallback safely.
  const baselineScore = getDynamicSeverityScore(categoryId, subcategoryId);
  const normalizedBaseline = baselineScore / 10.0;

  // 3. Combine: Evidence modulates the Baseline
  // Formula: Final = Baseline * EvidenceMultiplier
  // High evidence (1.0) -> 100% of Baseline severity
  // Low evidence (0.2) -> 60% of Baseline severity (damped, but floor raised)
  // New multiplier: 0.6 + (evidenceScore * 0.4)
  // This ensures even weak evidence of a severe topic retains 60% of its severity.
  const evidenceMultiplier = 0.6 + (evidenceScore * 0.4);
  
  let finalScore = normalizedBaseline * evidenceMultiplier;

  // 4. Specific Floors for High-Risk Categories
  // Ensure "referenced" instances of severe topics don't drop to "mild".
  const severeTopics = [
    'sexual_content.sexual_violence',
    'mental_health.suicidal_ideation',
    'violence.infanticide_or_intentional_child_harm',
    'violence.torture',
    'violence.human_trafficking'
  ];
  
  const fullId = `${categoryId}.${subcategoryId}`;
  if (severeTopics.includes(fullId) && finalScore < 0.5) {
    // Force at least moderate (0.55+) for these topics if any evidence exists
    finalScore = 0.55; 
  }

  // Map to labels
  // Adjusted thresholds for safer categorization
  if (finalScore < 0.35) return 'mild';
  if (finalScore < 0.70) return 'moderate';
  return 'severe';
}

/**
 * Helper to calculate raw evidence score (0-1)
 */
export function calculateEvidenceScore(signals: SeveritySignals): number {
  // Base score from frequency and explicitness
  const baseScore = (signals.frequency * 0.3) + (signals.explicitness * 0.4);

  // Proximity multiplier (on-page is more severe)
  const proximityMultiplier = 1 + (signals.proximity * 0.2);

  // Centrality multiplier (central themes are more severe)
  const centralityMultiplier = 1 + (signals.centrality * 0.2);

  // Intensity markers add to severity
  const intensityBonus = Math.min(signals.intensity_markers.length * 0.1, 0.3);

  const rawScore = (baseScore * proximityMultiplier * centralityMultiplier) + intensityBonus;
  return Math.min(rawScore, 1.0);
}

/**
 * Convert presence type to proximity score (0-1)
 */
export function presenceToProximity(presence: PresenceType): number {
  const mapping: Record<PresenceType, number> = {
    on_page: 1.0,
    flashback: 0.7,
    off_page: 0.5,
    referenced: 0.3,
    implied: 0.2,
  };
  return mapping[presence] || 0.5;
}

/**
 * Convert detail level to explicitness score (0-1)
 */
export function detailLevelToExplicitness(detail: DetailLevel): number {
  const mapping: Record<DetailLevel, number> = {
    graphic: 1.0,
    moderate: 0.6,
    vague: 0.3,
    clinical: 0.4,
  };
  return mapping[detail] || 0.5;
}

/**
 * Extract intensity markers from description or reasoning
 */
export function extractIntensityMarkers(
  text: string,
  categoryId: string
): string[] {
  const markers: string[] = [];
  const lowerText = text.toLowerCase();

  // Violence markers
  if (categoryId === 'violence' || categoryId.includes('violence')) {
    if (lowerText.includes('weapon') || lowerText.includes('gun') || lowerText.includes('knife')) {
      markers.push('weapons');
    }
    if (lowerText.includes('coercion') || lowerText.includes('forced') || lowerText.includes('threat')) {
      markers.push('coercion');
    }
    if (lowerText.includes('repeated') || lowerText.includes('ongoing') || lowerText.includes('chronic')) {
      markers.push('repeated');
    }
  }

  // Sexual violence markers
  if (categoryId === 'sexual_content' || categoryId.includes('sexual')) {
    if (lowerText.includes('non-consent') || lowerText.includes('nonconsent') || lowerText.includes('rape')) {
      markers.push('non-consent');
    }
    if (lowerText.includes('force') || lowerText.includes('forced')) {
      markers.push('force');
    }
    if (lowerText.includes('threat') || lowerText.includes('coercion')) {
      markers.push('threat');
    }
    if (lowerText.includes('victim') || lowerText.includes('survivor')) {
      markers.push('victim_framing');
    }
  }

  return markers;
}

/**
 * Build severity signals from warning data
 */
export function buildSeveritySignals(
  data: {
    presence?: PresenceType;
    detail_level?: DetailLevel;
    description?: string;
    reasoning?: string;
    category_id?: string;
    frequency_hint?: 'single' | 'repeated' | 'theme';
    centrality_hint?: 'throwaway' | 'minor' | 'central';
  }
): SeveritySignals {
  const proximity = data.presence
    ? presenceToProximity(data.presence)
    : 0.5; // Default to moderate proximity

  const explicitness = data.detail_level
    ? detailLevelToExplicitness(data.detail_level)
    : 0.5; // Default to moderate

  const frequency = data.frequency_hint
    ? { single: 0.3, repeated: 0.7, theme: 1.0 }[data.frequency_hint]
    : 0.5; // Default to moderate

  const centrality = data.centrality_hint
    ? { throwaway: 0.2, minor: 0.5, central: 1.0 }[data.centrality_hint]
    : 0.5; // Default to moderate

  const text = [data.description, data.reasoning].filter(Boolean).join(' ') || '';
  const intensity_markers = extractIntensityMarkers(text, data.category_id || '');

  return {
    frequency,
    explicitness,
    proximity,
    centrality,
    intensity_markers,
  };
}
