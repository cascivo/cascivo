import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'DatePicker',
  description: 'An accessible date-picker with a calendar popover.',
  category: 'inputs',
  states: ['default', 'open', 'error', 'disabled'],
  variants: [],
  sizes: ['sm', 'md', 'lg'],
  props: [
    { name: 'value', type: 'string', required: false, description: 'Controlled ISO date value (YYYY-MM-DD)' },
    { name: 'defaultValue', type: 'string', required: false, description: 'Uncontrolled default value' },
    { name: 'onChange', type: '(value: string | undefined) => void', required: false, description: 'Called on date selection or clear' },
    { name: 'min', type: 'string', required: false, description: 'Minimum ISO date' },
    { name: 'max', type: 'string', required: false, description: 'Maximum ISO date' },
    { name: 'clearable', type: 'boolean', required: false, description: 'Shows a clear button' },
    { name: 'label', type: 'string', required: false, description: 'Field label' },
    { name: 'hint', type: 'string', required: false, description: 'Hint text' },
    { name: 'error', type: 'string', required: false, description: 'Error message' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, description: 'Field size' },
    { name: 'disabled', type: 'boolean', required: false, description: 'Disables the picker' },
    { name: 'labels', type: 'DatePickerLabels', required: false, description: 'i18n label overrides' },
  ],
  tokens: [
    '--cascade-date-picker-bg',
    '--cascade-date-picker-border',
    '--cascade-date-picker-radius',
    '--cascade-date-picker-day-selected-bg',
    '--cascade-date-picker-day-today-color',
  ],
  accessibility: {
    role: 'combobox',
    wcag: 'AA',
    keyboard: ['Enter', 'Space', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
  },
  examples: [
    { title: 'Basic', code: '<DatePicker label="Date" />', description: 'Uncontrolled date picker' },
    { title: 'Clearable', code: '<DatePicker label="Date" clearable />', description: 'With clear button' },
    { title: 'With constraints', code: '<DatePicker min="2024-01-01" max="2024-12-31" />', description: 'Date range constraint' },
  ],
  dependencies: ['@cascade-ui/core', '@cascade-ui/i18n'],
  tags: ['date', 'calendar', 'picker', 'input', 'form'],
}
