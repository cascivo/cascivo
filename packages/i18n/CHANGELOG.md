# @cascivo/i18n

## 1.1.0

### Minor Changes

- 2050fe5: `ColorPicker`'s picking area returned a colour different from the one under the pointer. All
  existing props keep their shape.

  **The area computed in HSL against an HSV gradient.** The CSS paints the classic
  `linear-gradient(to top, #000, transparent)` over `linear-gradient(to right, #fff,
transparent)` on a pure-hue ground — saturation on x, _value_ on y. Every calculation used
  HSL: the pointer mapped y to lightness, and the thumb was positioned at `100 - hsl.l`. So
  clicking the visibly pure hue at the top-right returned `hsl(h, 100%, 100%)`, which is
  `#ffffff` for every hue, and the thumb for `#ff0000` sat halfway down the square rather than
  on the colour it names. The maths is now HSV throughout and matches what the area draws.

  **HSVA is the stored state.** Hex is 8-bit, so the previous hex→HSL→RGB→hex round-trip on
  every interaction meant nudging the hue repeatedly bled saturation away. The component keeps
  HSVA between edits and derives the output only on the way out.

  **The area is no longer an invalid slider.** It was one `role="slider"` with no
  `aria-valuenow`, `aria-valuemin` or `aria-valuemax` — a slider cannot describe two dimensions.
  It is now a `role="group"` holding one native `<input type="range">` per axis, which carries
  real slider semantics and brings arrow stepping, Home/End and PageUp/PageDown with it instead
  of the four-arrow hand-rolled switch (the missing Home/End would have failed
  `apgPattern: 'slider'`, which is why the manifest could never declare one).

  Also fixed:

  - **The preset swatches were labelled "Saturation and lightness"** — the group reused the
    colour area's string because no `presets` key existed — and their arrow keys changed the
    _value_ instead of moving focus. They are a correctly named group with roving focus now.
  - **`aria-pressed` on a preset used string equality,** so `#FFF` never matched a selected
    `#ffffff`. Comparison resolves both sides to 8-bit RGBA.
  - **The hex field committed every keystroke,** and `parseHex` fell back to black on anything
    unparseable, so typing `#3b82f6` fired `onValueChange` with `#`, `#3`, `#3b`… and thrashed
    the area to black in between. It keeps a draft and commits on blur, Enter or a valid paste;
    Escape abandons it; unparseable input is rejected rather than coerced.
  - **The eyedropper caused a hydration mismatch.** `window.EyeDropper` was read during render,
    so the server emitted no button and the first client render emitted one. It is detected in
    an effect.
  - **Alpha silently vanished at full opacity.** `toHex` dropped the alpha pair whenever
    `a >= 1`, so the emitted string flipped between 7 and 9 characters as the user dragged.
    With `alpha` on the width is now fixed.
  - Both range inputs carried a visually-hidden `<label>` _and_ an `aria-label`; the label lost
    and was dead markup.

  New: `format` (`'hex' | 'rgb' | 'hsl'`) and `name` for native form submission. A polite live
  region reports the current colour, mounted before the first change so that change is
  announced too.

  Styling: added the `@media (pointer: coarse)` block (there was none — swatches were 24px, the
  eyedropper 28px and the tracks 12px) and a reduced-motion block.

  `@cascivo/i18n` adds `saturation`, `brightness`, `presets`, `hex` and `value`, and corrects
  `colorArea` to "Saturation and brightness" — the axis it has always painted.

  Tests go from 3 to 56, including a pure unit suite for the conversion and parsing functions,
  which had none at all.

- 58c165e: `DataTable` grows the toolbar-level features every adopter app was hand-rolling around it,
  and a single switch for server-driven data. All additive; nothing existing changes shape.

  - **Per-column filters with facets.** `Column.filter: 'text' | 'select' | 'range'` puts a
    filter row under the header: a substring input, a faceted checklist of the column's
    distinct values with counts (computed on first open, one pass over the rows), or a
    numeric min/max pair with the column's extent as placeholders. Filters AND together and
    combine with the global search; `filters` / `defaultFilters` / `onFiltersChange` expose
    the map, which is plain JSON and round-trips through a URL. A "Clear filters" button
    appears while any is active, and `noResultsState` distinguishes "nothing matches" from
    "no data".
  - **`toolbar` slot and `rowActions`.** Extra controls render next to the search box; a
    `rowActions(row)` function renders a trailing "⋯" overflow-menu column whose entries
    receive the row on select.
  - **Column visibility.** `columnSettings={{ visibility: true }}` adds a "Columns" menu to
    the toolbar; `columnState` / `defaultColumnState` / `onColumnStateChange` carry the
    hidden keys (the last visible column cannot be hidden). Search and the fixed-layout rule
    see only visible columns.
  - **Server mode.** `server={{ totalItems, onQueryChange }}` renders `rows` as the current
    page verbatim and reports `{ sort, search, filters, page, pageSize }` whenever any of them
    changes (not on mount). One switch turns client sort, search, filters and paging off
    together; `pagination.page` / `onPageChange` make the page controllable.

  `@cascivo/i18n` adds the built-in strings behind these (`columns`, `actions`, `noResults`,
  `clearFilters`, `filterColumn`, `min`, `max`, `all`) in English and German.

  Published surface: new exported types `RowAction`, `TableQuery`, `DataTableServer`,
  `ColumnState`, `ColumnSettings`; new optional props and label keys — a minor change.

