# DataTable

Signal-driven data table with client/server sort, filter, pagination, multi-selection, expandable rows, and CSS content-visibility row containment for large datasets

## Install

Copy-paste the source (you own and can edit it):

```bash
npx cascivo add data-table
```

Or use it from the prebuilt package without copying:

```tsx
import { DataTable } from '@cascivo/react'
```

## Category

`display`

## Sizes

- `compact`
- `normal`
- `relaxed`

## States

- `default`
- `loading`
- `empty`

## Props

| Prop                  | Type                                                                                                     | Required | Default    | Description                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `virtualized`         | `boolean`                                                                                                | no       | `false`    | Render only the visible row window for large datasets.                                                                                                                                                                                                                                                                                                                                                                 |
| `rowHeight`           | `number`                                                                                                 | no       | —          | Row height in px for the virtualized window. Measured from the first rendered row when omitted, so the density presets stay correct; set it only for custom-sized rows.                                                                                                                                                                                                                                                |
| `windowSize`          | `number`                                                                                                 | no       | —          | Rows rendered per window. Derived from the scroller height when omitted; set it only to render a fixed count regardless of height.                                                                                                                                                                                                                                                                                     |
| `overscan`            | `number`                                                                                                 | no       | `3`        | Extra rows rendered above/below the window to smooth scrolling.                                                                                                                                                                                                                                                                                                                                                        |
| `columns`             | `Column<Row>[]`                                                                                          | yes      | —          | The column definitions describing each table column.                                                                                                                                                                                                                                                                                                                                                                   |
| `rows`                | `Row[]`                                                                                                  | yes      | —          | The row objects to render — one table row per array element.                                                                                                                                                                                                                                                                                                                                                           |
| `getRowId`            | `(row: Row) => string`                                                                                   | no       | —          | Returns a stable unique id for a row.                                                                                                                                                                                                                                                                                                                                                                                  |
| `sort`                | `SortState`                                                                                              | no       | —          | The controlled sort state.                                                                                                                                                                                                                                                                                                                                                                                             |
| `defaultSort`         | `SortState`                                                                                              | no       | —          | The initial sort state when uncontrolled.                                                                                                                                                                                                                                                                                                                                                                              |
| `sortMode`            | `'client' \| 'server'`                                                                                   | no       | `'client'` | Whether sorting is handled client-side or by the server ('client' \| 'server').                                                                                                                                                                                                                                                                                                                                        |
| `onSortChange`        | `(sort: SortState \| undefined) => void`                                                                 | no       | —          | Called with the new sort state when it changes.                                                                                                                                                                                                                                                                                                                                                                        |
| `searchable`          | `boolean`                                                                                                | no       | `false`    | When true, shows a search/filter input.                                                                                                                                                                                                                                                                                                                                                                                |
| `pagination`          | `{ pageSize: number; pageSizeOptions?: number[]; page?: number; onPageChange?: (page: number) => void }` | no       | —          | Paging config: pageSize, optional pageSizeOptions, and page/onPageChange to control the current page. With `server`, it is the pager for server-side paging.                                                                                                                                                                                                                                                           |
| `selection`           | `{ mode: 'single' \| 'multi'; selected?: string[]; onChange?: (ids: string[]) => void }`                 | no       | —          | Row-selection configuration (mode and selected ids).                                                                                                                                                                                                                                                                                                                                                                   |
| `batchActions`        | `{ label: string; onClick: (selectedIds: string[]) => void }[]`                                          | no       | —          | Actions applied to the currently selected rows.                                                                                                                                                                                                                                                                                                                                                                        |
| `filters`             | `ColumnFilters`                                                                                          | no       | —          | Per-column filter values (controlled), keyed by column key. Columns opt in with `Column.filter`: `text` (substring), `select` (faceted checklist with counts), `range` (numeric min/max).                                                                                                                                                                                                                              |
| `defaultFilters`      | `ColumnFilters`                                                                                          | no       | —          | Initial per-column filter values (uncontrolled).                                                                                                                                                                                                                                                                                                                                                                       |
| `onFiltersChange`     | `(filters: ColumnFilters) => void`                                                                       | no       | —          | Called with the full filter map whenever any column filter changes.                                                                                                                                                                                                                                                                                                                                                    |
| `noResultsState`      | `ReactNode`                                                                                              | no       | —          | Shown instead of emptyState when there are rows but the search or filters match none of them.                                                                                                                                                                                                                                                                                                                          |
| `toolbar`             | `ReactNode`                                                                                              | no       | —          | Extra controls rendered in the toolbar next to the search box — exports, primary actions.                                                                                                                                                                                                                                                                                                                              |
| `rowActions`          | `(row: Row) => RowAction<Row>[]`                                                                         | no       | —          | Per-row actions. Returns the menu entries for a row; rendered as a trailing overflow-menu column. Each entry has id, label, onSelect(row), and optional destructive/disabled/icon.                                                                                                                                                                                                                                     |
| `columnState`         | `ColumnState`                                                                                            | no       | —          | User-adjustable column layout (controlled): `hidden` keys, display `order`, explicit `widths` in px, and `pinned` sides. One object, so it round-trips through storage or a URL as a unit.                                                                                                                                                                                                                             |
| `defaultColumnState`  | `ColumnState`                                                                                            | no       | —          | Initial column layout (uncontrolled).                                                                                                                                                                                                                                                                                                                                                                                  |
| `onColumnStateChange` | `(state: ColumnState) => void`                                                                           | no       | —          | Called with the full column layout whenever the user changes it.                                                                                                                                                                                                                                                                                                                                                       |
| `columnSettings`      | `ColumnSettings`                                                                                         | no       | —          | Which column-layout controls to offer: `visibility` (a "Columns" menu in the toolbar), `resizable` (a drag handle per header; arrows nudge, Home resets), `reorderable` (Move left/right in the header menu), `pinnable` (Pin to start/end in the header menu). All off by default.                                                                                                                                    |
| `server`              | `DataTableServer`                                                                                        | no       | —          | Server-driven mode: rows are rendered as the current page verbatim and `onQueryChange({ sort, search, filters, page, pageSize })` fires whenever any of them changes (not on mount). `totalItems` drives the pager. One switch turns off client sort, search, filters and paging together.                                                                                                                             |
| `multiSort`           | `boolean`                                                                                                | no       | `false`    | Allow sorting by more than one column: Shift-click a header adds it as a tie-breaker (`SortState.thenBy`); a plain click replaces the whole sort. Sorted headers show their level.                                                                                                                                                                                                                                     |
| `stateKey`            | `string`                                                                                                 | no       | —          | Remember the user's column layout and sort across reloads, in local storage under this key. Applies to uncontrolled `columnState`/`sort`; controlled props still win. Tables sharing a key share the preference.                                                                                                                                                                                                       |
| `keyboardNavigation`  | `'row' \| 'grid'`                                                                                        | no       | `row`      | How the keyboard moves through the table. 'row' keeps every control in the Tab order with the arrows stepping between them. 'grid' is the APG data-grid pattern: one Tab stop, arrows move a focused cell, Home/End within the row, Ctrl+Home/End to the corners, PageUp/PageDown by a screenful, Enter/F2 enters the cell's control, Escape returns to the cell; rows outside the virtualized window are scrolled to. |
| `onCellEdit`          | `(row: Row, key: string, value: string) => void`                                                         | no       | —          | Commits an inline edit with the row, the column key and the new text. Enables editing for every column marked `editable`; the table does not mutate `rows` itself.                                                                                                                                                                                                                                                     |
| `groupBy`             | `string \| string[]`                                                                                     | no       | —          | Group the rows by one or more columns, in order. Each group is a collapsible row showing its value, its row count and every `aggregate` column's reduction; leaves keep the current sort inside their group. Groups appear in order of first occurrence — sort by the grouped column to order them.                                                                                                                    |
| `totals`              | `boolean`                                                                                                | no       | `false`    | Show a totals row under the body with each `aggregate` column's reduction over every row passing the search and filters (not just the page). Sticks to the bottom of the scroller.                                                                                                                                                                                                                                     |
| `pinnedRows`          | `{ top?: Row[]; bottom?: Row[] }`                                                                        | no       | —          | Rows kept in view outside sort, search, filters, paging and the virtual window: `top` rows sit under the header (stuck there with `stickyHeader`), `bottom` rows above the totals.                                                                                                                                                                                                                                     |
| `columnGroups`        | `ColumnGroup[]`                                                                                          | no       | —          | Bands of columns under a shared header, rendered as a row above the column headers. Keep a band's columns adjacent; reordering them apart splits the band.                                                                                                                                                                                                                                                             |
| `exportable`          | `boolean \| { filename?: string }`                                                                       | no       | `false`    | An "Export CSV" button in the toolbar: every row passing the search and filters (all pages; with `server`, the rows given), in the current sort, visible columns as headers, raw cell values as fields (RFC 4180, UTF-8 with BOM). Pass `{ filename }` to name the file; it defaults to the `title`.                                                                                                                   |
| `renderExpandedRow`   | `(row: Row) => ReactNode`                                                                                | no       | —          | Renders the expanded content for a row.                                                                                                                                                                                                                                                                                                                                                                                |
| `density`             | `'compact' \| 'normal' \| 'relaxed'`                                                                     | no       | `'normal'` | Row density — 'compact', 'normal', or 'relaxed'. ⚠ It sets a row **height floor**, so it is invisible whenever the cell content is already taller: a two-line cell or a Badge stack looks identical at every density. Reported as "barely distinguishable" — the prop works, the content is winning. Shrink the cell content, or set `--cascivo-data-table-cell-gap` to tighten the horizontal rhythm too.             |
| `zebra`               | `boolean`                                                                                                | no       | `false`    | When true, applies alternating row striping.                                                                                                                                                                                                                                                                                                                                                                           |
| `stickyHeader`        | `boolean`                                                                                                | no       | `false`    | When true, the header stays fixed while the body scrolls.                                                                                                                                                                                                                                                                                                                                                              |
| `loading`             | `boolean`                                                                                                | no       | `false`    | When true, shows a loading state.                                                                                                                                                                                                                                                                                                                                                                                      |
| `emptyState`          | `ReactNode`                                                                                              | no       | —          | Content shown when there are no rows.                                                                                                                                                                                                                                                                                                                                                                                  |
| `ariaLabel`           | `string`                                                                                                 | no       | —          | Invisible accessible name for the table, used when there is no visible `title`. A table with neither is an unnamed landmark; dev-warns. Not rendered — screen readers only.                                                                                                                                                                                                                                            |
| `title`               | `string`                                                                                                 | no       | —          | Visible caption above the table; it also becomes the table's accessible name.                                                                                                                                                                                                                                                                                                                                          |
| `description`         | `string`                                                                                                 | no       | —          | Supporting description text.                                                                                                                                                                                                                                                                                                                                                                                           |
| `labels`              | `DataTableLabels`                                                                                        | no       | —          | Overrides for the component’s user-visible strings (i18n).                                                                                                                                                                                                                                                                                                                                                             |
| `className`           | `string`                                                                                                 | no       | —          | Additional CSS class names merged onto the root element.                                                                                                                                                                                                                                                                                                                                                               |

