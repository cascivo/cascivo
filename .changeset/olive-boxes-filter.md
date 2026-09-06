---
'@cascivo/react': minor
'@cascivo/i18n': minor
---

`Combobox` is rebuilt on the two APG combobox patterns, fixing a configuration that no
keyboard could operate and an ARIA contract that announced nothing. All existing props keep
their shape and meaning.

**`searchable={false}` was completely keyboard-inoperable.** Every navigation key lived in a
handler bound to the search `<input>`, and that input only rendered while
`searchable && isOpen`. With search off there was no element to receive a key: `open()`
focused a null ref, focus stayed on the trigger, and the trigger's own handler mapped
Enter/Space/ArrowDown to "open" — which it already was. There was no way to move the active
option, select, or close. This repo's own `apps/examples/track` assignee picker ships that
configuration.

**`aria-activedescendant` sat on an element that did not have focus.** It was on the trigger
button while `open()` moved focus into the search input, so a screen reader was told nothing
as the arrows moved. The manifest's `a11yRationale` asserted that this mechanism worked, and
that text propagates into `registry.json`, `llms/*.md` and `context/*.md`.

The field is now the combobox in both variants, and it keeps DOM focus:

- **`searchable` (default) → the APG editable combobox.** The field is
  `<input role="combobox" aria-autocomplete="list">` that filters as the user types. The
  separate in-popup search input is gone; closed, the field shows the selected label, open it
  shows the query.
- **`searchable={false}` → the APG select-only combobox.** The field is
  `<button role="combobox">`, and printable characters type-to-select via the shared
  `useTypeahead` primitive.

Also fixed:

- **The listbox owns only `option` and `group` children.** A text input and the empty-state
  `<div>` were inside `role="listbox"`; the loading and no-results messages are now siblings
  of it, as `role="status"`.
- **The active option can no longer be a disabled one.** `activeIndex` was seeded to a bare
  `0` in three places, so a list whose first option was disabled put the highlight on a row
  Enter silently ignored.
- **The active option is scrolled into view.** The listbox scrolls at `16rem` and nothing ever
  called `scrollIntoView`, so arrowing past the eighth row of a long list moved the highlight
  off-screen — on exactly the long lists the component exists to serve.
- **Dismissal moved to the shared `DismissableLayer`,** replacing a hand-rolled
  `document.addEventListener('mousedown')` that located its own root with `getElementById`.
  Combobox leaves the `primitive-adoption` allowlist, whose deferral was justified by
  dismissal tests that did not exist; there are now two.
- **`clear()` left the component mid-state** — the listbox open, the query stale and focus on
  a button that had just been unmounted. It now resets the query and returns focus to the
  field.
- **Full APG keyboard model:** Home/End (select-only variant only — in the editable one they
  belong to the text caret), PageUp/PageDown, `Alt+ArrowDown` to open without moving the
  active option, `Alt+ArrowUp` to close keeping the value, and Escape returning focus to the
  field. Opening now lands on the selected option rather than the top of the list.
- A dead ternary whose two branches were byte-identical, and the hardcoded `✕` glyph, are
  gone. `aria-label` on the listbox read the raw `label` prop, ignoring `ariaLabel` and
  `aria-labelledby`.

New capabilities: `loading` (marks the list `aria-busy`), `onSearchChange` and `filter` for
server-driven lists, `ComboboxOption.group` for labelled `role="group"` headings, `creatable`
with `onCreate`, `name` for native form submission, `required`, and controlled
`open`/`defaultOpen`/`onOpenChange`. The default matcher folds diacritics (`zurich` matches
`Zürich`) and searches label then value, and the matched run is marked in the rendered label.

Styling: added the `@media (pointer: coarse)` block (there was none — `sm` and `md` were 32px
and 40px, and a comment on the clear button cited WCAG 2.5.8's 24px floor to justify missing
the repo's 44px rule), the `forced-colors` block (there was none, and both selection and the
active row were encoded purely as a `color-mix` background that forced-colors flattens away),
and a reduced-motion block.

`ComboboxLabels.search` is removed along with the input it named, and the unused
`combobox.search` catalog key with it. `@cascivo/i18n` adds `loading`, `create` and
`resultCount` in English and German.

Tests go from 12 to 103, including pure unit suites for the filtering and navigation helpers.
Those helpers are deliberately not shared with `MultiSelect`'s equivalents: a registry
component is copied into an adopter's project as a self-contained folder, so a
cross-component import would make `cascivo add combobox` drag in a sibling's files.