- 2050fe5: `FileUploader`'s announcements, identity and touch targets. Every prop keeps its shape; the
  only API addition is the new `cascade.fileUploader.status` catalog message.

  **The first upload was always silent.** The `aria-live` region was the file list itself, which
  is mounted in the same commit as its first file — a live region only announces content added
  _after_ it exists, so the very announcement that matters most never fired. A single polite
  region is now mounted unconditionally and reports the count plus the list-wide state
  (`1 file: Uploading`, `2 files: Upload complete`), pluralised through the catalog rather than
  by string concatenation.

  **Per-file status never reached a screen reader.** "Upload complete" and "Upload failed" were
  `aria-label` on a roleless `<span>`, where `aria-label` is not honoured, so the tick and the
  cross announced nothing at all. Both carry `role="img"` now, and a failed file's message is a
  `role="alert"`.

  **Two uploaders on one page collided.** Ids were a slug of the resolved label — which defaults
  to the same string for every instance — so `aria-describedby` on the second uploader resolved
  to the first one's text, and a non-ASCII label produced ids containing arbitrary characters.
  Ids come from `useId`.

  **The zone announced the wrong name.** The visible label was wired as a _description_, so every
  uploader was named by its generic "Drag and drop files here…" text instead of by the field. The
  label names the zone (`aria-labelledby`, or `ariaLabel` when given) and the hint describes it.

  Also fixed:

  - **`aria-hidden` on the focusable file input.** The input is programmatically `.click()`ed and
    is a focusable node, which makes `aria-hidden` on it the canonical `aria-hidden-focus`
    violation. Removed; it stays out of the tab order via `tabIndex={-1}`. Taking it off puts a
    real form control back in the accessibility tree, so it is named by the field's label —
    without that it is a critical `label` failure instead, which is the trade the first version
    of this change missed.
  - **`disabled` did not reach the remove buttons**, so a disabled uploader could still have its
    files removed.
  - **File sizes were hardcoded English.** `"2.5 MB"` reads wrong in every comma-decimal locale.
    Sizes now go through `Intl.NumberFormat`'s `unit` style in the current locale.
  - **The drag-over state flickered off mid-drag**, because `dragleave` fires on the zone every
    time the pointer crosses onto a descendant. Guarded with `relatedTarget` containment, plus
    `pointer-events: none` on the zone text for the browsers that report a null `relatedTarget`.
  - **`labels.remove` replaced only the first `{name}`**; it replaces every occurrence now.
  - **Remove buttons were roughly 20px**, below WCAG 2.2 SC 2.5.8's floor, with no coarse-pointer
    block in the stylesheet at all. They meet the 44px target now.
  - **Drag-over, disabled and error were colour-only**, which forced-colors flattens away
    entirely; each has a forced-colors treatment.
  - The drop zone sets `dropEffect = 'copy'` so the cursor matches what will happen.

- 58c165e: `DataTable` becomes a full data grid: column layout the user controls, a real keyboard
  model, editing, grouping and export. All additive; every existing prop keeps its shape.

  - **Resize, reorder, pin.** `columnSettings={{ resizable, reorderable, pinnable }}` adds a
    drag handle to each header (arrow keys nudge, Home resets, double-click too) and a
    per-column menu with sort, move left/right (RTL-aware), pin start/end and hide.
    `ColumnState` now carries `order`, `widths` and `pinned` next to `hidden`; pinned
    columns stick with measured insets, and the leading control cells stick with them.
  - **`stateKey`.** Remembers the user's column layout and sort in local storage under the
    key; controlled props still win, and tables sharing a key share the preference.
  - **`multiSort`.** Shift-click adds a tie-breaker (`SortState.thenBy`); sorted headers show
    their level. `sortRowsBy` ranks all levels in one pass.
  - **`keyboardNavigation="grid"`.** The APG data-grid pattern: the table is one Tab stop,
    arrows move a focused cell, Home/End within the row, Ctrl+Home/End to the corners,
    PageUp/PageDown by a screenful, Enter or F2 into the cell's control, Escape back out.
    A row outside the virtualized window is scrolled to first (`scrollTopForRow` inverts the
    capped canvas mapping). Controls inside cells leave the Tab order; `OverflowMenu` gained
    a `tabIndex` prop for this.
  - **Inline editing.** `Column.editable` plus `onCellEdit(row, key, value)` render each cell
    as an `Editable`; Enter/F2 opens it in grid mode. `Editable` itself now focuses and
    selects its input when editing starts (its focus effect ran before the input existed)
    and puts `aria-label`/`tabIndex` on the control rather than the wrapper.
  - **Grouping and aggregation.** `groupBy` (one key or several) interleaves collapsible
    group rows showing the value, the row count and every `Column.aggregate` (`sum`, `avg`,
    `min`, `max`, `count`, or a function of the rows). Leaves keep the sort; selection walks
    leaves only. `totals` adds a sticky totals row over everything the filters pass.
  - **`pinnedRows` and `columnGroups`.** Rows kept in view above and below the body,
    outside sort, filters, paging and the window; and bands of columns under a shared
    header row, with sticky-header offsets measured to match.
  - **`exportable`.** An "Export CSV" toolbar button: the filtered rows in the current sort,
    visible columns as headers, raw values as fields, RFC 4180 with a UTF-8 byte-order mark.

  `@cascivo/i18n` adds the strings behind these (`columnMenu`, `sortAscending`,
  `sortDescending`, `clearSort`, `moveLeft`, `moveRight`, `pinStart`, `pinEnd`, `unpin`,
  `hideColumn`, `resizeColumn`, `editCell`, `totals`, `exportCsv`) in English and German.

  Published surface: new exported types `SortKey`, `PinSide`, `AggregateKind`,
  `ColumnGroup`, the widened `ColumnState`, and new optional props — a minor change.

