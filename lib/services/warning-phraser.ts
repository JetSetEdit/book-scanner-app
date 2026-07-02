/**
 * Display-time cleanup for AI-generated content-warning descriptions.
 *
 * Descriptions are stored as complete Australian-Classification-Board-style
 * advisory sentences (e.g. "Moderate themes of emotional abuse...") and are
 * rendered as-is. The only transform needed at render time is stripping
 * inline source citations the model sometimes embeds.
 */

/**
 * Strip inline "source N (url)" citations from AI-generated description text.
 * The AI sometimes embeds e.g. "source 1 (app.thestorygraph.com): " in the
 * description; we surface provenance via the Source link instead, so remove
 * it here for cleaner display.
 */
export function sanitizeDescriptionForDisplay(description: string): string {
  if (!description || typeof description !== 'string') return description
  return description
    .replace(/\bsource\s+\d+\s*\([^)]+\)\s*:?\s*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
