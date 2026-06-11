import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'RatingGroup',
  description: 'Star rating input with accessible radio group pattern',
  category: 'inputs',
  states: ['idle', 'disabled', 'readOnly'],
  variants: [],
  sizes: ['sm', 'md', 'lg'],
  props: [
    { name: 'value', type: 'number', required: true },
    { name: 'onValueChange', type: '(v: number) => void', required: false },
    { name: 'max', type: 'number', required: false, default: '5' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, default: 'md' },
    { name: 'disabled', type: 'boolean', required: false, default: 'false' },
    { name: 'readOnly', type: 'boolean', required: false, default: 'false' },
    { name: 'labels', type: 'RatingGroupLabels', required: false },
  ],
  tokens: [
    '--cascade-color-warning',
    '--cascade-color-border-strong',
    '--cascade-color-accent',
    '--cascade-radius-sm',
  ],
  accessibility: {
    role: 'radiogroup',
    wcag: 'AA',
    keyboard: ['Tab', 'Space', 'Enter'],
  },
  examples: [
    { title: 'Basic', code: '<RatingGroup value={3} onValueChange={() => {}} />' },
    { title: 'Read only', code: '<RatingGroup value={4} readOnly />' },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['form', 'rating', 'stars', 'input', 'feedback'],
}
