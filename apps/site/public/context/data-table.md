# DataTable

**Category:** display  
**Description:** Signal-driven data table with client/server sort, filter, pagination, multi-selection, expandable rows, and CSS content-visibility row containment for large datasets

## When to use

- Displaying tabular data with columns the user sorts, filters, or pages through
- Selecting rows for batch actions across a dataset
- Rendering large datasets that benefit from row containment and server-side sort/paging

## When NOT to use

- A simple static list of items — use List
- Layout grids of cards or media — use a Card grid, not a data table

## Anti-patterns

### The full table machinery (sort, paging, selection) is overhead when there is no dataset to operate on

**Bad:** `Using DataTable for two columns of label/value pairs`  
**Good:** `A description list or a small Card with Stat/Text`  
**Why:** The full table machinery (sort, paging, selection) is overhead when there is no dataset to operate on

## Related components

- **Pagination** (contains): DataTable embeds pagination controls for paged data
- **EmptyState** (pairs-with): Render an EmptyState via the emptyState prop when there are no rows

## Accessibility rationale

Built on a native <table> with proper header semantics; sortable headers expose sort state, selection uses real checkboxes, and arrow-key navigation follows the grid pattern so keyboard users can traverse cells

## Props

| Name                | Type                                                                                     | Required | Default  | Description                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------- | -------- | -------- | ------------------------------------------------------------------------------- |
| `virtualized`       | `boolean`                                                                                | No       | false    | Render only the visible row window for large datasets.                          |
| `rowHeight`         | `number`                                                                                 | No       | 40       | Fixed row height in px, used to compute the virtualized window.                 |
| `windowSize`        | `number`                                                                                 | No       | 20       | Number of rows rendered in the virtualized window.                              |
| `overscan`          | `number`                                                                                 | No       | 3        | Extra rows rendered above/below the window to smooth scrolling.                 |
| `columns`           | `Column<Row>[]`                                                                          | Yes      | —        | The column definitions describing each table column.                            |
| `rows`              | `Row[]`                                                                                  | Yes      | —        | The row objects to render — one table row per array element.                    |
| `getRowId`          | `(row: Row) => string`                                                                   | No       | —        | Returns a stable unique id for a row.                                           |
| `sort`              | `SortState`                                                                              | No       | —        | The controlled sort state.                                                      |
| `defaultSort`       | `SortState`                                                                              | No       | —        | The initial sort state when uncontrolled.                                       |
| `sortMode`          | `'client' \| 'server'`                                                                   | No       | 'client' | Whether sorting is handled client-side or by the server ('client' \| 'server'). |
| `onSortChange`      | `(sort: SortState \| undefined) => void`                                                 | No       | —        | Called with the new sort state when it changes.                                 |
| `searchable`        | `boolean`                                                                                | No       | false    | When true, shows a search/filter input.                                         |
| `pagination`        | `{ pageSize: number; pageSizeOptions?: number[] }`                                       | No       | —        | Pagination configuration (page size and options).                               |
| `selection`         | `{ mode: 'single' \| 'multi'; selected?: string[]; onChange?: (ids: string[]) => void }` | No       | —        | Row-selection configuration (mode and selected ids).                            |
| `batchActions`      | `{ label: string; onClick: (selectedIds: string[]) => void }[]`                          | No       | —        | Actions applied to the currently selected rows.                                 |
| `renderExpandedRow` | `(row: Row) => ReactNode`                                                                | No       | —        | Renders the expanded content for a row.                                         |
| `density`           | `'compact' \| 'normal' \| 'relaxed'`                                                     | No       | 'normal' | Row density — 'compact', 'normal', or 'relaxed'.                                |
| `zebra`             | `boolean`                                                                                | No       | false    | When true, applies alternating row striping.                                    |
| `stickyHeader`      | `boolean`                                                                                | No       | false    | When true, the header stays fixed while the body scrolls.                       |
| `loading`           | `boolean`                                                                                | No       | false    | When true, shows a loading state.                                               |
| `emptyState`        | `ReactNode`                                                                              | No       | —        | Content shown when there are no rows.                                           |
| `title`             | `string`                                                                                 | No       | —        | Title text for the component.                                                   |
| `description`       | `string`                                                                                 | No       | —        | Supporting description text.                                                    |
| `labels`            | `DataTableLabels`                                                                        | No       | —        | Overrides for the component’s user-visible strings (i18n).                      |
| `className`         | `string`                                                                                 | No       | —        | Additional CSS class names merged onto the root element.                        |

