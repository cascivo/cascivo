import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Slider',
  description: 'Range input for selecting a value within bounds',
  category: 'inputs',
  states: [],
  variants: [],
  sizes: [],
  props: [
    { name: 'label', type: 'string', required: false },
    { name: 'min', type: 'number', required: false, default: '0' },
    { name: 'max', type: 'number', required: false, default: '100' },
    { name: 'step', type: 'number', required: false, default: '1' },
    { name: 'value', type: 'number', required: false },
    { name: 'defaultValue', type: 'number', required: false },
    { name: 'disabled', type: 'boolean', required: false, default: 'false' },
  ],
  tokens: [
    '--cascade-color-accent',
    '--cascade-color-border-strong',
    '--cascade-color-surface',
    '--cascade-radius-full',
    '--cascade-focus-ring',
  ],
  accessibility: {
    role: 'slider',
    wcag: 'AA',
    keyboard: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'],
  },
  examples: [
    { title: 'Basic', code: '<Slider label="Volume" defaultValue={50} />' },
    { title: 'Stepped', code: '<Slider label="Rating" min={0} max={5} step={1} />' },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['form', 'range', 'input'],
}