- 2050fe5: `Combobox` is rebuilt on the two APG combobox patterns, fixing a configuration that no
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

- 2050fe5: `DatePicker` is rebuilt as a typed field plus a composed `Calendar`, replacing a weaker
  hand-rolled copy of the grid. All existing props keep their shape.

  **It could not be typed into.** The field was a `<button>`, so a date already known could
  only be reached by paging a grid — something the manifest itself listed as a reason _not_ to
  use the component. The field is an `<input role="combobox">` that parses ISO and the locale's
  numeric form (`18/03/2026`, `03/18/2026`, `18.03.26`), commits on Enter or blur, and rejects
  unreadable or out-of-bounds input rather than coercing it.

  **Arrow keys did nothing until a value was set.** `handleGridKeyDown` opened with
  `if (!current) return`, and the active date seeded from the selection, so on a fresh
  `<DatePicker />` every arrow key was inert.

  **The popup neither took nor returned focus.** Opening left focus on the trigger, so the grid
  was unreachable without tabbing into it; closing dropped focus on `<body>` (WCAG 2.4.3).

  **The grid was a second copy of Calendar.** `getWeekStart` and `getMonthGrid` were duplicated
  byte-for-byte and the whole month table re-implemented, so every fix had to be made twice and
  in practice was not: this copy had no real focus movement, no min/max clamping on the
  keyboard, no disabled-day skipping, `aria-pressed` on day buttons instead of `aria-selected`,
  no explicit `role="gridcell"`/`role="row"`, and its `role="dialog"` was permanently mounted
  with all thirty day buttons in the DOM while closed. It now renders `<Calendar>` and inherits
  every one of those behaviours.

  Also fixed: `ArrowDown` opens the popup (the combobox pattern's required key, listed in the
  old manifest but never implemented); dismissal moved to the shared `DismissableLayer`,
  replacing a raw `document.addEventListener('mousedown')` — DatePicker leaves the
  `primitive-adoption` allowlist; the 📅 and ✕ literal glyphs became masked icons.

  New: `typeable` (set false for the previous button-only trigger, which then supports
  Delete/Backspace to clear — impossible before), `disabledDate` for rejecting individual dates
  the bounds allow, `format` for the displayed value, `showToday`, `name` for native form
  submission, `required`, and controlled `open`/`onOpenChange`.

  Styling: added the `@media (pointer: coarse)` block (there was none — the field, clear and
  open buttons were all under 44px), reduced-motion and forced-colors blocks.

  Date parsing moves to a pure `parse-date.ts` with 16 unit tests covering locale component
  order, two-digit years and impossible dates like 30 February, which `Date.UTC` otherwise
  rolls silently into March. Component tests go from 13 to 55.

- 2050fe5: `Carousel` stops hiding focusable content from assistive technology, and honours the
  reduced-motion preference it claimed to. All existing props keep their shape.

  **Inactive slides were `aria-hidden` while still being tabbable.** They stay in the layout and
  remain scroll-reachable, so `aria-hidden` declared them non-existent to a screen reader while
  every link and button inside them was still in the tab order — the canonical
  `aria-hidden-focus` violation (WCAG 4.1.2, and 2.4.3 for the focus order). They use `inert`
  now, which removes exposure and focusability together. The manifest claimed
  `wcag: '2.2-AA'` throughout.

  **Reduced motion was never honoured.** The stylesheet had a
  `@media (prefers-reduced-motion: reduce) { .track { scroll-behavior: auto } }` rule, but the
  paging call passed `behavior: 'smooth'` to `scrollTo`, and a JS scroll option overrides CSS —
  so the rule could not take effect, and it was overriding a property `.track` never set in the
  first place. The preference is read directly now.

  Also fixed:

  - **`NaN` index on a zero-width track.** `Math.round(scrollLeft / clientWidth)` is `0/0` in
    jsdom, during hydration before layout, and inside a `display: none` ancestor. The `NaN`
    propagated into `onIndexChange` and every `i === active.value` comparison.
  - **A mapped child list collapsed into a single slide.**
    `<Carousel><Intro />{items.map(…)}</Carousel>` arrives as `[<Intro/>, [...]]`, and the
    `Array.isArray` check made the entire mapped list one slide. It uses `Children.toArray`.
  - **Arrow keys moved only the roving tabindex,** leaving the displayed slide behind, although
    the manifest has always listed them. They move the slide.
  - **The region and the indicator group had the same name** ("Carousel"); the indicators are
    named separately, as APG specifies.
  - A controlled `index` never reached the roving tabindex, so the tabbable indicator stayed on
    slide 0.
  - `slideRefs` was populated every render and never read.

  New: `autoplay` (milliseconds between advances). It always renders a play/pause control — APG
  requires one for anything that rotates by itself — and additionally pauses on hover, on focus
  within the carousel, while the tab is hidden, and under `prefers-reduced-motion`. The track is
  `aria-live="polite"` while the user drives it and `"off"` while it rotates, so an
  auto-advancing region does not talk over itself.

  Styling: added the `@media (pointer: coarse)` block (there was none). The indicator hit area
  reaches the target minimum through a pseudo-element, so the 10px visual mark — which failed
  WCAG 2.2 SC 2.5.8's 24px floor outright — is unchanged while the target is not.

  Tests go from 3 to 20.

