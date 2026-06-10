import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Pagination',
  description: 'Controls for navigating paged data sets, with page size selection',
  category: 'navigation',
  states: [],
  variants: [],
  sizes: [],
  props: [
    { name: 'page', type: 'number', required: true, description: 'Current page (1-based)' },
    { name: 'pageSize', type: 'number', required: true, description: 'Items per page' },
    { name: 'totalItems', type: 'number', required: true, description: 'Total number of items' },
    { name: 'onPageChange', type: '(page: number) => void', required: true },
    { name: 'onPageSizeChange', type: '(size: number) => void', required: false },
    {
      name: 'pageSizeOptions',
      type: 'number[]',
      required: false,
      default: '[10, 25, 50, 100]',
      description: 'Options for the page size select',
    },
    {
      name: 'labels',
      type: 'PaginationLabels',
      required: false,
      description: 'Overridable English strings for all visible and accessible text',
    },
    { name: 'className', type: 'string', required: false },
  ],
  tokens: [
    '--cascade-color-text',
    '--cascade-color-text-muted',
    '--cascade-color-surface',
    '--cascade-color-border',
    '--cascade-color-border-strong',
    '--cascade-color-bg-subtle',
    '--cascade-color-accent',
    '--cascade-color-accent-subtle',
    '--cascade-radius-input',
    '--cascade-radius-button',
    '--cascade-focus-ring',
  ],
  accessibility: {
    role: 'navigation',
    wcag: 'AA',
    keyboard: ['Tab', 'Enter', 'Space', 'ArrowUp', 'ArrowDown'],
  },
  examples: [
    {
      title: 'Basic',
      code: '<Pagination page={1} pageSize={25} totalItems={103} onPageChange={setPage} />',
    },
    {
      title: 'With page size select',
      code: '<Pagination page={page} pageSize={size} totalItems={103} onPageChange={setPage} onPageSizeChange={setSize} />',
    },
    {
      title: 'Custom labels',
      code: "<Pagination page={1} pageSize={10} totalItems={42} onPageChange={setPage} labels={{ previous: 'Zurück', next: 'Weiter' }} />",
    },
  ],
  dependencies: ['@cascade-ui/core', '@cascade-ui/i18n'],
  tags: ['pagination', 'navigation', 'table', 'data', 'pages'],
}
