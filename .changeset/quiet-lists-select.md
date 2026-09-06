---
'@cascivo/react': minor
'@cascivo/i18n': minor
---

`MultiSelect` gets a keyboard model that works, an ARIA contract that is true, and the
features that distinguish a multi-select from a checkbox list. Every existing prop keeps its
shape; `value`/`onValueChange` become optional.

- **The keyboard was entirely dead.** The keydown listener was attached to the listbox while
  focus went to the search field — a _sibling_ inside the panel — so events bubbled input →
  search row → panel and never through the listener's node. Nothing else in the panel was
  focusable, so there was no path in which any arrow, Enter, Space or Escape ran. Handling
  now lives on the element that holds focus, and `ArrowUp`/`ArrowDown` (skipping disabled
  rows and wrapping), `Home`/`End`, `PageUp`/`PageDown`, `Enter`, `Space` (list-focused
  only, so it still types in the search field), `Backspace` (removes the last chip from an
  empty search) and `Escape` all work. The `a11yRationale` had been asserting this behaviour
  to every generated doc surface.
- **`aria-activedescendant` now exists, on the focused element.** The active row was tracked
  only as a `data-active` attribute, so assistive technology had no way to follow arrow
  navigation. The search field carries `role="combobox"` with `aria-expanded`,
  `aria-controls` and `aria-autocomplete="list"`, and owns `aria-activedescendant`; with
  `searchable={false}` the listbox itself takes focus and the same wiring. The trigger gained
  the `aria-controls` it never had.
- **The listbox owns only `option` and `group` children.** The search field, the select-all
  row and the loading / no-results message were inside `role="listbox"`; they are now
  siblings of it, and the message is a `role="status"`.
- **Focus returns to the trigger on close.** `usePopover` shows the panel imperatively, so the
  browser restores nothing: Escape and light-dismiss both left focus on `<body>` (WCAG 2.4.3).
- **Two latent bugs behind the dead handler.** `toggleOption` closed over the `value` prop from
  the render that installed the listener, so the second keyboard toggle would have computed
  from a stale array; and `filteredOptions` was a `useComputed` over a non-signal `options`
  prop, which caches until a _signal_ dependency changes — a parent swapping options after a
  remote response kept rendering the previous list. Both are now plain render-time
  derivations, and both have regression tests.
- **Selection is reachable by pointer, keyboard and AT.** Rows bound selection to
  `onMouseDown` only, so an assistive technology's activate gesture — which synthesises
  `click` — did nothing.

New capabilities:

- **Uncontrolled mode.** `value` and `onValueChange` are optional; `defaultValue` lets the
  component own the selection through `useControllableSignal`.
- **`display="chips"`.** One removable chip per value, each a real sibling `<button>` — a
  remove control inside the trigger button would be invalid HTML and unfocusable.
- **`clearable`, `selectAll`, `max`.** A clear-all control, a select/clear-all row that
  respects disabled options and stops at the limit, and a cap that marks unreachable options
  `aria-disabled` while leaving selected ones toggleable.
- **Grouping.** `MultiSelectOption.group` renders labelled `role="group"` headings. The
  filtered list is _stored_ in render order (`orderByGroup`), so ArrowDown lands on the row
  the eye is on rather than on the first array element.
- **Remote search.** `onSearchChange` reports each keystroke and `loading` marks the list
  `aria-busy` with a loading row; pair with `filter={() => true}` to hand filtering to the
  server. `filter` otherwise replaces the built-in matcher, which folds diacritics
  (`zurich` matches `Zürich`) and searches label then value, and the matched run is marked
  in the rendered label.
- **`creatable` + `onCreate`.** Offers the typed text as a new option when no label matches.
- **`name`.** One hidden input per value, so the control participates in a native form submit.
- **`label`, `ariaLabel`, `hint`, `error`, `size`.** Field-level parity with `Combobox` and
  `Select`, including `aria-invalid`, merged `aria-describedby` and a `role="alert"` error.

Styling: every control reaches the coarse-pointer target minimum (there was no
`@media (pointer: coarse)` block at all), selection / active row / focus each gained a
non-colour channel under `forced-colors` (there was no block at all, and all three were
encoded purely as background colour), and a reduced-motion block was added. The selected
count rendered in muted placeholder colour because of an empty CSS rule left behind with a
"will be set to text when selected" comment; it now reads at full contrast. The manifest's
`tokens` list was four names wrong and eight names short.

`@cascivo/i18n` adds the strings behind these (`loading`, `clear`, `remove`, `selectAll`,
`clearAll`, `create`, `selectionChanged`, `maxReached`) in English and German.
