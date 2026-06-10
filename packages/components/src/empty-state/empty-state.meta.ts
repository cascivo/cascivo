import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'EmptyState',
  description: 'Placeholder for views that have no data to display',
  category: 'display',
  states: [],
  variants: [],
  sizes: ['md', 'lg'],
  props: [
    { name: 'icon', type: 'ReactNode', required: false },
    { name: 'title', type: 'string', required: true },
    { name: 'description', type: 'string', required: false },
    { name: 'action', type: 'ReactNode', required: false },
    { name: 'size', type: "'md' | 'lg'", required: false, default: 'md' },
  ],
  tokens: [
    '--cascade-color-text',
    '--cascade-color-text-subtle',
    '--cascade-color-text-muted',
    '--cascade-color-bg-subtle',
    '--cascade-radius-full',
  ],
  accessibility: {
    role: 'none',
    wcag: 'AA',
    keyboard: [],
  },
  examples: [
    {
      title: 'Basic',
      code: '<EmptyState title="No results" description="Try adjusting your filters." />',
    },
    {
      title: 'With action',
      code: '<EmptyState icon="📄" title="No documents yet" description="Create your first document to get started." action={<Button>New document</Button>} />',
    },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['empty', 'placeholder', 'zero-state', 'no-data'],
}
