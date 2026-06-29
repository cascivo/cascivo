import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'Filter',
  description: 'A group of toggleable pill or outline buttons for filtering content by category',
  category: 'inputs',
  states: ['default', 'selected', 'hover', 'focus'],
  variants: ['pill', 'outline'],
  sizes: [],
  props: [
    {
      name: 'options',
      type: 'FilterOption[]',
      required: true,
      description: 'Array of { label, value } objects to render as filter buttons',
    },
    {
      name: 'value',
      type: 'string[]',
      required: false,
      description: 'Controlled selected values',
    },
    {
      name: 'defaultValue',
      type: 'string[]',
      required: false,
      default: '[]',
      description: 'Initial selected values for uncontrolled use',
    },
    {
      name: 'onChange',
      description: 'Called when the value changes.',
      type: '(selected: string[]) => void',
      required: false,
    },
    {
      name: 'multi',
      type: 'boolean',
      required: false,
      default: 'false',
      description: 'Allow multiple items to be selected simultaneously',
    },
    {
      name: 'variant',
      description: 'Selects the visual style variant.',
      type: "'pill' | 'outline'",
      required: false,
      default: 'pill',
    },
  ],
  tokens: [
    '--cascivo-radius-full',
    '--cascivo-border-default',
    '--cascivo-color-text-subtle',
    '--cascivo-color-text',
    '--cascivo-color-active-bg',
    '--cascivo-color-accent',
    '--cascivo-color-accent-content',
    '--cascivo-ring-width',
    '--cascivo-ring-color',
    '--cascivo-ease-out',
  ],
  accessibility: {
    role: 'group',
    wcag: '2.2-AA',
    keyboard: ['Tab', 'Enter', 'Space'],
  },
  examples: [
    {
      title: 'Single-select',
      code: `<Filter
  options={[
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Archived', value: 'archived' },
  ]}
  aria-label="Filter by status"
/>`,
    },
    {
      title: 'Multi-select',
      code: `<Filter
  multi
  options={[
    { label: 'Design', value: 'design' },
    { label: 'Engineering', value: 'engineering' },
    { label: 'Marketing', value: 'marketing' },
  ]}
  aria-label="Filter by team"
/>`,
    },
    {
      title: 'Outline variant',
      code: `<Filter
  variant="outline"
  options={[{ label: 'React', value: 'react' }, { label: 'Vue', value: 'vue' }]}
  aria-label="Filter by framework"
/>`,
    },
  ],
  dependencies: ['@cascivo/core'],
  tags: ['filter', 'chip', 'tag', 'pill', 'facet', 'category'],
  intent: {
    whenToUse: [
      'Tag or category filtering on listing pages where the active filters must remain visible',
      'Facet chips that toggle content visibility (e.g. product categories, team labels)',
    ],
    whenNotToUse: [
      'Navigation between distinct views — use Tabs',
      'A binary on/off switch — use Toggle',
      'Form field for selecting a value — use Select or Checkbox',
    ],
    antiPatterns: [
      {
        bad: '<Filter options={statusOptions} onChange={navigate} />',
        good: '<Tabs items={statusTabs} />',
        why: 'Filter is for narrowing visible content, not routing between views',
      },
    ],
    related: [
      {
        name: 'Tabs',
        relationship: 'alternative',
        reason: 'Tabs navigate between views; Filter narrows displayed content',
      },
      {
        name: 'Toggle',
        relationship: 'alternative',
        reason: 'Toggle is the binary on/off primitive; Filter handles multi-option sets',
      },
      {
        name: 'Tag',
        relationship: 'pairs-with',
        reason: 'Tag displays the currently active filters as dismissible chips',
      },
    ],
    a11yRationale:
      'Wraps buttons in a role="group" so screen readers announce the group label; each button uses aria-pressed to communicate selected state without relying on color alone',
    flexibility: [
      {
        area: 'variant',
        level: 'flexible',
        note: 'pill suits floating filter bars; outline suits embedded filter rows within a bordered container',
      },
      {
        area: 'multi',
        level: 'flexible',
        note: 'single-select for mutually exclusive categories; multi for additive facets',
      },
    ],
  },
}
