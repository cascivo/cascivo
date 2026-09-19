/**
 * Option filtering, grouping and match highlighting, kept pure so the list pipeline is
 * testable without a DOM and runs once per query change rather than per render.
 *
 * Matching folds diacritics because a German user typing `zurich` expects `Zürich`, and an
 * option list is exactly where that gap bites: the user cannot see why their query returns
 * nothing. Folding is done per code point so the folded string stays index-aligned with the
 * original — that alignment is what lets `highlightSegments` mark the match on the label the
 * user actually reads rather than on a normalised copy of it.
 */

/** One selectable option. `group` is optional; a list mixing grouped and ungrouped options renders the ungrouped ones first. */
export interface MultiSelectOption {
  label: string
  value: string
  /**
   * When true, the option cannot be selected and is skipped by keyboard navigation.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  disabled?: boolean
  /** Optional group heading this option belongs to. */
  group?: string
}

/**
 * The folded form of one code point: its canonical decomposition's base character,
 * lowercased. One code point in, one out, so folding never shifts indices.
 */
function foldChar(ch: string): string {
  const base = ch.normalize('NFD')[0] ?? ch
  return base.toLowerCase()
}

/** Diacritic- and case-insensitive form of `text`, index-aligned by code point. */
export function fold(text: string): string[] {
  return Array.from(text, foldChar)
}

/** Default matcher: a folded substring match against the label, then the value. */
export function defaultMatch(option: MultiSelectOption, query: string): boolean {
  const q = fold(query).join('')
  if (q === '') return true
  return fold(option.label).join('').includes(q) || fold(option.value).join('').includes(q)
}

/**
 * Options matching `query`. `filter` replaces the default matcher entirely, so an adopter
 * doing server-side search passes `() => true` and lets the server decide.
 */
export function filterOptions(
  options: MultiSelectOption[],
  query: string,
  filter?: (option: MultiSelectOption, query: string) => boolean,
): MultiSelectOption[] {
  const match = filter ?? defaultMatch
  if (query === '' && !filter) return options
  return options.filter((option) => match(option, query))
}

/** A run of label text, flagged for whether it is part of the query match. */
export interface MatchSegment {
  text: string
  match: boolean
}

/**
 * `label` split into the leading text, the first match of `query`, and the rest. Returns a
 * single unmatched segment when there is no query or no match, so callers can render the
 * result unconditionally.
 */
export function highlightSegments(label: string, query: string): MatchSegment[] {
  const q = fold(query).join('')
  if (q === '') return [{ text: label, match: false }]

  const chars = Array.from(label)
  const at = fold(label).join('').indexOf(q)
  if (at === -1) return [{ text: label, match: false }]

  const qLength = Array.from(query).length
  const segments: MatchSegment[] = []
  const before = chars.slice(0, at).join('')
  const hit = chars.slice(at, at + qLength).join('')
  const after = chars.slice(at + qLength).join('')
  if (before !== '') segments.push({ text: before, match: false })
  segments.push({ text: hit, match: true })
  if (after !== '') segments.push({ text: after, match: false })
  return segments
}

/** Options under one heading. `label` is `undefined` for options that declared no group. */
export interface OptionGroup {
  label: string | undefined
  /** Each option with its index in the *filtered* list, which is what `aria-activedescendant` addresses. */
  entries: { option: MultiSelectOption; index: number }[]
}

/**
 * `options` bucketed by their `group`, preserving first-appearance order. Ungrouped options
 * come first so a list that groups only some of its options still reads top-down.
 *
 * Indices are positions in the array passed in — the filtered list — so the rendered option
 * ids stay in step with keyboard navigation regardless of how the groups reorder them.
 */
export function groupOptions(options: MultiSelectOption[]): OptionGroup[] {
  const groups: OptionGroup[] = []
  const byLabel = new Map<string | undefined, OptionGroup>()
  options.forEach((option, index) => {
    const label = option.group
    let group = byLabel.get(label)
    if (!group) {
      group = { label, entries: [] }
      byLabel.set(label, group)
      groups.push(group)
    }
    group.entries.push({ option, index })
  })
  // Ungrouped options first; grouped ones keep their first-appearance order after that.
  return groups.sort((a, b) => Number(a.label !== undefined) - Number(b.label !== undefined))
}

/**
 * `options` in the order `groupOptions` will render them: ungrouped first, then each group in
 * first-appearance order.
 *
 * Keyboard navigation addresses options by their index in the list, so the list has to be
 * *stored* in the order it is rendered. Grouping at render time only would put ArrowDown on
 * the first array element while the eye is on the first rendered row — a different option
 * whenever any option declares a group.
 */
export function orderByGroup(options: MultiSelectOption[]): MultiSelectOption[] {
  return groupOptions(options).flatMap((group) => group.entries.map((entry) => entry.option))
}

/** True when no option's label already equals `query`, i.e. a "create" row would be new. */
export function isNewLabel(options: MultiSelectOption[], query: string): boolean {
  const q = fold(query).join('')
  if (q === '') return false
  return !options.some((option) => fold(option.label).join('') === q)
}
