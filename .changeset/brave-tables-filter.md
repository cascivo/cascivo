---
'@cascivo/react': minor
'@cascivo/i18n': minor
---

`DataTable` grows the toolbar-level features every adopter app was hand-rolling around it,
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
