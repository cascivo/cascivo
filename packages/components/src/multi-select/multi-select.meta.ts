import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'MultiSelect',
  description: 'Searchable multi-value select with popover listbox',
  category: 'inputs',
  states: ['closed', 'open'],
  variants: [],
  sizes: [],
  props: [
    { name: 'options', type: 'MultiSelectOption[]', required: true },
    { name: 'value', type: 'string[]', required: true },
    { name: 'onValueChange', type: '(v: string[]) => void', required: true },
    { name: 'placeholder', type: 'string', required: false },
    { name: 'disabled', type: 'boolean', required: false, default: 'false' },
    { name: 'labels', type: 'MultiSelectLabels', required: false },
  ],
  tokens: [
    '--cascade-color-surface',
    '--cascade-color-border',
    '--cascade-color-accent',
    '--cascade-radius-input',
    '--cascade-radius-md',
    '--cascade-shadow-md',
    '--cascade-focus-ring',
    '--cascade-motion-enter',
  ],
  accessibility: {
    role: 'listbox',
    wcag: 'AA',
    keyboard: ['ArrowDown', 'ArrowUp', 'Space', 'Enter', 'Escape'],
  },
  examples: [
    {
      title: 'Basic',
      code: `<MultiSelect options={[{label:'One',value:'1'},{label:'Two',value:'2'}]} value={[]} onValueChange={() => {}} />`,
    },
  ],
  dependencies: ['@cascade-ui/core', '@cascade-ui/i18n'],
  tags: ['form', 'select', 'multi', 'input', 'popover'],
}
