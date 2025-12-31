/**
 * Sexual Violence Evaluation Logic
 * 
 * Separates "sexual violence" from "dark romance consent play" (Dub-Con/CNC).
 * This is critical for trust - misclassification here is the #1 place readers lose trust.
 */

import { Database } from '@/types/supabase';

type ContentWarning = Database['public']['Tables']['content_warnings']['Row'];

/**
 * Strong signals that indicate actual sexual violence (not consent play)
 */
const SEXUAL_VIOLENCE_SIGNALS = [
  'force',
  'forced',
  'threat',
  'threatened',
  'non-consent',
  'nonconsent',
  'non consensual',
  'rape',
  'assault',
  'victim',
  'survivor',
  'trauma',
  'abuse',
  'powerless',
  'helpless',
  'unwanted',
  'resistance',
  'struggle',
  'fear',
  'terror',
  'pain',
  'violence',
];

/**
 * Signals that indicate consent play (CNC/Dub-Con) rather than actual violence
 */
const CONSENT_PLAY_SIGNALS = [
  'consensual non-consent',
  'cnc',
  'dub-con',
  'dubcon',
  'negotiated',
  'agreed',
  'consent',
  'kink',
  'play',
  'scene',
  'safeword',
  'aftercare',
  'dark romance',
  'romance',
  'erotic',
];

/**
 * Check if a warning should be classified as sexual violence
 * vs dark romance consent play
 */
export function isActualSexualViolence(
  warning: ContentWarning
): { isViolence: boolean; confidence: number; reasoning: string[] } {
  const text = [
    warning.description,
    warning.reasoning,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  
  const reasoning: string[] = [];
  let violenceScore = 0;
  let consentPlayScore = 0;
  
  // Check for violence signals
  for (const signal of SEXUAL_VIOLENCE_SIGNALS) {
    if (text.includes(signal)) {
      violenceScore += 1;
      reasoning.push(`Found violence signal: "${signal}"`);
    }
  }
  
  // Check for consent play signals
  for (const signal of CONSENT_PLAY_SIGNALS) {
    if (text.includes(signal)) {
      consentPlayScore += 1;
      reasoning.push(`Found consent play signal: "${signal}"`);
    }
  }
  
  // Check subcategory
  const isDubCon = warning.subcategory_id === 'consent_ambiguity';
  const isCNC = warning.subcategory_id === 'cnc';
  const isSexualViolence = warning.subcategory_id === 'sexual_violence';
  
  if (isSexualViolence && !isDubCon && !isCNC) {
    // Explicitly tagged as sexual violence, not consent play
    return {
      isViolence: true,
      confidence: 0.9,
      reasoning: ['Explicitly tagged as sexual_violence (not dub-con/cnc)'],
    };
  }
  
  if (isDubCon || isCNC) {
    // Tagged as consent play - only escalate if strong violence signals
    if (violenceScore >= 3 && violenceScore > consentPlayScore) {
      return {
        isViolence: true,
        confidence: 0.7,
        reasoning: [
          `Tagged as ${isDubCon ? 'dub-con' : 'CNC'} but strong violence signals present`,
          ...reasoning,
        ],
      };
    }
    return {
      isViolence: false,
      confidence: 0.8,
      reasoning: [`Tagged as ${isDubCon ? 'dub-con' : 'CNC'} - treating as consent play`],
    };
  }
  
  // Default: require strong signals to classify as violence
  // Never let keyword hits alone escalate to sexual_violence
  const hasStrongSignals = violenceScore >= 2;
  const hasVictimFraming =
    text.includes('victim') ||
    text.includes('survivor') ||
    text.includes('trauma') ||
    text.includes('abuse');
  
  if (hasStrongSignals && hasVictimFraming && violenceScore > consentPlayScore) {
    return {
      isViolence: true,
      confidence: 0.8,
      reasoning: [
        'Strong violence signals with victim framing',
        ...reasoning,
      ],
    };
  }
  
  // Default: not violence (likely consent play or other sexual content)
  return {
    isViolence: false,
    confidence: 0.6,
    reasoning: [
      'Insufficient signals for sexual violence classification',
      ...reasoning,
    ],
  };
}

/**
 * Validate that sexual violence warnings have proper signals
 */
export function validateSexualViolenceWarning(
  warning: ContentWarning
): { valid: boolean; error?: string; suggestion?: string } {
  if (warning.subcategory_id !== 'sexual_violence') {
    return { valid: true }; // Not a sexual violence warning
  }
  
  const { isViolence, confidence, reasoning } = isActualSexualViolence(warning);
  
  if (!isViolence || confidence < 0.7) {
    return {
      valid: false,
      error: 'Sexual violence warning lacks sufficient signals',
      suggestion:
        'Consider reclassifying as "consent_ambiguity" or "cnc" if this is dark romance consent play. Sexual violence requires strong signals like force, threat, non-consent, or victim framing.',
    };
  }
  
  return { valid: true };
}

