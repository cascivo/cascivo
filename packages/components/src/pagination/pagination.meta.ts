import type { ComponentMeta } from '@cascivo/core'

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
    '--cascivo-color-text',
    '--cascivo-color-text-muted',
    '--cascivo-color-surface',
    '--cascivo-color-border',
    '--cascivo-color-border-strong',
    '--cascivo-color-bg-subtle',
    '--cascivo-color-accent',
    '--cascivo-color-accent-subtle',
    '--cascivo-radius-input',
    '--cascivo-radius-button',
    '--cascivo-focus-ring',
  ],
  accessibility: {
    role: 'navigation',
    wcag: '2.2-AA',
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
  dependencies: ['@cascivo/core', '@cascivo/i18n'],
  tags: ['pagination', 'navigation', 'table', 'data', 'pages'],
  intent: {
    whenToUse: [
      'Navigating between pages of a paged dataset',
      'Letting the user change how many items appear per page (onPageSizeChange)',
      'Pairing with a table or list that loads data in chunks',
    ],
    whenNotToUse: [
      'Navigating a content hierarchy — use Breadcrumb',
      'Infinite scroll experiences where pages are not exposed',
    ],
    antiPatterns: [
      {
        bad: 'Using Pagination to navigate between unrelated app sections',
        good: '<Tabs> or nav links for section switching',
        why: 'Pagination semantics imply sequential pages of one dataset, not arbitrary navigation',
      },
    ],
    related: [
      {
        name: 'DataTable',
        relationship: 'pairs-with',
        reason: 'DataTable embeds Pagination for its rows',
      },
      {
        name: 'Breadcrumb',
        relationship: 'alternative',
        reason: 'Breadcrumb is for hierarchy, Pagination for sequential pages',
      },
    ],
    a11yRationale:
      'Wrapped in <nav> with an accessible label; page controls are real buttons with current-page state exposed, and all visible/assistive strings are overridable via labels for i18n',
    flexibility: [
      {
        area: 'page size options',
        level: 'flexible',
        note: 'pageSizeOptions and the size select are optional',
      },
      {
        area: 'token names',
        level: 'strict',
        note: 'Surfaces, borders, and accent must resolve to --cascivo-* tokens',
      },
    ],
  },
}
