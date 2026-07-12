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
| `columns`           | `Column<Row>[]`                                                                          | Yes      | —        | The column definitions describing each table column.                            |
| `rows`              | `Row[]`                                                                                  | Yes      | —        | Number of visible text rows.                                                    |
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
- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.
- CSS logical properties only (RTL-safe).

DataTable is strictly bound to these tokens — use only these, do not invent token names:
  --cascivo-color-surface, --cascivo-color-bg-subtle, --cascivo-color-border, --cascivo-color-border-strong, --cascivo-color-text, --cascivo-color-text-muted, --cascivo-color-accent, --cascivo-font-sans, --cascivo-text-sm, --cascivo-text-xs, --cascivo-font-semibold, --cascivo-font-medium, --cascivo-radius-lg, --cascivo-radius-sm, --cascivo-space-2, --cascivo-space-3, --cascivo-space-4, --cascivo-data-table-max-height, --cascivo-duration-150, --cascivo-duration-500, --cascivo-ease-out, --cascivo-ease-in-out

Accessibility: role "table", WCAG 2.2-AA, keyboard: Tab/ArrowUp/ArrowDown/ArrowLeft/ArrowRight/Enter/Space. Keep it AA.

Do not change (strict): token names — All surfaces, borders, and spacing must resolve to --cascivo-* tokens
Flexible: sortMode and density.

Do not invent props, tokens, or global viewport media queries.
```
