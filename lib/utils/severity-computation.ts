/**
 * Severity Computation Logic
 * 
 * Computes severity from signals rather than using static labels.
 * This makes the system consistent across books and explainable.
 */

import { SeveritySignals } from '../config/taxonomy-context';
import { PresenceType, DetailLevel } from '../config/taxonomy-v2';

/**
 * Compute severity from signals
 */
export function computeSeverityFromSignals(
  signals: SeveritySignals
): 'mild' | 'moderate' | 'severe' {
  // Base score from frequency and explicitness
  const baseScore = (signals.frequency * 0.3) + (signals.explicitness * 0.4);
  
  // Proximity multiplier (on-page is more severe)
  const proximityMultiplier = 1 + (signals.proximity * 0.2);
  
  // Centrality multiplier (central themes are more severe)
  const centralityMultiplier = 1 + (signals.centrality * 0.2);
  
  // Intensity markers add to severity
  const intensityBonus = Math.min(signals.intensity_markers.length * 0.1, 0.3);
  
  const finalScore = (baseScore * proximityMultiplier * centralityMultiplier) + intensityBonus;
  
  // Normalize to 0-1
  const normalizedScore = Math.min(finalScore, 1.0);
  
  // Map to severity levels
  if (normalizedScore < 0.35) return 'mild';
  if (normalizedScore < 0.70) return 'moderate';
  return 'severe';
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


