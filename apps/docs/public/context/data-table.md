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

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `columns` | `Column<Row>[]` | Yes | — | — |
| `rows` | `Row[]` | Yes | — | — |
| `getRowId` | `(row: Row) => string` | No | — | — |
| `sort` | `SortState` | No | — | — |
| `defaultSort` | `SortState` | No | — | — |
| `sortMode` | `'client' | 'server'` | No | 'client' | — |
| `onSortChange` | `(sort: SortState | undefined) => void` | No | — | — |
| `searchable` | `boolean` | No | false | — |
| `pagination` | `{ pageSize: number; pageSizeOptions?: number[] }` | No | — | — |
| `selection` | `{ mode: 'single' | 'multi'; selected?: string[]; onChange?: (ids: string[]) => void }` | No | — | — |
| `batchActions` | `{ label: string; onClick: (selectedIds: string[]) => void }[]` | No | — | — |
| `renderExpandedRow` | `(row: Row) => ReactNode` | No | — | — |
| `density` | `'compact' | 'normal' | 'relaxed'` | No | 'normal' | — |
| `zebra` | `boolean` | No | false | — |
| `stickyHeader` | `boolean` | No | false | — |
| `loading` | `boolean` | No | false | — |
| `emptyState` | `ReactNode` | No | — | — |
| `title` | `string` | No | — | — |
| `description` | `string` | No | — | — |
| `labels` | `DataTableLabels` | No | — | — |
| `className` | `string` | No | — | — |

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

| Area | Level | Note |
|------|-------|------|
| sortMode and density | flexible | Choose client/server sort and density to fit data size and layout |
| token names | strict | All surfaces, borders, and spacing must resolve to --cascivo-* tokens |
