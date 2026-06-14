import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'ColorPicker',
  description:
    'Interactive color selection widget with saturation/lightness area, hue and alpha sliders',
  category: 'inputs',
  states: [],
  variants: [],
  sizes: ['sm', 'md', 'lg'],
  props: [
    { name: 'value', type: 'string', required: false, description: 'Controlled hex color value' },
    { name: 'defaultValue', type: 'string', required: false, default: '#3b82f6' },
    { name: 'onValueChange', type: '(value: string) => void', required: false },
    { name: 'presets', type: 'string[]', required: false, description: 'Preset swatch colors' },
    { name: 'alpha', type: 'boolean', required: false, default: 'true' },
    { name: 'label', type: 'string', required: false },
    { name: 'disabled', type: 'boolean', required: false, default: 'false' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, default: 'md' },
  ],
  tokens: [
    '--cascivo-color-accent',
    '--cascivo-color-surface',
    '--cascivo-color-border',
    '--cascivo-color-border-strong',
    '--cascivo-radius-md',
    '--cascivo-radius-full',
    '--cascivo-focus-ring',
  ],
  accessibility: {
    role: 'slider',
    wcag: '2.2-AA',
    keyboard: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'],
    forcedColors: true,
  },
  examples: [
    { title: 'Basic', code: '<ColorPicker defaultValue="#3b82f6" onValueChange={setColor} />' },
    {
      title: 'With presets',
      code: '<ColorPicker presets={["#ef4444", "#3b82f6", "#10b981"]} alpha={false} />',
    },
  ],
  dependencies: ['@cascivo/core', '@cascivo/i18n'],
  tags: ['color', 'input', 'form', 'picker', 'hue', 'alpha'],
  intent: {
    whenToUse: [
      'Letting a user choose an arbitrary color via a visual saturation/lightness area plus hue control',
      'Brand or theme customization UIs where an exact color value (hex) is captured',
      'Forms that need an optional alpha channel alongside the color',
    ],
    whenNotToUse: [
      'Choosing from a small fixed palette only — use a swatch RadioGroup instead',
      'A single accent toggle where a few preset chips suffice',
    ],
    antiPatterns: [
      {
        bad: '<ColorPicker /> with no presets for a brand palette of 4 fixed colors',
        good: '<RadioGroup> of color swatches',
        why: 'A free-form picker invites off-brand values when only a fixed set is allowed',
      },
    ],
    related: [
      {
        name: 'Slider',
        relationship: 'contains',
        reason: 'Hue and alpha channels are range sliders',
      },
      {
        name: 'Input',
        relationship: 'pairs-with',
        reason: 'The hex text field lets users paste an exact value',
      },
    ],
    a11yRationale:
      'The saturation/lightness area is a focusable role="slider" with arrow-key nudging and an aria-valuetext reporting the current hex; hue and alpha are native range inputs that inherit platform slider semantics and announcements.',
    flexibility: [
      {
        area: 'color model',
        level: 'flexible',
        note: 'Values are stored as hex; consumers can convert to rgb/hsl/oklch as needed',
      },
      {
        area: 'token names',
        level: 'strict',
        note: 'Surfaces, borders and focus ring must resolve to --cascivo-* tokens',
      },
    ],
  },
}