- 2050fe5: `MultiSelect` gets a keyboard model that works, an ARIA contract that is true, and the
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

- 2050fe5: `Calendar`'s keyboard navigation never moved focus. All existing props keep their shape.

  **Arrow keys only rotated a roving `tabIndex`.** Real DOM focus stayed on the
  previously-focused button, and the moment a key crossed a month boundary that button
  unmounted and focus fell to `<body>` — the user was ejected from the widget mid-navigation.
  Every key in the manifest was in that position: the whole keyboard model was inert for anyone
  relying on focus.

  Fixing it surfaced a second problem. React reuses the day buttons positionally across months,
  so simply leaving focus alone is not neutral either: the focused node survives the re-render
  and now shows a different date. Paging from 18 March put focus on **22 April** — the same
  grid slot. The focus move is therefore deferred a task (Preact signal effects run
  synchronously on write, before React commits) and re-queried by date.

  Also fixed:

  - **Navigation was unbounded.** Arrows and PageUp/PageDown walked straight past `min`/`max`
    into months where every day was `aria-disabled`, and could park the cursor on a day Enter
    silently ignores. Movement is clamped, skips disabled days in the direction of travel, and
    the prev/next buttons disable at the bounds.
  - **`aria-selected` sat on the `<td>`** while focus landed on the inner `<button>`, so the
    selected state was never announced. It is on the button now, and omitted rather than
    serialised as `"false"` on the other thirty cells.
  - **"Today" could be a day early.** `new Date()` is an instant, and it was compared through
    `getUTC*` getters, so east of UTC+12 `aria-current="date"` marked yesterday. Today is read
    from the local calendar.
  - **The month label was itself the live region** _and_ the grid's `aria-label`, so paging
    mutated the accessible name of the container focus sits inside. The announcement moved to a
    separate visually-hidden status region.
  - **A changed controlled `value` did not move the view.** The view seeded once at mount, so
    `<Calendar value={september} />` after rendering June stayed on June with the selection
    off-screen.
  - Clicking a day left the roving cursor behind, so a subsequent arrow continued from wherever
    it had been rather than from the click.
  - `addMonths` rolled 31 January into 3 March instead of clamping to 28/29 February.

  New: `showToday` (a button that jumps the view and focuses today — which finally uses the
  `calendar.today` catalog string, dead since it was added), `showWeekNumbers` (ISO-8601), and
  `ariaLabel`/`label` for naming the grid.

  Styling: added the `@media (pointer: coarse)` block (there was none — day cells were 36px and
  nav buttons 32px), a reduced-motion block, and forced-colors rules for selection, today and
  disabled days.

  The date arithmetic moves to a pure `calendar-date.ts` with 33 unit tests covering month
  boundaries, leap years, locale week starts, clamping and disabled-day skipping. Component
  tests go from 10 to 36.

### Patch Changes

- 2050fe5: The remaining browser packages get the same output minification `@cascivo/react` just did —
  their chunks shipped mangled but with every newline and indent intact.

  ```
  charts   39.8 → 32.5 KB gzip
  icons    39.5 → 38.2
  editor   12.0 → 10.4
  flow      9.0 →  7.7
  core      7.6 →  6.7
  i18n      6.2 →  5.8
  ai        1.6 →  1.3
  storage   0.5 →  0.4
  ```

  With `@cascivo/react`'s 15.6 KB that is 28.8 KB gzip off the published surface, from build
  configuration alone.

  The setting lives in one place now (`scripts/build/minify.ts`) rather than as a boolean in
  each config, because two things about it are easy to get wrong: `build.minify: true` is
  already the default and does not reach codegen, and `vp pack` ignores `rollupOptions`
  entirely. The packages on the `vp pack` path take `vp pack --minify` in their build script
  instead.

  **Fixed on the way, and the more important half of this change:** removing the whitespace
  broke three separate directive scanners that all assumed `'use client'` would be alone on a
  line. The single-entry CSS plugin then spliced `import './charts.css';` _ahead_ of the
  directive in charts, editor, flow and ai — and a `'use client'` that is not a module's first
  statement is not a directive, so those four silently stopped being client modules. The RSC
  guard that exists to catch exactly this had the same line-based assumption, concluded nothing
  in the library was a client module, and passed with nothing left to check.

  All three now scan the code as a string (`scripts/lib/directives.ts`, unit-tested), and
  `rsc-boundary` gained the counter-assertion that would have caught it: that it still
  recognises client modules at all.

## 1.0.0

### Major Changes

