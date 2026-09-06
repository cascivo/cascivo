---
'@cascivo/react': minor
'@cascivo/i18n': minor
---

`DataTable` becomes a full data grid: column layout the user controls, a real keyboard
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
