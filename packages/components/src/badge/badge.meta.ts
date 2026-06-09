import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Badge',
  description: 'Small status label or category indicator',
  category: 'display',
  states: [],
  variants: ['default', 'secondary', 'success', 'warning', 'destructive', 'outline'],
  sizes: ['sm', 'md'],
  props: [
    { name: 'variant', type: "'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'", required: false, default: 'default' },
    { name: 'size', type: "'sm' | 'md'", required: false, default: 'md' },
  ],
  tokens: [
    '--cascade-color-accent',
    '--cascade-color-success',
    '--cascade-color-warning',
    '--cascade-color-destructive',
    '--cascade-radius-badge',
  ],
  accessibility: { role: 'status', wcag: 'AA', keyboard: [] },
  examples: [
    { title: 'Default', code: '<Badge>New</Badge>' },
    { title: 'Success', code: '<Badge variant="success">Active</Badge>' },
    { title: 'Destructive', code: '<Badge variant="destructive">Deprecated</Badge>' },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['label', 'status', 'tag'],
}