## Object types

### `Column<Row>`

A single column definition. `render` is the escape hatch for custom cell content — return any ReactNode (a Badge, an icon + link, a formatted value); when omitted the cell shows `String(row[key])`.

| Field       | Type                                                                          | Required | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------- | ----------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `key`       | `string`                                                                      | yes      | Row property this column reads, and the sort key.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `header`    | `string`                                                                      | yes      | Column header label.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `sortable`  | `boolean`                                                                     | no       | When true, the header toggles sort on this column.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `render`    | `(row: Row) => ReactNode`                                                     | no       | Custom cell renderer. Return a Badge, icon + link, or formatted value. Omit to render `String(row[key])`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `align`     | `'start' \| 'end'`                                                            | no       | Cell/text alignment. Use 'end' for numbers and timestamps.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `filter`    | `'text' \| 'select' \| 'range'`                                               | no       | Offer a per-column filter under the header: a substring input, a faceted checklist of distinct values with counts, or a numeric min/max pair. Values surface through the `filters` props.                                                                                                                                                                                                                                                                                                                                                                                 |
| `aggregate` | `'sum' \| 'avg' \| 'min' \| 'max' \| 'count' \| ((rows: Row[]) => ReactNode)` | no       | What group rows and the `totals` row show for this column: a built-in reduction over the numeric cell values (`count` counts rows), or a function of the rows.                                                                                                                                                                                                                                                                                                                                                                                                            |
| `editable`  | `boolean`                                                                     | no       | Edit cells in place: each renders an Editable (click, Enter or F2 to start; Enter commits, Escape cancels) that commits through `onCellEdit`. Ignored with a custom `render` or without `onCellEdit`.                                                                                                                                                                                                                                                                                                                                                                     |
| `minWidth`  | `string`                                                                      | no       | Floor for the column width, any CSS length.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `width`     | `string`                                                                      | no       | Preferred column width (any CSS length, e.g. `120px`), with an automatic content floor. ⚠ Sizing EVERY column switches the table to `table-layout: fixed`. ⚠ "Leave one unsized" is necessary but NOT sufficient: the leftover width is split by content weight, so if the sized columns nearly fill the table the remainder can be narrower than the content needs and long tokens wrap mid-word. Leave the widest free-form column unsized, keep sized columns to ~2/3 of the table, and give the free-form one a `minWidth` when the data has long unbreakable tokens. |

