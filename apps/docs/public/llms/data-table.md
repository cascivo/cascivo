# DataTable

Signal-driven data table with client/server sort, filter, pagination, multi-selection, expandable rows, and CSS content-visibility row containment for large datasets

## Install

```bash
npx cascade add data-table
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

| Prop                | Type                                                            | Required                                                            | Default    | Description |
| ------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------- | ---------- | ----------- | ---------- | --- |
| `columns`           | `Column<Row>[]`                                                 | yes                                                                 | —          | —           |
| `rows`              | `Row[]`                                                         | yes                                                                 | —          | —           |
| `getRowId`          | `(row: Row) => string`                                          | no                                                                  | —          | —           |
| `sort`              | `SortState`                                                     | no                                                                  | —          | —           |
| `defaultSort`       | `SortState`                                                     | no                                                                  | —          | —           |
| `sortMode`          | `'client'                                                       | 'server'`                                                           | no         | `'client'`  | —          |
| `onSortChange`      | `(sort: SortState                                               | undefined) => void`                                                 | no         | —           | —          |
| `searchable`        | `boolean`                                                       | no                                                                  | `false`    | —           |
| `pagination`        | `{ pageSize: number; pageSizeOptions?: number[] }`              | no                                                                  | —          | —           |
| `selection`         | `{ mode: 'single'                                               | 'multi'; selected?: string[]; onChange?: (ids: string[]) => void }` | no         | —           | —          |
| `batchActions`      | `{ label: string; onClick: (selectedIds: string[]) => void }[]` | no                                                                  | —          | —           |
| `renderExpandedRow` | `(row: Row) => ReactNode`                                       | no                                                                  | —          | —           |
| `density`           | `'compact'                                                      | 'normal'                                                            | 'relaxed'` | no          | `'normal'` | —   |
| `zebra`             | `boolean`                                                       | no                                                                  | `false`    | —           |
| `stickyHeader`      | `boolean`                                                       | no                                                                  | `false`    | —           |
| `loading`           | `boolean`                                                       | no                                                                  | `false`    | —           |
| `emptyState`        | `ReactNode`                                                     | no                                                                  | —          | —           |
| `title`             | `string`                                                        | no                                                                  | —          | —           |
| `description`       | `string`                                                        | no                                                                  | —          | —           |
| `labels`            | `DataTableLabels`                                               | no                                                                  | —          | —           |
| `className`         | `string`                                                        | no                                                                  | —          | —           |

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

## Design tokens

- `--cascade-color-surface`
- `--cascade-color-bg-subtle`
- `--cascade-color-border`
- `--cascade-color-border-strong`
- `--cascade-color-text`
- `--cascade-color-text-muted`
- `--cascade-color-accent`
- `--cascade-font-sans`
- `--cascade-text-sm`
- `--cascade-text-xs`
- `--cascade-font-semibold`
- `--cascade-font-medium`
- `--cascade-radius-lg`
- `--cascade-radius-sm`
- `--cascade-space-2`
- `--cascade-space-3`
- `--cascade-space-4`
- `--cascade-data-table-max-height`
- `--cascade-duration-150`
- `--cascade-duration-500`
- `--cascade-ease-out`
- `--cascade-ease-in-out`

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `table`
- **Keyboard:** Tab, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Enter, Space

## Dependencies

- `@cascade-ui/core`
- `@cascade-ui/i18n`

## Tags

table, data, grid, sort, filter, pagination, selection