- f1c8292: Remove the deprecated surfaces the 1.0 contract clears, and give deprecation an expiry.

  **Eleven removals.** Each has had a replacement shipping for at least one minor, each was
  struck through in your editor, and `docs/RECIPE-DASHBOARD.md` already told adopters the
  charts alias was "removed at 1.0".

  - **A value-carrying `onChange` is gone from eight components** — `Combobox`, `DatePicker`,
    `Filter`, `NumberInput`, `Search`, `Swap`, `TimePicker`, `Toggle`. Use `onValueChange`; it
    receives exactly the same argument, and both have been accepted since the alias was added.
    This is the catalog's handler-naming rule (`onValueChange` carries a value, `onChange`
    carries a DOM `ChangeEvent`) applied to the components that predate it.

    `Toggle`, `NumberInput` and `TimePicker` extend an HTML element's attributes, and they keep
    `Omit<…, 'onChange'>` deliberately: dropping the Omit as well would let the native
    `ChangeEventHandler` take the name back, so an adopter passing a value-carrying handler
    would compile and then be called with an event — a silent break. The other five are plain
    interfaces with no HTML base, so `onChange` is simply not a prop. Either way, passing it is
    a compile error that names the fix.

  - **`@cascivo/charts` no longer exports `Text` / `TextProps`** — use `ChartText` /
    `ChartTextProps`. This alias collided with `@cascivo/react`'s typography component and the
    wrong resolution was silent: the SVG primitive rendered where a paragraph was meant and
    nothing errored.

  - **`BarChart` drops `xTicks` / `yTicks`** — use `valueAxisTicks` / `categoryAxisTicks`. The
    removed pair was named for where an axis is _drawn_, so its meaning swapped with
    `orientation`: `yTicks={1}` silently did nothing on a horizontal chart while `xTicks={1}`
    worked, and `xLabelEvery` did not swap at all (2026-07-28 report C17b). The role-named
    props mean the same thing on both orientations. `ScatterChart` keeps `xTicks`/`yTicks` —
    both of its axes are value axes, so screen-position naming is correct there.

  - **`Dropdown` drops the `separator: true` flag on a row** — use a separate
    `{ kind: 'separator' }` entry. The flag marked the row _as_ a rule rather than drawing one
    above it, discarding its `label`, `value` and `icon`; an adopter lost a "Log out" item to it
    and only noticed because a smoke test counted rows (2026-08-22 report item 9). The dev-only
    warning that existed to catch that goes with it.

  **`Presence`'s return type is now declared, not inferred.** It was inferred as
  `ReactElement<…, JSXElementConstructor<any>> | null`, which leaked React's internal `any`
  into cascivo's published `.d.ts` — the only such leak the surface had that was cascivo's own
  to fix. It is now `ReactNode`. Rendering `<Presence>` is unaffected; the only code this can
  break is a direct call whose result is assigned to a `ReactElement`, which is why it rides
  this major rather than a minor.

  **`OverflowMenu` is NOT removed.** Its manifest promised removal "in v4", not at 1.0, and
  breaking a published promise early is the same defect as letting one slip. It now carries
  `removeIn: '2.0.0'`, keeps working for the whole `1.x` line, and `Menu` remains the
  replacement.

  **Deprecation gains an expiry.** `ComponentDeprecation` requires `removeIn` — the major that
  removes the old name — alongside `since`. It renders on every surface the manifest feeds, so
  the expiry is discoverable before you adopt the old name rather than after it disappears, and
  `deprecation-surfaces` fails the build if a deprecation names no major or is still shipping in
  the major it promised to leave. Both failure modes were verified by mutation. Before this,
  `overflow-menu` carried "removed in v4" as free prose in a `note` — a version that exists on
  no cascivo package — and nothing could tell whether it was overdue.

### Patch Changes

- a0bb1cf: Release every published package.

  This changeset names all twenty published packages so the next release cuts a version for each
  of them, including the four that no other pending changeset touches (`@cascivo/docs`,
  `@cascivo/docspack`, `@cascivo/eslint-plugin`, `@cascivo/vite-plugin`).

  The bump is `patch` everywhere; where another pending changeset asks for a `minor` or `major`,
  that higher bump still wins.

## 0.18.0

### Minor Changes

