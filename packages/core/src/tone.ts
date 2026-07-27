/**
 * The catalog's one status/severity vocabulary.
 *
 * Four display components shipped four overlapping enums for the same idea — `Badge` had
 * `destructive` but no `info`, `Status` had `error` but no `destructive`, `Notification` had
 * no `neutral`, `Tag` had `info` and `error`. Mapping one domain enum onto cascivo therefore
 * needed three separate lookup tables, and every component was a guess-then-compile cycle.
 * For an AI-first design system, prop-value predictability *is* the product.
 *
 * `Tone` is the canonical set. Every component that models severity accepts it, plus its own
 * historical spellings as aliases — nothing breaks, and one vocabulary now works everywhere.
 */
export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

/**
 * Historical spellings accepted anywhere a {@link Tone} is. `destructive` and `error` are the
 * two names the catalog used for the same tone; both map to `danger`.
 */
export type ToneAlias = 'destructive' | 'error' | 'default'

/** Every value a tone-taking prop accepts: the canonical set plus the aliases. */
export type ToneInput = Tone | ToneAlias

const TONE_ALIASES: Record<ToneAlias, Tone> = {
  destructive: 'danger',
  error: 'danger',
  default: 'neutral',
}

/**
 * Resolve any accepted spelling to its canonical {@link Tone}. Unknown values pass through
 * unchanged so a component can keep component-specific variants (`Badge`'s `outline`,
 * `secondary`) alongside tones.
 */
export function normalizeTone<T extends string>(value: T): T | Tone {
  return (TONE_ALIASES as Record<string, Tone | undefined>)[value] ?? value
}

/**
 * The catalog's one progress/step vocabulary, for components that model "where is this in a
 * sequence" — `Steps`, `Timeline`, and anything added later.
 *
 * `Timeline` shipped `complete | current | upcoming` while `Steps` shipped
 * `pending | active | complete | error`; `current`/`active` and `upcoming`/`pending` are the
 * same idea under two names, which cost an adopter a compile round-trip and a code comment
 * warning the next reader.
 */
export type Progress = 'pending' | 'active' | 'complete' | 'error'

/** Historical spellings accepted anywhere a {@link Progress} is. */
export type ProgressAlias = 'current' | 'upcoming'

/** Every value a progress-taking prop accepts: the canonical set plus the aliases. */
export type ProgressInput = Progress | ProgressAlias

const PROGRESS_ALIASES: Record<ProgressAlias, Progress> = {
  current: 'active',
  upcoming: 'pending',
}

/** Resolve any accepted spelling to its canonical {@link Progress}. */
export function normalizeProgress(value: ProgressInput): Progress {
  return (PROGRESS_ALIASES as Record<string, Progress | undefined>)[value] ?? (value as Progress)
}
