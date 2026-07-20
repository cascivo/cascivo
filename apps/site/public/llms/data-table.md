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

| Prop                | Type                                                                                     | Required | Default    | Description                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------- | -------- | ---------- | ------------------------------------------------------------------------------- |
| `virtualized`       | `boolean`                                                                                | no       | `false`    | Render only the visible row window for large datasets.                          |
| `rowHeight`         | `number`                                                                                 | no       | `40`       | Fixed row height in px, used to compute the virtualized window.                 |
| `windowSize`        | `number`                                                                                 | no       | `20`       | Number of rows rendered in the virtualized window.                              |
| `overscan`          | `number`                                                                                 | no       | `3`        | Extra rows rendered above/below the window to smooth scrolling.                 |
| `columns`           | `Column<Row>[]`                                                                          | yes      | —          | The column definitions describing each table column.                            |
| `rows`              | `Row[]`                                                                                  | yes      | —          | The row objects to render — one table row per array element.                    |
| `getRowId`          | `(row: Row) => string`                                                                   | no       | —          | Returns a stable unique id for a row.                                           |
| `sort`              | `SortState`                                                                              | no       | —          | The controlled sort state.                                                      |
| `defaultSort`       | `SortState`                                                                              | no       | —          | The initial sort state when uncontrolled.                                       |
| `sortMode`          | `'client' \| 'server'`                                                                   | no       | `'client'` | Whether sorting is handled client-side or by the server ('client' \| 'server'). |
| `onSortChange`      | `(sort: SortState \| undefined) => void`                                                 | no       | —          | Called with the new sort state when it changes.                                 |
| `searchable`        | `boolean`                                                                                | no       | `false`    | When true, shows a search/filter input.                                         |
| `pagination`        | `{ pageSize: number; pageSizeOptions?: number[] }`                                       | no       | —          | Pagination configuration (page size and options).                               |
| `selection`         | `{ mode: 'single' \| 'multi'; selected?: string[]; onChange?: (ids: string[]) => void }` | no       | —          | Row-selection configuration (mode and selected ids).                            |
| `batchActions`      | `{ label: string; onClick: (selectedIds: string[]) => void }[]`                          | no       | —          | Actions applied to the currently selected rows.                                 |
| `renderExpandedRow` | `(row: Row) => ReactNode`                                                                | no       | —          | Renders the expanded content for a row.                                         |
| `density`           | `'compact' \| 'normal' \| 'relaxed'`                                                     | no       | `'normal'` | Row density — 'compact', 'normal', or 'relaxed'.                                |
| `zebra`             | `boolean`                                                                                | no       | `false`    | When true, applies alternating row striping.                                    |
| `stickyHeader`      | `boolean`                                                                                | no       | `false`    | When true, the header stays fixed while the body scrolls.                       |
| `loading`           | `boolean`                                                                                | no       | `false`    | When true, shows a loading state.                                               |
| `emptyState`        | `ReactNode`                                                                              | no       | —          | Content shown when there are no rows.                                           |
| `title`             | `string`                                                                                 | no       | —          | Title text for the component.                                                   |
| `description`       | `string`                                                                                 | no       | —          | Supporting description text.                                                    |
| `labels`            | `DataTableLabels`                                                                        | no       | —          | Overrides for the component’s user-visible strings (i18n).                      |
| `className`         | `string`                                                                                 | no       | —          | Additional CSS class names merged onto the root element.                        |

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
- `--cascivo-data-table-cell-gap`
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

---

_Generated from registry v0.7.1 on 2026-07-20. Docs track `main`; compare with https://cascivo.com/registry.json `.version`._