- d009502: Fixes for the 2026-08-14 adopter report (a Vercel-style dashboard on Vite +
  React Router).

  ## New: the vocabulary types are importable on the prebuilt path

  `Status.status` and `Badge.variant` are typed `ToneInput`, and every layout
  `gap` is a `SpaceStep` — but those types live in `@cascivo/core`, which is a
  _transitive_ dependency on the prebuilt path that the docs tell you not to
  install. So the first thing a typed dashboard writes had no supported import.

  ```ts
  import type { Tone } from '@cascivo/react/types'

  const DEPLOY_TONE: Record<DeployState, Tone> = {
    ready: 'success',
    error: 'danger',
  }
  ```

  `@cascivo/react/types` exports `Tone`, `ToneAlias`, `ToneInput`, `Progress`,
  `ProgressAlias`, `ProgressInput`, `SpaceStep` and `RovingOrientation`. On the
  copy-paste path keep importing from `@cascivo/core`. **Do not** add
  `@cascivo/core` to a prebuilt app to reach these — it is transitive there.

  They ship from a subpath rather than the main entry for a mechanical reason:
  component sources already import those names from core, so re-exporting them
  from `@cascivo/react` makes the dts bundler emit `ToneInput as ToneInput$1`
  and every prop switches to the aliased name.

  ## The router guide is now published

  `docs/USING-WITH-A-ROUTER.md` existed and was referenced from `Link`, `Tabs`
  and `setLinkComponent`, but was never published — so those pointers 404'd.
  It is now at <https://cascivo.com/docs/using-with-a-router.md> and in
  `npx @cascivo/docs`, along with three other guides that were also unpublished:
  `testing`, `css-layers-pitfall` and `third-party-css` (the last two cited by
  `@cascivo/react`'s own README and by `cascivo audit`).

  `setLinkComponent` gains a React Router recipe — its `to` is required, so the
  disabled-item case needs a fallback:

  ```tsx
  setLinkComponent(({ href, ...rest }: LinkComponentProps) => <Link to={href ?? '#'} {...rest} />)
  ```

  ## Components
  - `PageHeader.title` and `.description` accept `ReactNode`, not just `string`,
    so a page title can carry a status badge or a linked domain.
  - `CodeSnippet` accepts children as an alias for `code`
    (`<CodeSnippet>npm i foo</CodeSnippet>`). It stays a string — the content is
    tokenized for highlighting and handed to the clipboard.
  - `BreadcrumbItem` and `DockItem` gain the `id` escape hatch the other
    link-shaped item types already had. `Dock` previously keyed on the array
    index.
  - `Sparkline`'s documented default was 80 while the code applied 120; the docs
    now say 120 and that it is **fixed-width**, correcting a dashboard-recipe
    claim that it shrinks to fit.
  - `Stat` and `Kpi` now document the choice between them: `<Stat card>` matches
    `Kpi`'s chrome but **not** its layout, so pick one per app.
  - `label` visibility is now stated per component. It renders on screen for most
    components and is an invisible accessible name for a few (`Sparkline`,
    `Spinner`, `Fab`, …); nothing said which, and `<Toggle label>` duplicating a
    settings row's own heading is what the ambiguity cost.

  ## Charts

  `@cascivo/charts/styles.css` is **not** required on a bundler build — the entry
  imports its own stylesheet. It is required with no bundler, and on an SSR setup
  that externalises dependencies, where the CSS-free `node` twin loads. Several
  docs still called it unconditionally required. Also documents 13 chart and flow
  prop defaults that no generated table had ever shown.

  ## CLI
  - `cascivo create` emits the app shell as its own `src/Shell.tsx` with a
    `children` slot, so adding a router means deleting `App.tsx` and
    `src/sections/` rather than re-deriving the shell wiring.
  - The scaffold no longer imports the ~273 kB aggregate `@cascivo/react/styles.css`;
    per-component CSS auto-includes and tree-shakes on a bundler. A generated app
    now emits **39.65 kB** of entry CSS (6.90 kB gzip).
  - `create` inside an existing workspace detects the package manager from the
    surrounding lock file instead of always reporting npm under `npx`.
  - The browser tab title is title-cased rather than the raw directory name.

### Patch Changes

- b16cb6c: Fix: `clientJs: 'none'` components crashed a React Server Components build.

  Rendering `<Label>` from a Server Component failed the Next 16 build outright:

  ```
  Error: Failed to collect page data for /
    [cause]: Attempted to call signal() from the server but signal is on the client.
  ```

  `@cascivo/core`'s bundle carries a `'use client'` banner (its directive-carrying modules
  collapse into one chunk, so the banner is load-bearing), and `@cascivo/core/pure` is the
  server-safe subset that exists for exactly this reason. Three components reached past it —
  transitively, which is why no per-file check saw it:

  - `Label`, `AvatarGroup`, `InlineLoading` resolved their default text through
    `@cascivo/i18n`, which took `signal` from `@cascivo/core` — one hop too far.
    `@cascivo/i18n` now imports `signal` from `@preact/signals-react`, its actual origin and
    already a declared peer. Same module instance, no client boundary.
  - `LargeTitleHeader` imported `cn` from `@cascivo/core`; it now uses `@cascivo/core/pure`.
  - `Swap` called `useControllableSignal()` and `useSignals()` with no `'use client'` directive
    at all, so RSC ran React hooks on the server. It now declares the directive, and
    `clientJs: 'required'`.

  `scripts/checks/rsc-boundary.test.ts` walks the published module graph and fails on any edge
  that pulls a non-component binding out of a `'use client'` module, so this class of defect
  cannot ship again. Rendering a client component from a Server Component stays legal and is
  not flagged.

- 00b74e9: Run the release train so the stranded 0.17.0 reaches npm and the recovery path
  gets exercised on a real release.

  No package source changed in this PR — the fixes are the Tag visual baselines
  and `release.yml`'s new `Publish any stranded versions` step. But `release.yml`
  only triggers on pushes that touch `.changeset/**`, so without a changeset
  merging it would not start a release at all, and the step meant to unstrand
  0.17.0 would sit unverified until some unrelated changeset happened to land.

  Bumping the whole published set matches the 2026-08-11 changeset it lands
  beside: npm is behind `main` on every package, not just the ones whose source
  moved, and a partial bump would leave the rest still disagreeing.

## 0.17.1

### Patch Changes

- 3fcf3f1: Bump every published package so the next release run publishes the whole set.

  The 0.17.0 bump landed on `main` but never reached npm: the release job's build
  died inside `changesets/action` with `Failed to spawn process: Resource
temporarily unavailable (os error 11)` — an `EAGAIN` write to that action's
  stdout pipe, not a build failure. This changeset re-cuts the whole set on top of
  the workflow fix, so every package publishes from a release that runs its build
  in a runner-owned step.

