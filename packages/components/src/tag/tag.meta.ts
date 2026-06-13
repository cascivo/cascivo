import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Tag',
  description: 'Compact chip for labeling, categorizing, or filtering content',
  category: 'display',
  states: [],
  variants: ['default', 'info', 'success', 'warning', 'error'],
  sizes: ['sm', 'md'],
  props: [
    {
      name: 'variant',
      type: "'default' | 'info' | 'success' | 'warning' | 'error'",
      required: false,
      default: 'default',
    },
    { name: 'size', type: "'sm' | 'md'", required: false, default: 'md' },
    {
      name: 'onDismiss',
      type: '() => void',
      required: false,
      description: 'When provided, renders a trailing remove button inside the chip',
    },
    { name: 'dismissLabel', type: 'string', required: false, default: 'Remove' },
  ],
  tokens: [
    '--cascade-color-bg-subtle',
    '--cascade-color-text-subtle',
    '--cascade-color-info',
    '--cascade-color-info-subtle',
    '--cascade-color-success',
    '--cascade-color-success-subtle',
    '--cascade-color-warning',
    '--cascade-color-warning-subtle',
    '--cascade-color-destructive',
    '--cascade-color-destructive-subtle',
    '--cascade-radius-badge',
    '--cascade-focus-ring',
  ],
  accessibility: { role: 'none', wcag: 'AA', keyboard: ['Enter', 'Space'] },
  examples: [
    { title: 'Default', code: '<Tag>Design</Tag>' },
    { title: 'Success', code: '<Tag variant="success">Approved</Tag>' },
    {
      title: 'Dismissible',
      code: '<Tag onDismiss={() => removeFilter()}>Filter: Active</Tag>',
      description: 'Renders a trailing remove button labeled by dismissLabel',
    },
  ],
  dependencies: ['@cascade-ui/core', '@cascade-ui/i18n'],
  tags: ['chip', 'label', 'filter', 'category'],
  intent: {
    whenToUse: [
      'Labeling, categorizing, or filtering content with a compact chip',
      'Representing a removable selection or active filter (onDismiss)',
      'Showing a set of keywords or attributes on an item',
    ],
    whenNotToUse: [
      'A static, non-interactive status label — use Badge',
      'A live system state with a dot — use Status',
    ],
    antiPatterns: [
      {
        bad: 'Using Badge with a custom close button to make it removable',
        good: '<Tag onDismiss={remove}> which renders a proper labeled remove button',
        why: 'Tag provides accessible dismiss semantics; bolting interactivity onto Badge skips that',
      },
    ],
    related: [
      {
        name: 'Badge',
        relationship: 'alternative',
        reason: 'Badge is the static, non-interactive counterpart',
      },
      {
        name: 'TagsInput',
        relationship: 'contained-by',
        reason: 'TagsInput renders Tags for each entered value',
      },
    ],
    a11yRationale:
      'When dismissible, the remove control is a real button with a label (dismissLabel) so keyboard users can remove it via Enter/Space; color variants are reinforced by text, not hue alone',
    content: {
      tone: 'Short noun labels',
      notes: 'dismissLabel should name what is removed',
    },
    flexibility: [
      {
        area: 'variant and dismissibility',
        level: 'flexible',
        note: 'onDismiss is optional; variant matches semantic meaning',
      },
      {
        area: 'token names',
        level: 'strict',
        note: 'Variant colors must resolve to --cascade-color-*-subtle tokens',
      },
    ],
  },
}
