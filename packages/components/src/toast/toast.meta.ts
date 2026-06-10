import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Toast',
  description: 'Transient notification surfaced via the useToast hook',
  category: 'overlay',
  states: ['visible', 'dismissing', 'gone'],
  variants: ['default', 'success', 'warning', 'destructive'],
  sizes: [],
  props: [
    { name: 'title', type: 'string', required: true },
    { name: 'description', type: 'string', required: false },
    {
      name: 'variant',
      type: "'default' | 'success' | 'warning' | 'destructive'",
      required: false,
      default: 'default',
    },
    { name: 'duration', type: 'number', required: false, default: '5000' },
  ],
  tokens: [
    '--cascade-color-surface-overlay',
    '--cascade-color-success',
    '--cascade-color-warning',
    '--cascade-color-destructive',
    '--cascade-radius-md',
    '--cascade-z-toast',
  ],
  accessibility: {
    role: 'status',
    wcag: 'AA',
    keyboard: ['Tab'],
  },
  examples: [
    {
      title: 'Trigger',
      code: 'const { toast } = useToast()\ntoast({ title: "Saved", variant: "success" })',
    },
  ],
  dependencies: ['@cascade-ui/core', '@cascade-ui/i18n'],
  tags: ['overlay', 'notification', 'feedback'],
}