### `SortState`

Controlled/initial sort state, used by `sort`, `defaultSort`, `onSortChange`.

| Field       | Type                                            | Required | Description                                               |
| ----------- | ----------------------------------------------- | -------- | --------------------------------------------------------- |
| `key`       | `string`                                        | yes      | The sorted column key.                                    |
| `direction` | `'asc' \| 'desc'`                               | yes      | Sort direction.                                           |
| `thenBy`    | `{ key: string; direction: "asc" \| "desc" }[]` | no       | Secondary columns that break ties, in order (multi-sort). |

### `DataTableServer`

Server-driven mode. The table renders `rows` as the current page and reports every change to sort, search, filters, page or page size through `onQueryChange`; nothing runs on the client.

| Field           | Type                          | Required | Description                                                                                                         |
| --------------- | ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| `totalItems`    | `number`                      | no       | Total rows across every page; drives the pager and the range label.                                                 |
| `onQueryChange` | `(query: TableQuery) => void` | yes      | Called with the full query whenever it changes. Not called on mount — the rows passed initially are the first page. |

### `TableQuery`

What the server is asked to apply.

| Field      | Type                     | Required | Description                                   |
| ---------- | ------------------------ | -------- | --------------------------------------------- |
| `sort`     | `SortState \| undefined` | yes      | Active sort.                                  |
| `search`   | `string`                 | yes      | Trimmed global search text.                   |
| `filters`  | `ColumnFilters`          | yes      | Per-column filter values keyed by column key. |
| `page`     | `number`                 | yes      | 1-based page.                                 |
| `pageSize` | `number`                 | yes      | Rows per page.                                |

