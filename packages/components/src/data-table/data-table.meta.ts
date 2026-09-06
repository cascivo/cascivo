import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'DataTable',
  description:
    'Signal-driven data table with client/server sort, filter, pagination, multi-selection, expandable rows, and CSS content-visibility row containment for large datasets',
  category: 'display',
  // Rows render, but sort, filter, selection and pagination are what the component is for;
  // with JS off only page one is reachable.
  clientJs: 'required',
  states: ['default', 'loading', 'empty'],
  variants: [],
  sizes: ['compact', 'normal', 'relaxed'],
  props: [
    {
      name: 'virtualized',
      type: 'boolean',
      required: false,
      description: 'Render only the visible row window for large datasets.',
      default: 'false',
    },
    {
      name: 'rowHeight',
      type: 'number',
      required: false,
      description:
        'Row height in px for the virtualized window. Measured from the first rendered row when omitted, so the density presets stay correct; set it only for custom-sized rows.',
    },
    {
      name: 'windowSize',
      type: 'number',
      required: false,
      description:
        'Rows rendered per window. Derived from the scroller height when omitted; set it only to render a fixed count regardless of height.',
    },
    {
      name: 'overscan',
      type: 'number',
      required: false,
      description: 'Extra rows rendered above/below the window to smooth scrolling.',
      default: '3',
    },
    {
      name: 'columns',
      description: 'The column definitions describing each table column.',
      type: 'Column<Row>[]',
      required: true,
    },
    {
      name: 'rows',
      description: 'The row objects to render — one table row per array element.',
      type: 'Row[]',
      required: true,
    },
    {
      name: 'getRowId',
      description: 'Returns a stable unique id for a row.',
      type: '(row: Row) => string',
      required: false,
    },
    { name: 'sort', description: 'The controlled sort state.', type: 'SortState', required: false },
    {
      name: 'defaultSort',
      description: 'The initial sort state when uncontrolled.',
      type: 'SortState',
      required: false,
    },
    {
      name: 'sortMode',
      description: "Whether sorting is handled client-side or by the server ('client' | 'server').",
      type: "'client' | 'server'",
      required: false,
      default: "'client'",
    },
    {
      name: 'onSortChange',
      description: 'Called with the new sort state when it changes.',
      type: '(sort: SortState | undefined) => void',
      required: false,
    },
    {
      name: 'searchable',
      description: 'When true, shows a search/filter input.',
      type: 'boolean',
      required: false,
      default: 'false',
    },
    {
      name: 'pagination',
      description:
        'Paging config: pageSize, optional pageSizeOptions, and page/onPageChange to control the current page. With `server`, it is the pager for server-side paging.',
      type: '{ pageSize: number; pageSizeOptions?: number[]; page?: number; onPageChange?: (page: number) => void }',
      required: false,
    },
    {
      name: 'selection',
      description: 'Row-selection configuration (mode and selected ids).',
      type: "{ mode: 'single' | 'multi'; selected?: string[]; onChange?: (ids: string[]) => void }",
      required: false,
    },
    {
      name: 'batchActions',
      description: 'Actions applied to the currently selected rows.',
      type: '{ label: string; onClick: (selectedIds: string[]) => void }[]',
      required: false,
    },
    {
      name: 'filters',
      description:
        'Per-column filter values (controlled), keyed by column key. Columns opt in with `Column.filter`: `text` (substring), `select` (faceted checklist with counts), `range` (numeric min/max).',
      type: 'ColumnFilters',
      required: false,
    },
    {
      name: 'defaultFilters',
      description: 'Initial per-column filter values (uncontrolled).',
      type: 'ColumnFilters',
      required: false,
    },
    {
      name: 'onFiltersChange',
      description: 'Called with the full filter map whenever any column filter changes.',
      type: '(filters: ColumnFilters) => void',
      required: false,
    },
    {
      name: 'noResultsState',
      description:
        'Shown instead of emptyState when there are rows but the search or filters match none of them.',
      type: 'ReactNode',
      required: false,
    },
    {
      name: 'toolbar',
      description:
        'Extra controls rendered in the toolbar next to the search box — exports, primary actions.',
      type: 'ReactNode',
      required: false,
    },
    {
      name: 'rowActions',
      description:
        'Per-row actions. Returns the menu entries for a row; rendered as a trailing overflow-menu column. Each entry has id, label, onSelect(row), and optional destructive/disabled/icon.',
      type: '(row: Row) => RowAction<Row>[]',
      required: false,
    },
    {
      name: 'columnState',
      description:
        'User-adjustable column layout (controlled): `hidden` keys, display `order`, explicit `widths` in px, and `pinned` sides. One object, so it round-trips through storage or a URL as a unit.',
      type: 'ColumnState',
      required: false,
    },
    {
      name: 'defaultColumnState',
      description: 'Initial column layout (uncontrolled).',
      type: 'ColumnState',
      required: false,
    },
    {
      name: 'onColumnStateChange',
      description: 'Called with the full column layout whenever the user changes it.',
      type: '(state: ColumnState) => void',
      required: false,
    },
    {
      name: 'columnSettings',
      description:
        'Which column-layout controls to offer: `visibility` (a "Columns" menu in the toolbar), `resizable` (a drag handle per header; arrows nudge, Home resets), `reorderable` (Move left/right in the header menu), `pinnable` (Pin to start/end in the header menu). All off by default.',
      type: 'ColumnSettings',
      required: false,
    },
    {
      name: 'server',
      description:
        'Server-driven mode: rows are rendered as the current page verbatim and `onQueryChange({ sort, search, filters, page, pageSize })` fires whenever any of them changes (not on mount). `totalItems` drives the pager. One switch turns off client sort, search, filters and paging together.',
      type: 'DataTableServer',
      required: false,
    },
    {
      name: 'multiSort',
      description:
        'Allow sorting by more than one column: Shift-click a header adds it as a tie-breaker (`SortState.thenBy`); a plain click replaces the whole sort. Sorted headers show their level.',
      type: 'boolean',
      required: false,
      default: 'false',
    },
    {
      name: 'stateKey',
      description:
        "Remember the user's column layout and sort across reloads, in local storage under this key. Applies to uncontrolled `columnState`/`sort`; controlled props still win. Tables sharing a key share the preference.",
      type: 'string',
      required: false,
    },
    {
      name: 'keyboardNavigation',
      description:
        "How the keyboard moves through the table. 'row' keeps every control in the Tab order with the arrows stepping between them. 'grid' is the APG data-grid pattern: one Tab stop, arrows move a focused cell, Home/End within the row, Ctrl+Home/End to the corners, PageUp/PageDown by a screenful, Enter/F2 enters the cell's control, Escape returns to the cell; rows outside the virtualized window are scrolled to.",
      type: "'row' | 'grid'",
      required: false,
      default: 'row',
    },
    {
      name: 'onCellEdit',
      description:
        'Commits an inline edit with the row, the column key and the new text. Enables editing for every column marked `editable`; the table does not mutate `rows` itself.',
      type: '(row: Row, key: string, value: string) => void',
      required: false,
    },
    {
      name: 'groupBy',
      description:
        "Group the rows by one or more columns, in order. Each group is a collapsible row showing its value, its row count and every `aggregate` column's reduction; leaves keep the current sort inside their group. Groups appear in order of first occurrence — sort by the grouped column to order them.",
      type: 'string | string[]',
      required: false,
    },
    {
      name: 'totals',
      description:
        "Show a totals row under the body with each `aggregate` column's reduction over every row passing the search and filters (not just the page). Sticks to the bottom of the scroller.",
      type: 'boolean',
      required: false,
      default: 'false',
    },
    {
      name: 'pinnedRows',
      description:
        'Rows kept in view outside sort, search, filters, paging and the virtual window: `top` rows sit under the header (stuck there with `stickyHeader`), `bottom` rows above the totals.',
      type: '{ top?: Row[]; bottom?: Row[] }',
      required: false,
    },
    {
      name: 'columnGroups',
      description:
        "Bands of columns under a shared header, rendered as a row above the column headers. Keep a band's columns adjacent; reordering them apart splits the band.",
      type: 'ColumnGroup[]',
      required: false,
    },
    {
      name: 'exportable',
      description:
        'An "Export CSV" button in the toolbar: every row passing the search and filters (all pages; with `server`, the rows given), in the current sort, visible columns as headers, raw cell values as fields (RFC 4180, UTF-8 with BOM). Pass `{ filename }` to name the file; it defaults to the `title`.',
      type: 'boolean | { filename?: string }',
      required: false,
      default: 'false',
    },
    {
      name: 'renderExpandedRow',
      description: 'Renders the expanded content for a row.',
      type: '(row: Row) => ReactNode',
      required: false,
    },
    {
      name: 'density',
      description:
        "Row density — 'compact', 'normal', or 'relaxed'. ⚠ It sets a row **height floor**, " +
        'so it is invisible whenever the cell content is already taller: a two-line cell or a ' +
        'Badge stack looks identical at every density. Reported as "barely distinguishable" — ' +
        'the prop works, the content is winning. Shrink the cell content, or set ' +
        '`--cascivo-data-table-cell-gap` to tighten the horizontal rhythm too.',
      type: "'compact' | 'normal' | 'relaxed'",
      required: false,
      default: "'normal'",
    },
    {
      name: 'zebra',
      description: 'When true, applies alternating row striping.',
      type: 'boolean',
      required: false,
      default: 'false',
    },
    {
      name: 'stickyHeader',
      description: 'When true, the header stays fixed while the body scrolls.',
      type: 'boolean',
      required: false,
      default: 'false',
    },
    {
      name: 'loading',
      description: 'When true, shows a loading state.',
      type: 'boolean',
      required: false,
      default: 'false',
    },
    {
      name: 'emptyState',
      description: 'Content shown when there are no rows.',
      type: 'ReactNode',
      required: false,
    },
    {
      name: 'ariaLabel',
      nameVisibility: 'invisible',
      description:
        'Invisible accessible name for the table, used when there is no visible `title`. A table with neither is an unnamed landmark; dev-warns.',
      type: 'string',
      required: false,
    },
    {
      name: 'title',
      description: "Visible caption above the table; it also becomes the table's accessible name.",
      type: 'string',
      required: false,
    },
    {
      name: 'description',
      description: 'Supporting description text.',
      type: 'string',
      required: false,
    },
    {
      name: 'labels',
      description: 'Overrides for the component’s user-visible strings (i18n).',
      type: 'DataTableLabels',
      required: false,
    },
    {
      name: 'className',
      description: 'Additional CSS class names merged onto the root element.',
      type: 'string',
      required: false,
    },
  ],
  typeDefs: [
    {
      name: 'Column<Row>',
      description:
        'A single column definition. `render` is the escape hatch for custom cell content — return any ReactNode (a Badge, an icon + link, a formatted value); when omitted the cell shows `String(row[key])`.',
      fields: [
        {
          name: 'key',
          type: 'string',
          required: true,
          description: 'Row property this column reads, and the sort key.',
        },
        { name: 'header', type: 'string', required: true, description: 'Column header label.' },
        {
          name: 'sortable',
          type: 'boolean',
          required: false,
          description: 'When true, the header toggles sort on this column.',
        },
        {
          name: 'render',
          type: '(row: Row) => ReactNode',
          required: false,
          description:
            'Custom cell renderer. Return a Badge, icon + link, or formatted value. Omit to render `String(row[key])`.',
        },
        {
          name: 'align',
          type: "'start' | 'end'",
          required: false,
          description: "Cell/text alignment. Use 'end' for numbers and timestamps.",
        },
        {
          name: 'filter',
          type: "'text' | 'select' | 'range'",
          required: false,
          description:
            'Offer a per-column filter under the header: a substring input, a faceted checklist of distinct values with counts, or a numeric min/max pair. Values surface through the `filters` props.',
        },
        {
          name: 'aggregate',
          type: "'sum' | 'avg' | 'min' | 'max' | 'count' | ((rows: Row[]) => ReactNode)",
          required: false,
          description:
            'What group rows and the `totals` row show for this column: a built-in reduction over the numeric cell values (`count` counts rows), or a function of the rows.',
        },
        {
          name: 'editable',
          type: 'boolean',
          required: false,
          description:
            'Edit cells in place: each renders an Editable (click, Enter or F2 to start; Enter commits, Escape cancels) that commits through `onCellEdit`. Ignored with a custom `render` or without `onCellEdit`.',
        },
        {
          name: 'minWidth',
          type: 'string',
          required: false,
          description: 'Floor for the column width, any CSS length.',
        },
        {
          name: 'width',
          type: 'string',
          required: false,
          description:
            'Preferred column width (any CSS length, e.g. `120px`), with an automatic content ' +
            'floor. ⚠ Sizing EVERY column switches the table to `table-layout: fixed`. ⚠ ' +
            '"Leave one unsized" is necessary but NOT sufficient: the leftover width is split ' +
            'by content weight, so if the sized columns nearly fill the table the remainder ' +
            'can be narrower than the content needs and long tokens wrap mid-word. Leave the ' +
            'widest free-form column unsized, keep sized columns to ~2/3 of the table, and ' +
            'give the free-form one a `minWidth` when the data has long unbreakable tokens.',
        },
      ],
    },
    {
      name: 'SortState',
      description: 'Controlled/initial sort state, used by `sort`, `defaultSort`, `onSortChange`.',
      fields: [
        { name: 'key', type: 'string', required: true, description: 'The sorted column key.' },
        {
          name: 'direction',
          type: "'asc' | 'desc'",
          required: true,
          description: 'Sort direction.',
        },
        {
          name: 'thenBy',
          type: '{ key: string; direction: "asc" | "desc" }[]',
          required: false,
          description: 'Secondary columns that break ties, in order (multi-sort).',
        },
      ],
    },
    {
      name: 'DataTableServer',
      description:
        'Server-driven mode. The table renders `rows` as the current page and reports every change to sort, search, filters, page or page size through `onQueryChange`; nothing runs on the client.',
      fields: [
        {
          name: 'totalItems',
          type: 'number',
          required: false,
          description: 'Total rows across every page; drives the pager and the range label.',
        },
        {
          name: 'onQueryChange',
          type: '(query: TableQuery) => void',
          required: true,
          description:
            'Called with the full query whenever it changes. Not called on mount — the rows passed initially are the first page.',
        },
      ],
    },
    {
      name: 'TableQuery',
      description: 'What the server is asked to apply.',
      fields: [
        {
          name: 'sort',
          type: 'SortState | undefined',
          required: true,
          description: 'Active sort.',
        },
        {
          name: 'search',
          type: 'string',
          required: true,
          description: 'Trimmed global search text.',
        },
        {
          name: 'filters',
          type: 'ColumnFilters',
          required: true,
          description: 'Per-column filter values keyed by column key.',
        },
        { name: 'page', type: 'number', required: true, description: '1-based page.' },
        { name: 'pageSize', type: 'number', required: true, description: 'Rows per page.' },
      ],
    },
    {
      name: 'ColumnState',
      description:
        'User-adjustable column layout, used by `columnState`, `defaultColumnState`, `onColumnStateChange`.',
      fields: [
        {
          name: 'hidden',
          type: 'string[]',
          required: false,
          description: 'Keys of hidden columns. At least one column always stays visible.',
        },
        {
          name: 'order',
          type: 'string[]',
          required: false,
          description: 'Display order of column keys; keys not listed follow in definition order.',
        },
        {
          name: 'widths',
          type: 'Record<string, number>',
          required: false,
          description:
            'Explicit widths in px by key — what the resize handle writes. Any set width switches the table to a fixed layout.',
        },
        {
          name: 'pinned',
          type: "Record<string, 'start' | 'end'>",
          required: false,
          description:
            'Pinned columns by key. Pinned-start columns render first and stick to the leading edge; pinned-end last, to the trailing edge.',
        },
      ],
    },
    {
      name: 'ColumnGroup',
      description: 'A band of columns under one shared header (`columnGroups`).',
      fields: [
        { name: 'header', type: 'string', required: true, description: 'The band label.' },
        {
          name: 'columns',
          type: 'string[]',
          required: true,
          description: 'Column keys in the band. Non-adjacent keys render as separate spans.',
        },
      ],
    },
    {
      name: 'ColumnSettings',
      description: 'Which column-layout controls the table offers. All off by default.',
      fields: [
        {
          name: 'visibility',
          type: 'boolean',
          required: false,
          description: 'A "Columns" menu in the toolbar that shows and hides columns.',
        },
        {
          name: 'resizable',
          type: 'boolean',
          required: false,
          description:
            'A drag handle on each header; arrow keys nudge by 16px (Shift: 64px), Home returns to auto, double-click too.',
        },
        {
          name: 'reorderable',
          type: 'boolean',
          required: false,
          description:
            '"Move left" / "Move right" in each column\'s header menu (within its pin group).',
        },
        {
          name: 'pinnable',
          type: 'boolean',
          required: false,
          description: '"Pin to start" / "Pin to end" / "Unpin" in each column\'s header menu.',
        },
      ],
    },
    {
      name: 'RowAction<Row>',
      description: 'One entry in a row actions menu.',
      fields: [
        { name: 'id', type: 'string', required: true, description: 'Stable id (menu key).' },
        { name: 'label', type: 'string', required: true, description: 'Menu entry text.' },
        {
          name: 'onSelect',
          type: '(row: Row) => void',
          required: true,
          description: 'Activation handler; receives the row the menu belongs to.',
        },
        {
          name: 'destructive',
          type: 'boolean',
          required: false,
          description: 'Style as a destructive action.',
        },
        { name: 'disabled', type: 'boolean', required: false, description: 'Disable the entry.' },
        { name: 'icon', type: 'ReactNode', required: false, description: 'Leading icon.' },
      ],
    },
  ],
  tokens: [
    '--cascivo-color-surface',
    '--cascivo-color-bg-subtle',
    '--cascivo-color-border',
    '--cascivo-color-border-strong',
    '--cascivo-color-text',
    '--cascivo-color-text-muted',
    '--cascivo-color-accent',
    '--cascivo-font-sans',
    '--cascivo-text-sm',
    '--cascivo-text-xs',
    '--cascivo-font-semibold',
    '--cascivo-font-medium',
    '--cascivo-radius-lg',
    '--cascivo-radius-sm',
    '--cascivo-space-2',
    '--cascivo-space-3',
    '--cascivo-space-4',
    '--cascivo-data-table-max-height',
    '--cascivo-data-table-cell-gap',
    '--cascivo-duration-150',
    '--cascivo-duration-500',
    '--cascivo-ease-out',
    '--cascivo-ease-in-out',
  ],
  accessibility: {
    role: 'table',
    wcag: '2.2-AA',
    keyboard: [
      'Tab',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Enter',
      'Space',
      'Home',
      'End',
      'PageUp',
      'PageDown',
      'F2',
      'Escape',
    ],
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
      title: 'Custom cell content with Column.render',
      description:
        'Use Column.render to return any ReactNode per cell — a Badge for status, an icon + link for a repo, a right-aligned timestamp. Columns without render fall back to String(row[key]).',
      code: `<DataTable
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
    {
      title: 'Filters, row actions and a columns menu',
      description:
        'Per-column filters under the header (a text input, a faceted checklist with counts, a numeric range), a row actions menu, and a toolbar Columns menu to hide columns.',
      code: `<DataTable
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
/>`,
    },
    {
      title: 'Grid keyboard mode with inline editing',
      description:
        'One Tab stop; the arrows move a focused cell and Enter or F2 opens the cell for editing. Commit the edit into your own state — the table never mutates `rows`.',
      code: `<DataTable
  columns={[
    { key: 'name', header: 'Name', editable: true },
    { key: 'qty', header: 'Qty', editable: true, align: 'end' },
  ]}
  rows={items}
  getRowId={(r) => r.id}
  keyboardNavigation="grid"
  onCellEdit={(row, key, value) => update(row.id, { [key]: value })}
  ariaLabel="Line items"
/>`,
    },
    {
      title: 'Grouped, with totals and a column band',
      description:
        'Rows grouped by region with a count and a sum on each group row, a sticky totals row over everything that passes the filters, and two columns under one "Order" header.',
      code: `<DataTable
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
/>`,
    },
    {
      title: 'Server-driven',
      description:
        'The server applies sort, search, filters and paging; the table renders the page it is given and reports the query whenever it changes.',
      code: `<DataTable
  columns={columns}
  rows={page.rows}
  getRowId={(r) => r.id}
  searchable
  pagination={{ pageSize: 50 }}
  server={{ totalItems: page.total, onQueryChange: load }}
  ariaLabel="Orders"
/>`,
    },
    {
      title: 'A million rows',
      description:
        'Virtualized: only the visible rows are in the DOM, the scrollbar reaches the last row at any count, and search and sort stay usable. Row height and viewport are measured, so nothing else is needed.',
      code: `<DataTable
  columns={columns}
  rows={millionRows}
  getRowId={(r) => r.id}
  virtualized
  searchable
  ariaLabel="Events"
/>`,
    },
  ],
  dependencies: ['@cascivo/core', '@cascivo/i18n'],
  registryDependencies: ['button', 'checkbox', 'editable', 'overflow-menu', 'popover'],
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
        note: 'All surfaces, borders, and spacing must resolve to --cascivo-* tokens',
      },
    ],
  },
}
