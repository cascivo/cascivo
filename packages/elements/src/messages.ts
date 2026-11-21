import { defineMessages } from '@cascivo/i18n'

/*
 * The same keys and defaults as `builtin` in `@cascivo/i18n`, declared here rather than
 * imported: `builtin` carries every component's catalog (~25 KB of source, plus the `de`
 * catalogs as module side effects), which alone would break the 3 KB-per-element budget.
 * Same keys means an adopter's `defineCatalog(builtin.combobox, …)` translates these too;
 * `messages.test.ts` fails if a default drifts from the builtin one.
 */
export const combobox = defineMessages('cascade.combobox', {
  placeholder: 'Select an option',
  empty: 'No options found',
  resultCount: '{count} options available',
})

export const datePicker = defineMessages('cascade.datePicker', {
  placeholder: 'Select a date',
  open: 'Open calendar',
})

export const calendar = defineMessages('cascade.calendar', {
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
})

/** Element-only: the custom elements report their own validity (ElementInternals). */
export const elements = defineMessages('cascade.elements', {
  valueMissing: 'Please fill out this field.',
})