### `ColumnState`

User-adjustable column layout, used by `columnState`, `defaultColumnState`, `onColumnStateChange`.

| Field    | Type                               | Required | Description                                                                                                                    |
| -------- | ---------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `hidden` | `string[]`                         | no       | Keys of hidden columns. At least one column always stays visible.                                                              |
| `order`  | `string[]`                         | no       | Display order of column keys; keys not listed follow in definition order.                                                      |
| `widths` | `Record<string, number>`           | no       | Explicit widths in px by key — what the resize handle writes. Any set width switches the table to a fixed layout.              |
| `pinned` | `Record<string, 'start' \| 'end'>` | no       | Pinned columns by key. Pinned-start columns render first and stick to the leading edge; pinned-end last, to the trailing edge. |

### `ColumnGroup`

A band of columns under one shared header (`columnGroups`).

| Field     | Type       | Required | Description                                                          |
| --------- | ---------- | -------- | -------------------------------------------------------------------- |
| `header`  | `string`   | yes      | The band label.                                                      |
| `columns` | `string[]` | yes      | Column keys in the band. Non-adjacent keys render as separate spans. |

### `ColumnSettings`

Which column-layout controls the table offers. All off by default.

| Field         | Type      | Required | Description                                                                                                   |
| ------------- | --------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `visibility`  | `boolean` | no       | A "Columns" menu in the toolbar that shows and hides columns.                                                 |
| `resizable`   | `boolean` | no       | A drag handle on each header; arrow keys nudge by 16px (Shift: 64px), Home returns to auto, double-click too. |
| `reorderable` | `boolean` | no       | "Move left" / "Move right" in each column's header menu (within its pin group).                               |
| `pinnable`    | `boolean` | no       | "Pin to start" / "Pin to end" / "Unpin" in each column's header menu.                                         |