## Object types

### `Column<Row>`

A single column definition. `render` is the escape hatch for custom cell content — return any ReactNode (a Badge, an icon + link, a formatted value); when omitted the cell shows `String(row[key])`.

| Field      | Type                      | Required | Description                                                                                               |
| ---------- | ------------------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `key`      | `string`                  | Yes      | Row property this column reads, and the sort key.                                                         |
| `header`   | `string`                  | Yes      | Column header label.                                                                                      |
| `sortable` | `boolean`                 | No       | When true, the header toggles sort on this column.                                                        |
| `render`   | `(row: Row) => ReactNode` | No       | Custom cell renderer. Return a Badge, icon + link, or formatted value. Omit to render `String(row[key])`. |
| `align`    | `'start' \| 'end'`        | No       | Cell/text alignment. Use 'end' for numbers and timestamps.                                                |
| `width`    | `string`                  | No       | Explicit column width (any CSS length, e.g. `120px`).                                                     |

### `SortState`

Controlled/initial sort state, used by `sort`, `defaultSort`, `onSortChange`.

| Field       | Type              | Required | Description            |
| ----------- | ----------------- | -------- | ---------------------- |
| `key`       | `string`          | Yes      | The sorted column key. |
| `direction` | `'asc' \| 'desc'` | Yes      | Sort direction.        |

## Tokens

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

## Examples

### Basic table

```jsx
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

```jsx
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

```jsx
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

## Boundaries

| Area                 | Level    | Note                                                                   |
| -------------------- | -------- | ---------------------------------------------------------------------- |
| sortMode and density | flexible | Choose client/server sort and density to fit data size and layout      |
| token names          | strict   | All surfaces, borders, and spacing must resolve to --cascivo-\* tokens |

## AI context prompt

Copy this into an LLM context bar before editing this component:

```text
I am modifying the cascivo DataTable component (display). Signal-driven data table with client/server sort, filter, pagination, multi-selection, expandable rows, and CSS content-visibility row containment for large datasets

Architecture constraints — follow exactly:
- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.
- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.
- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.
- @container queries need an ancestor that establishes containment (container-type: inline-size). An element can never be its own query container, so a component whose own rule restyles itself via @container must render an outer wrapper that establishes the container (see Grid/Columns). Section and other layout wrappers already establish one for their descendants.
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

DataTable is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-bg-subtle, --cascivo-color-border, --cascivo-color-border-strong, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-color-accent, --cascivo-font-sans, --cascivo-text-sm, --cascivo-text-xs, --cascivo-font-semibold, --cascivo-font-medium, --cascivo-radius-lg, --cascivo-radius-sm, --cascivo-space-2, --cascivo-space-3, --cascivo-space-4, --cascivo-data-table-max-height, --cascivo-data-table-cell-gap, --cascivo-duration-150, --cascivo-duration-500, --cascivo-ease-out, --cascivo-ease-in-out

Accessibility: role "table", WCAG 2.2-AA, keyboard: Tab/ArrowUp/ArrowDown/ArrowLeft/ArrowRight/Enter/Space. Keep it AA.

Do not change (strict): token names — All surfaces, borders, and spacing must resolve to --cascivo-* tokens
Flexible: sortMode and density.

Do not invent props, tokens, or global viewport media queries.
```
