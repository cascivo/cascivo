/**
 * Active-option movement for `Combobox`'s listbox, kept pure so every key in the APG combobox
 * model is unit-testable without mounting anything.
 *
 * All functions take and return an index into the *filtered* option list, or `-1` when nothing
 * is active. Disabled options are never returned: a keyboard user must not be able to park the
 * active marker on a row that Enter would silently ignore, which is what the previous
 * `activeIndex` — initialised to a bare `0` — allowed whenever the first option was disabled.
 */
import type { ComboboxOption } from './option-list.ts'

/** How many rows PageUp/PageDown move. Matches the listbox's ~8-row visible window. */
export const PAGE_SIZE = 10

/** Indices of the options a keyboard user can land on. */
export function enabledIndexes(options: ComboboxOption[]): number[] {
  const indexes: number[] = []
  options.forEach((option, index) => {
    if (!option.disabled) indexes.push(index)
  })
  return indexes
}

/**
 * The next enabled index `delta` steps from `current`, wrapping at both ends. An inactive list
 * (`current === -1`) enters at the first enabled option going forward and the last going
 * backward, which is what ArrowDown/ArrowUp on a freshly opened listbox should do.
 */
export function moveActive(current: number, delta: number, options: ComboboxOption[]): number {
  const enabled = enabledIndexes(options)
  if (enabled.length === 0) return -1
  const position = enabled.indexOf(current)
  if (position === -1) return delta > 0 ? enabled[0]! : enabled[enabled.length - 1]!
  const next = (position + delta + enabled.length) % enabled.length
  return enabled[next]!
}

/** First enabled option, or `-1` when every option is disabled. */
export function firstActive(options: ComboboxOption[]): number {
  return enabledIndexes(options)[0] ?? -1
}

/** Last enabled option, or `-1` when every option is disabled. */
export function lastActive(options: ComboboxOption[]): number {
  const enabled = enabledIndexes(options)
  return enabled[enabled.length - 1] ?? -1
}

/**
 * PageUp/PageDown: `delta * PAGE_SIZE` enabled rows from `current`, clamped rather than
 * wrapped. Paging past the end lands on the last option — wrapping a page jump would move the
 * user somewhere they cannot predict.
 */
export function pageActive(current: number, delta: number, options: ComboboxOption[]): number {
  const enabled = enabledIndexes(options)
  if (enabled.length === 0) return -1
  const position = enabled.indexOf(current)
  const from = position === -1 ? (delta > 0 ? -1 : enabled.length) : position
  const next = Math.min(Math.max(from + delta * PAGE_SIZE, 0), enabled.length - 1)
  return enabled[next]!
}

/**
 * Where the active marker should sit when the list opens or the filter changes: the selected
 * option when it survived the filter and is selectable, otherwise the first enabled option.
 * Opening onto the current value is what lets ArrowDown step *from* the selection rather than
 * from the top of the list.
 */
export function activeForValue(options: ComboboxOption[], value: string | undefined): number {
  if (value !== undefined) {
    const at = options.findIndex((option) => option.value === value && !option.disabled)
    if (at !== -1) return at
  }
  return firstActive(options)
}