### `RowAction<Row>`

One entry in a row actions menu.

| Field         | Type                 | Required | Description                                               |
| ------------- | -------------------- | -------- | --------------------------------------------------------- |
| `id`          | `string`             | yes      | Stable id (menu key).                                     |
| `label`       | `string`             | yes      | Menu entry text.                                          |
| `onSelect`    | `(row: Row) => void` | yes      | Activation handler; receives the row the menu belongs to. |
| `destructive` | `boolean`            | no       | Style as a destructive action.                            |
| `disabled`    | `boolean`            | no       | Disable the entry.                                        |
| `icon`        | `ReactNode`          | no       | Leading icon.                                             |

## Examples

### Basic table

```tsx
<DataTable
  columns={[
    { key: 'name', header: 'Name', sortable: true },
    { key: 'role', header: 'Role' },
  ]}
  rows={[
    { name: 'Alice', role: 'Engineer' },
    { name: 'Bob', role: 'Designer' },
  ]}
  getRowId={(r) => r.name}
/>
```

### Custom cell content with Column.render

Use Column.render to return any ReactNode per cell — a Badge for status, an icon + link for a repo, a right-aligned timestamp. Columns without render fall back to String(row[key]).

```tsx
<DataTable
  columns={[
    { key: 'name', header: 'Project', sortable: true },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'ready' ? 'success' : 'warning'}>{row.status}</Badge>
      ),
    },
    {
      key: 'updated',
      header: 'Updated',
      align: 'end',
      render: (row) => new Date(row.updated).toLocaleDateString(),
    },
  ]}
  rows={rows}
  getRowId={(r) => r.name}
/>
```

### Full-featured: selection, pagination, search

```tsx
<DataTable
  columns={columns}
  rows={rows}
  getRowId={(r) => r.id}
  searchable
  pagination={{ pageSize: 10, pageSizeOptions: [10, 25, 50] }}
  selection={{ mode: 'multi', onChange: setSelected }}
  batchActions={[{ label: 'Delete', onClick: deleteRows }]}
  stickyHeader
  zebra
/>
```

### Filters, row actions and a columns menu

Per-column filters under the header (a text input, a faceted checklist with counts, a numeric range), a row actions menu, and a toolbar Columns menu to hide columns.