- Updated dependencies [3fcf3f1]
  - @cascivo/core@0.17.1

## 0.17.0

### Patch Changes

- Updated dependencies [b59146f]
  - @cascivo/core@0.17.0

## 0.16.1

### Patch Changes

- 66b251d: Bump every published package so the next release run publishes the whole set.
  Packages that carried no substantive change of their own have fallen behind the
  rest of the workspace; this gives each of them a real new version so the
  published set stays in lockstep.
- Updated dependencies [66b251d]
  - @cascivo/core@0.16.1

## 0.16.0

### Patch Changes

- 97da94e: Repair the two CI gates failing on `main`, and refresh the generated registry artifacts.

  No package's runtime code changes here — every bump in this release is version-only.

  **`drift`** — `clientJs` reached the component manifests, but the 103 generated
  per-component files under `apps/site/public/r/` came from a branch cut before it, so merging
  the two left every one of them a field short. Regenerated; no other artifact moved.

  **`verify`** — `isolated:check`, the canary that type-checks packed tarballs in a strict,
  non-hoisted consumer workspace, was dying in `pnpm install` rather than in the type check it
  exists to run:

  ```
  ERR_PNPM_NO_MATCHING_VERSION  No matching version found for
  @cascivo/core@^0.15.0 while fetching it from https://registry.npmjs.org/
  ```

  `pnpm pack` rewrites `workspace:^` to `^<version>`, so the packed `@cascivo/react` asked the
  registry for a version that does not exist until release day — the fixture broke on every
  version bump that landed ahead of a publish, which is exactly what happened. Every
  inter-cascivo edge is now pinned to the tarball built from the commit under test, via
  `overrides` in the fixture's `pnpm-workspace.yaml`. The location matters: pnpm 10+ no longer
  reads the `pnpm` field from `package.json` and only warns about it, so the `pnpm.overrides`
  spelling silently does nothing.

  That also closes a quieter hole. Even when the versions did resolve, the fixture type-checked
  the freshly-built `@cascivo/react` against the last **published** `@cascivo/core` rather than
  the one just built — a mix, not the build under test.

  A new guard fails the fixture if any `@cascivo/*` dependency falls outside its `PACKAGES`
  list, since such an edge would slip back to registry resolution unnoticed — the silent-skip
  failure mode a canary must never have.

- Updated dependencies [dc2d9e7]
- Updated dependencies [dc2d9e7]
- Updated dependencies [97da94e]
  - @cascivo/core@0.16.0

## 0.15.0

### Patch Changes

- Updated dependencies [9841d27]
- Updated dependencies [9841d27]
  - @cascivo/core@0.15.0

## 0.2.14

### Patch Changes

- 3ec6aaf: Minor fixes
- Updated dependencies [3ec6aaf]
  - @cascivo/core@0.7.1

## 0.2.13

### Patch Changes

- Updated dependencies [6f318dd]
  - @cascivo/core@0.7.0

## 0.2.12

### Patch Changes

