import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'Callout',
  description: 'A styled callout box for highlighting important content',
  category: 'display',
  states: ['idle'],
  variants: ['info', 'warning', 'success', 'error'],
  sizes: [],
  props: [
    {
      name: 'type',
      type: "'info' | 'warning' | 'success' | 'error'",
      required: false,
      default: 'info',
    },
    { name: 'title', type: 'string', required: false },
    { name: 'children', type: 'React.ReactNode', required: true },
  ],
  tokens: [
    '--cascivo-color-info',
    '--cascivo-color-warning',
    '--cascivo-color-success',
    '--cascivo-color-destructive',
    '--cascivo-radius-md',
    '--cascivo-space-1',
    '--cascivo-space-3',
    '--cascivo-space-4',
    '--cascivo-text-sm',
    '--cascivo-color-text',
  ],
  accessibility: {
    role: 'note',
    wcag: 'AA',
    keyboard: [],
  },
  examples: [
    { title: 'Info', code: '<Callout type="info" title="Note">This is an info callout.</Callout>' },
    {
      title: 'Warning',
      code: '<Callout type="warning" title="Warning">Check this before proceeding.</Callout>',
    },
    {
      title: 'Success',
      code: '<Callout type="success" title="Done">Your changes were saved.</Callout>',
    },
    {
      title: 'Error',
      code: '<Callout type="error" title="Error">Something went wrong.</Callout>',
    },
  ],
  dependencies: [],
  tags: ['display', 'callout', 'alert', 'feedback'],
}
