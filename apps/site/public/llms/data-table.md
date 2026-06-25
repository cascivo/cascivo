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

## Accessibility

- **WCAG level:** 2.2-AA
- **ARIA role:** `table`
- **Keyboard:** Tab, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Enter, Space

## Dependencies

- `@cascivo/core`
- `@cascivo/i18n`

## Tags

table, data, grid, sort, filter, pagination, selection