- 4172611: Bump every published package so the next release run publishes the whole set. The
  release drift gate had been failing on non-reproducible `regen` output (see PR #179),
  so packages carrying no substantive change of their own were left behind at versions
  older than the rest of the workspace. This changeset gives each of them a real new
  version, keeping the published set in lockstep.
- Updated dependencies [4172611]
- Updated dependencies [254a1a9]
  - @cascivo/core@0.6.0

## 0.2.11

### Patch Changes

- dfc24e4: Documentation updates
- db4fa0d: Docs
- Updated dependencies [dfc24e4]
- Updated dependencies [db4fa0d]
  - @cascivo/core@0.5.3

## 0.2.10

### Patch Changes

- 0b6b44e: Force a version bump across every published package to verify the changesets
  publish patch fix (see the release workflow fix in PR #168): several packages
  had been stuck re-publishing their already-released version on every release
  run and failing with a spurious E403, because the "already published" error
  detection missed pnpm's actual error shape. This changeset gives every
  package a real new version so the next release run exercises a genuine
  publish for all of them, not just the ones with substantive changes.
- Updated dependencies [0b6b44e]
  - @cascivo/core@0.5.2

## 0.2.9

### Patch Changes

- 21e7ddb: Raise the `@preact/signals-react` peer floor from `>=2.0.0` to `>=3.0.0`.

  React 19 removed the internal export that signals-react 2.x imports, so a 2.x
  runtime fails to load under React 19 (`SyntaxError: … '__SECRET_INTERNALS…'`). The
  old `>=2` floor let a resolver pick that broken build. signals-react 3.x still
  supports React 16.14+/17/18, so the new floor costs React-18 users nothing.

  If a lockfile carried over from an earlier install pins signals-react 2.x, run
  `cascivo doctor` — it now flags the mismatch (error on React 19, warning on React 18)
  with the exact upgrade command.

- Updated dependencies [21e7ddb]
- Updated dependencies [21e7ddb]
  - @cascivo/core@0.5.0

## 0.2.8

### Patch Changes

- 958fd6f: Every published package now exports `./package.json`, so
  `require.resolve('@cascivo/<pkg>/package.json')` resolves instead of throwing
  `ERR_PACKAGE_PATH_NOT_EXPORTED`. Previously only `@cascivo/react` exposed it, which
  tripped version probes, bundler plugins, and inspection tooling on the other packages.
- Updated dependencies [958fd6f]
- Updated dependencies [958fd6f]
  - @cascivo/core@0.4.1

## 0.2.7

### Patch Changes

- Updated dependencies [357ba46]
  - @cascivo/core@0.4.0

## 0.2.6

### Patch Changes

- 3b784e1: Minor improvements

## 0.2.5

### Patch Changes

- 810b8ba: Minor improvements
- Updated dependencies [810b8ba]
  - @cascivo/core@0.3.1

## 0.2.4

### Patch Changes

- 483e30a: Minor improvements
- Updated dependencies [483e30a]
- Updated dependencies [dd05e9b]
  - @cascivo/core@0.3.0

## 0.2.3

### Patch Changes

- e29ad6e: Re-release: publish the packages held back when the previous release run failed its generated-docs gate.
- Updated dependencies [e29ad6e]
  - @cascivo/core@0.2.6

## 0.2.2

### Patch Changes

- b49e0ba: Fixed red flags.
- 1d7599a: Fix version issues
- 6ee2f91: Experience fixes
- Updated dependencies [b49e0ba]
- Updated dependencies [6ee2f91]
  - @cascivo/core@0.2.5

## 0.2.1

### Patch Changes

- fc61671: Minor improvements
- Updated dependencies [fc61671]
  - @cascivo/core@0.2.4

## 0.2.0

### Minor Changes

- 5bafdb6: Adoption-audit fixes (waves 1–2):

  - CLI: per-command `--help` for every command (short-circuits before any prompt, fetch, or install); real `--version` (was hardcoded `0.0.0`); `init --theme <name>` / `--yes` with non-TTY defaulting; theme prompts and `theme add` now offer all 12 themes; `add` prints the `@cascivo/themes` wiring when the project doesn't import tokens yet; `add` is transactional (fetch-all-then-write — a failed fetch never leaves a partial component or a stale lockfile entry) and mixed bare + registry specs install both; registry fetches retry with backoff and fall back to the last cached copy when offline; first-party templates (`dashboard`, `auth`, `landing`) install by bare name; `@cascivo/<name>` namespace added (`@cascade/<name>` remains as a legacy alias); `doctor` no longer false-positives on hook names in comments; lockfile renamed `cascade.lock` → `cascivo.lock` (legacy file read and migrated automatically); HTTP cache moved to `~/.cascivo/cache`.
  - Registry: entries carry the real library version and per-file sha256 hashes; `cascivo update --check` diffs hashes instead of the previously inert version compare.
  - MCP: real server version (was `0.0.0`); `cascivo-mcp` bin added (`cascade-mcp` kept as a legacy alias).
  - i18n/react: `Combobox` search input, `DataTable` pagination buttons, `Dock` nav, and `Steps` list now source their aria-labels from the built-in catalog (with `labels`/`ariaLabel` prop overrides) instead of hardcoded English.

## 0.1.11

### Patch Changes

- 6b50710: Addition chart types, and general chart improvements
- bb3c77e: Templates and further improvements
- Updated dependencies [bb3c77e]
  - @cascivo/core@0.2.3

## 0.1.10

### Patch Changes

- f0b5654: Fixes
- Updated dependencies [f0b5654]
  - @cascivo/core@0.2.2

## 0.1.9

### Patch Changes

- 2458391: Improvements
- 52c08b6: Improvements
- Updated dependencies [2458391]
- Updated dependencies [52c08b6]
  - @cascivo/core@0.2.1

## 0.1.8

### Patch Changes

- Updated dependencies [4554af1]
  - @cascivo/core@0.2.0

## 0.1.7

### Patch Changes

- 75ab15e: Improvements

## 0.1.6

### Patch Changes

- 64535b7: Editor updates

## 0.1.5

### Patch Changes

- aa3c6f3: Introduce Editor

## 0.1.4

### Patch Changes

- 8ecc7a2: Introduce Flow

## 0.1.3

### Patch Changes

- fa55081: SideNav improvements
- Updated dependencies [fa55081]
  - @cascivo/core@0.1.3

## 0.1.2

### Patch Changes

- 72d0086: New location
- Updated dependencies [72d0086]
  - @cascivo/core@0.1.2

## 0.1.1

### Patch Changes

- e9998ab: Further improvements
- Updated dependencies [e9998ab]
  - @cascivo/core@0.1.1

## 0.1.0

### Minor Changes

- b23575c: Initial public release of the cascivo design system. Includes:
  - `@cascivo/core` — signal/FSM runtime (Preact Signals integration)
  - `@cascivo/tokens` — CSS design tokens (primitive → semantic → component)
  - `@cascivo/themes` — light, dark, and warm first-party themes
  - `@cascivo/icons` — SVG icon component set
  - `@cascivo/i18n` — signal-driven locale store with typed catalogs
  - `@cascivo/storage` — persisted signals over localStorage/IndexedDB
  - `@cascivo/react` — prebuilt npm distribution of all components
  - `@cascivo/mcp` — MCP server exposing the component registry to AI agents
  - `@cascivo/registry` — component registry runtime (CLI dependency)
  - `cascivo` — CLI for `npx cascivo init / add / list / update`

### Patch Changes

- Updated dependencies [b23575c]
  - @cascivo/core@0.1.0
