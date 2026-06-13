import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'DataTable',
  description:
    'Signal-driven data table with client/server sort, filter, pagination, multi-selection, expandable rows, and CSS content-visibility row containment for large datasets',
  category: 'display',
  states: ['default', 'loading', 'empty'],
  variants: [],
  sizes: ['compact', 'normal', 'relaxed'],
  props: [
    { name: 'columns', type: 'Column<Row>[]', required: true },
    { name: 'rows', type: 'Row[]', required: true },
    { name: 'getRowId', type: '(row: Row) => string', required: false },
    { name: 'sort', type: 'SortState', required: false },
    { name: 'defaultSort', type: 'SortState', required: false },
    {
      name: 'sortMode',
      type: "'client' | 'server'",
      required: false,
      default: "'client'",
    },
    { name: 'onSortChange', type: '(sort: SortState | undefined) => void', required: false },
    { name: 'searchable', type: 'boolean', required: false, default: 'false' },
    {
      name: 'pagination',
      type: '{ pageSize: number; pageSizeOptions?: number[] }',
      required: false,
    },
    {
      name: 'selection',
      type: "{ mode: 'single' | 'multi'; selected?: string[]; onChange?: (ids: string[]) => void }",
      required: false,
    },
    {
      name: 'batchActions',
      type: '{ label: string; onClick: (selectedIds: string[]) => void }[]',
      required: false,
    },
    { name: 'renderExpandedRow', type: '(row: Row) => ReactNode', required: false },
    {
      name: 'density',
      type: "'compact' | 'normal' | 'relaxed'",
      required: false,
      default: "'normal'",
    },
    { name: 'zebra', type: 'boolean', required: false, default: 'false' },
    { name: 'stickyHeader', type: 'boolean', required: false, default: 'false' },
    { name: 'loading', type: 'boolean', required: false, default: 'false' },
    { name: 'emptyState', type: 'ReactNode', required: false },
    { name: 'title', type: 'string', required: false },
    { name: 'description', type: 'string', required: false },
    { name: 'labels', type: 'DataTableLabels', required: false },
    { name: 'className', type: 'string', required: false },
  ],
  tokens: [
    '--cascade-color-surface',
    '--cascade-color-bg-subtle',
    '--cascade-color-border',
    '--cascade-color-border-strong',
    '--cascade-color-text',
    '--cascade-color-text-muted',
    '--cascade-color-accent',
    '--cascade-font-sans',
    '--cascade-text-sm',
    '--cascade-text-xs',
    '--cascade-font-semibold',
    '--cascade-font-medium',
    '--cascade-radius-lg',
    '--cascade-radius-sm',
    '--cascade-space-2',
    '--cascade-space-3',
    '--cascade-space-4',
    '--cascade-data-table-max-height',
    '--cascade-duration-150',
    '--cascade-duration-500',
    '--cascade-ease-out',
    '--cascade-ease-in-out',
  ],
  accessibility: {
    role: 'table',
    wcag: 'AA',
    keyboard: ['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Space'],
  },
  examples: [
    {
      title: 'Basic table',
      code: `<DataTable
  columns={[
    { key: 'name', header: 'Name', sortable: true },
    { key: 'role', header: 'Role' },
  ]}
  rows={[
    { name: 'Alice', role: 'Engineer' },
    { name: 'Bob', role: 'Designer' },
  ]}
  getRowId={(r) => r.name}
/>`,
    },
    {
      title: 'Full-featured: selection, pagination, search',
      code: `<DataTable
  columns={columns}
  rows={rows}
  getRowId={(r) => r.id}
  searchable
  pagination={{ pageSize: 10, pageSizeOptions: [10, 25, 50] }}
  selection={{ mode: 'multi', onChange: setSelected }}
  batchActions={[{ label: 'Delete', onClick: deleteRows }]}
  stickyHeader
  zebra
/>`,
    },
  ],
  dependencies: ['@cascade-ui/core', '@cascade-ui/i18n'],
  tags: ['table', 'data', 'grid', 'sort', 'filter', 'pagination', 'selection'],
  intent: {
    whenToUse: [
      'Displaying tabular data with columns the user sorts, filters, or pages through',
      'Selecting rows for batch actions across a dataset',
      'Rendering large datasets that benefit from row containment and server-side sort/paging',
    ],
    whenNotToUse: [
      'A simple static list of items — use List',
      'Layout grids of cards or media — use a Card grid, not a data table',
    ],
    antiPatterns: [
      {
        bad: 'Using DataTable for two columns of label/value pairs',
        good: 'A description list or a small Card with Stat/Text',
        why: 'The full table machinery (sort, paging, selection) is overhead when there is no dataset to operate on',
      },
    ],
    related: [
      {
        name: 'Pagination',
        relationship: 'contains',
        reason: 'DataTable embeds pagination controls for paged data',
      },
      {
        name: 'EmptyState',
        relationship: 'pairs-with',
        reason: 'Render an EmptyState via the emptyState prop when there are no rows',
      },
    ],
    a11yRationale:
      'Built on a native <table> with proper header semantics; sortable headers expose sort state, selection uses real checkboxes, and arrow-key navigation follows the grid pattern so keyboard users can traverse cells',
    flexibility: [
      {
        area: 'sortMode and density',
        level: 'flexible',
        note: 'Choose client/server sort and density to fit data size and layout',
      },
      {
        area: 'token names',
        level: 'strict',
        note: 'All surfaces, borders, and spacing must resolve to --cascade-* tokens',
      },
    ],
  },
}
