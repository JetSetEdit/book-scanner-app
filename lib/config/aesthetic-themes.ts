/**
 * BookTok-style aesthetic themes for Settings.
 * Each overrides CSS variables in [data-aesthetic="id"] and .dark[data-aesthetic="id"].
 * "reader" uses the default :root / .dark (no overrides).
 */

export type AestheticThemeId =
  | 'reader'        // Warm literary, parchment/oxblood/forest (default)
  | 'dark-academia' // Ivy, dark wood, candles, gold, burgundy
  | 'cozy'          // Cottagecore: sage, terracotta, pastels, tea
  | 'romantasy'     // Jewel tones, foils, dark forests, amethyst & gold
  | 'soft'          // Sad/soft girl: desaturated, dusty rose, grey-blue
  | 'barbiecore'    // High-saturation pink, bold, hyper-feminine

export const AESTHETIC_THEMES: {
  id: AestheticThemeId
  label: string
  description: string
}[] = [
  { id: 'reader',        label: 'Reader',        description: 'Warm parchment, oxblood, forest. Cozy nooks, annotated paperbacks.' },
  { id: 'dark-academia', label: 'Dark Academia',  description: 'Ivy, dark wood, candles, gold, burgundy. Gothic and literary.' },
  { id: 'cozy',          label: 'Cozy',          description: 'Cottagecore: sage, terracotta, pastels. Tea, cats, soft sweaters.' },
  { id: 'romantasy',     label: 'Romantasy',     description: 'Jewel tones, foiled covers, dark forests. Morally gray drama.' },
  { id: 'soft',          label: 'Soft',          description: 'Sad/soft girl: desaturated, dusty rose, grey-blue, melancholic.' },
  { id: 'barbiecore',    label: 'Barbiecore',    description: 'High-saturation pink, bold, hyper-feminine romance.' },
]
