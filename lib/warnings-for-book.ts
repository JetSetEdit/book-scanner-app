import type { SupabaseClient } from '@supabase/supabase-js';

const OPEN_APPEAL_STATUSES = ['pending', 'acknowledged'];

/**
 * Fetch content warnings for a book, excluding any that are under an open appeal.
 * Open appeal = status pending or acknowledged. Whole-book appeals (empty content_warning_ids) suppress all warnings.
 */
export async function getWarningsForBookExcludingAppeals<T = unknown>(
  supabase: SupabaseClient,
  bookId: string
): Promise<T[]> {
  const { data: warnings } = await supabase
    .from('content_warnings')
    .select('*')
    .eq('book_id', bookId)
    .order('helpful_count', { ascending: false });

  const { data: openAppeals } = await supabase
    .from('warning_appeals')
    .select('content_warning_ids')
    .eq('book_id', bookId)
    .in('status', OPEN_APPEAL_STATUSES);

  if (!warnings || warnings.length === 0) return [];

  const suppressWarningIds = new Set<string>();
  let wholeBookSuppressed = false;

  for (const appeal of openAppeals || []) {
    const ids = appeal.content_warning_ids;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      wholeBookSuppressed = true;
      break;
    }
    for (const id of ids) {
      if (typeof id === 'string') suppressWarningIds.add(id);
    }
  }

  if (wholeBookSuppressed) return [];

  return warnings.filter((w: { id?: string }) => !suppressWarningIds.has(w.id || '')) as T[];
}