```tsx
<DataTable
  columns={[
    { key: 'name', header: 'Name', sortable: true, filter: 'text' },
    { key: 'status', header: 'Status', filter: 'select' },
    { key: 'amount', header: 'Amount', align: 'end', filter: 'range' },
  ]}
  rows={rows}
  getRowId={(r) => r.id}
  columnSettings={{ visibility: true, resizable: true, reorderable: true, pinnable: true }}
  defaultColumnState={{ pinned: { name: 'start' } }}
  rowActions={(row) => [
    { id: 'edit', label: 'Edit', onSelect: () => edit(row) },
    { id: 'delete', label: 'Delete', destructive: true, onSelect: () => remove(row) },
  ]}
  exportable={{ filename: 'invoices' }}
  ariaLabel="Invoices"
/>
```

### Grid keyboard mode with inline editing

One Tab stop; the arrows move a focused cell and Enter or F2 opens the cell for editing. Commit the edit into your own state — the table never mutates `rows`.

```tsx
<DataTable
  columns={[
    { key: 'name', header: 'Name', editable: true },
    { key: 'qty', header: 'Qty', editable: true, align: 'end' },
  ]}
  rows={items}
  getRowId={(r) => r.id}
  keyboardNavigation="grid"
  onCellEdit={(row, key, value) => update(row.id, { [key]: value })}
  ariaLabel="Line items"
/>
```

### Grouped, with totals and a column band

Rows grouped by region with a count and a sum on each group row, a sticky totals row over everything that passes the filters, and two columns under one "Order" header.

```tsx
<DataTable
  columns={[
    { key: 'region', header: 'Region', sortable: true },
    { key: 'status', header: 'Status', aggregate: 'count' },
    { key: 'amount', header: 'Amount', align: 'end', aggregate: 'sum' },
  ]}
  rows={orders}
  getRowId={(o) => o.id}
  groupBy="region"
  totals
  columnGroups={[{ header: 'Order', columns: ['status', 'amount'] }]}
  ariaLabel="Orders by region"
/>
```

### Server-driven

The server applies sort, search, filters and paging; the table renders the page it is given and reports the query whenever it changes.

```tsx
<DataTable
  columns={columns}
  rows={page.rows}
  getRowId={(r) => r.id}
  searchable
  pagination={{ pageSize: 50 }}
  server={{ totalItems: page.total, onQueryChange: load }}
  ariaLabel="Orders"
/>
```

### A million rows

Virtualized: only the visible rows are in the DOM, the scrollbar reaches the last row at any count, and search and sort stay usable. Row height and viewport are measured, so nothing else is needed.

```tsx
<DataTable
  columns={columns}
  rows={millionRows}
  getRowId={(r) => r.id}
  virtualized
  searchable
  ariaLabel="Events"
/>
```

## Client JavaScript

Required. The component's primary job needs client JavaScript, so do not render it from a Server Component without hydrating — even if some or all of its markup appears in the server HTML.

## Design tokens

- `--cascivo-color-surface`
- `--cascivo-color-bg-subtle`
- `--cascivo-color-border`
- `--cascivo-color-border-strong`
- `--cascivo-color-text`
- `--cascivo-color-text-muted`
- `--cascivo-color-accent`
- `--cascivo-font-sans`
- `--cascivo-text-sm`
- `--cascivo-text-xs`
- `--cascivo-font-semibold`
- `--cascivo-font-medium`
- `--cascivo-radius-lg`
- `--cascivo-radius-sm`
- `--cascivo-space-2`
- `--cascivo-space-3`
- `--cascivo-space-4`
- `--cascivo-data-table-max-height`
- `--cascivo-data-table-cell-gap`
- `--cascivo-duration-150`
- `--cascivo-duration-500`
- `--cascivo-ease-out`
- `--cascivo-ease-in-out`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `table`
- **Keyboard:** Tab, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Enter, Space, Home, End, PageUp, PageDown, F2, Escape

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

table, data, grid, sort, filter, pagination, selection

---

_Generated from registry v1.0.0 on 2026-08-29. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
