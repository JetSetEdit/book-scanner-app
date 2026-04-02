/**
 * Publisher APIs sometimes append "?" for uncertain years (e.g. "2003?").
 * Showing a bare question mark reads as accidental doubt; normalize for display.
 */
export function formatPublicationDateDisplay(raw: string | null | undefined): {
  text: string
  /** True when source data marked uncertainty (we stripped trailing ?). */
  approximate: boolean
} {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) return { text: '', approximate: false }
  const approximate = /\?\s*$/.test(trimmed)
  const text = trimmed.replace(/\?\s*$/, '').trim()
  return { text, approximate }
}
