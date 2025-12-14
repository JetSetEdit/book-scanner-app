/**
 * Utility functions to detect and handle placeholder book titles/metadata
 */

/**
 * Checks if a title appears to be a placeholder rather than an actual book title
 */
export function isPlaceholderTitle(title: string | null | undefined): boolean {
  if (!title) return true;

  const normalized = title.toLowerCase().trim();

  // Common placeholder patterns
  const placeholderPatterns = [
    /^untitled/i,
    /^tbc/i,
    /^tbd/i,
    /^to be confirmed/i,
    /^to be determined/i,
    /^to be announced/i,
    /^tba/i,
    /^unknown/i,
    /^placeholder/i,
    /^coming soon/i,
    /^title pending/i,
    /^untitled tbc/i,
    /^untitled.*\d{6}$/i, // "Untitled TBC 202325" pattern
  ];

  return placeholderPatterns.some(pattern => pattern.test(normalized));
}

/**
 * Checks if a book candidate has placeholder metadata
 */
export function hasPlaceholderMetadata(candidate: {
  title?: string | null;
  author?: string | null;
  description?: string | null;
}): boolean {
  return (
    isPlaceholderTitle(candidate.title) ||
    !candidate.title ||
    candidate.title.trim().length === 0
  );
}

/**
 * Filters out candidates with placeholder titles
 */
export function filterPlaceholderCandidates<T extends { title?: string | null }>(
  candidates: T[]
): T[] {
  return candidates.filter(candidate => !isPlaceholderTitle(candidate.title));
}











