import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Combobox',
  description:
    'Filterable single-select with an animated custom listbox, built on the dropdown open/close machine',
  category: 'inputs',
  states: ['closed', 'open', 'error'],
  variants: [],
  sizes: ['sm', 'md', 'lg'],
  props: [
    { name: 'options', type: 'ComboboxOption[]', required: true },
    { name: 'value', type: 'string', required: false },
    { name: 'defaultValue', type: 'string', required: false },
    { name: 'onChange', type: '(value: string | undefined) => void', required: false },
    { name: 'clearable', type: 'boolean', required: false, default: 'false' },
    { name: 'searchable', type: 'boolean', required: false, default: 'true' },
    { name: 'label', type: 'string', required: false },
    { name: 'hint', type: 'string', required: false },
    { name: 'error', type: 'string', required: false },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, default: "'md'" },
    { name: 'disabled', type: 'boolean', required: false, default: 'false' },
    { name: 'labels', type: 'ComboboxLabels', required: false },
    { name: 'className', type: 'string', required: false },
  ],
  tokens: [
    '--cascade-color-surface',
    '--cascade-color-surface-overlay',
    '--cascade-color-bg-subtle',
    '--cascade-color-border',
    '--cascade-color-border-strong',
    '--cascade-color-text',
    '--cascade-color-text-muted',
    '--cascade-color-text-subtle',
    '--cascade-color-accent',
    '--cascade-color-danger',
    '--cascade-radius-input',
    '--cascade-radius-md',
    '--cascade-radius-sm',
    '--cascade-shadow-lg',
    '--cascade-motion-enter',
    '--cascade-z-dropdown',
  ],
  accessibility: {
    role: 'combobox',
    wcag: 'AA',
    keyboard: ['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab'],
  },
  examples: [
    {
      title: 'Basic combobox',
      code: `<Combobox
  label="Country"
  options={[
    { value: 'us', label: 'United States' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
  ]}
  onChange={(value) => console.log(value)}
/>`,
    },
  ],
  dependencies: ['@cascade-ui/core', '@cascade-ui/i18n'],
  tags: ['select', 'combobox', 'dropdown', 'filter', 'search'],
}
