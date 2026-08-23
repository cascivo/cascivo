import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'Steps',
  description:
    'Visual progress indicator for multi-step flows with horizontal and vertical orientations',
  category: 'navigation',
  // A static progress indicator; every step and its state render on the server.
  clientJs: 'enhancement',
  states: ['pending', 'active', 'complete', 'error'],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'label',
      nameVisibility: 'invisible',
      description:
        'Alias of `ariaLabel` — the same invisible accessible name under the other spelling. Neither is deprecated.',
      type: 'string',
      required: false,
    },
    {
      name: 'ariaLabel',
      nameVisibility: 'invisible',
      type: 'string',
      required: false,
      description:
        'Accessible label for the steps navigation; defaults to the built-in i18n string.',
    },
    {
      name: 'items',
      description:
        'Alias of `steps` — the catalog-wide name for a config-driven collection. Exactly one of the two is required.',
      type: 'Step[]',
      required: false,
    },
    {
      name: 'steps',
      type: 'Step[]',
      required: false,
      description: 'Array of step objects with label and optional explicit state',
    },
    {
      name: 'activeStep',
      type: 'number',
      required: false,
      default: '0',
      description: 'Index of the currently active step (0-based)',
    },
    {
      name: 'orientation',
      type: "'horizontal' | 'vertical'",
      required: false,
      default: "'horizontal'",
      description:
        'Axis the steps flow along: `horizontal` runs them across with connectors between, `vertical` stacks them down the page.',
    },
    {
      name: 'className',
      description: 'Additional CSS class names merged onto the root element.',
      type: 'string',
      required: false,
    },
  ],
  typeDefs: [
    {
      name: 'Step',
      description: 'Shape of an entry in `steps` / `items`.',
      fields: [
        { name: 'label', type: 'string', required: true, description: 'Visible step label.' },
        {
          name: 'id',
          type: 'string',
          required: false,
          description: 'Stable identity, used as the React key so reordering keeps DOM nodes.',
        },
        {
          name: 'state',
          type: 'StepState | ProgressInput',
          required: false,
          description:
            "Step status. `StepState` ('pending' | 'active' | 'complete' | 'error') is canonical; `ProgressInput` also accepts Timeline's `current` / `upcoming` aliases.",
        },
      ],
    },
  ],
  tokens: [
    '--cascivo-color-accent',
    '--cascivo-color-accent-content',
    '--cascivo-color-success',
    '--cascivo-color-success-content',
    '--cascivo-color-error',
    '--cascivo-color-error-content',
    '--cascivo-color-surface',
    '--cascivo-color-text',
    '--cascivo-color-text-subtle',
    '--cascivo-color-text-muted',
    '--cascivo-border-default',
    '--cascivo-radius-full',
    '--cascivo-ease-out',
  ],
  accessibility: {
    role: 'list',
    wcag: '2.2-AA',
    keyboard: [],
  },
  examples: [
    {
      title: 'Horizontal (default)',
      description: 'Standard checkout or onboarding progress tracker',
      code: `<Steps
  steps={[
    { label: 'Cart' },
    { label: 'Shipping' },
    { label: 'Payment' },
    { label: 'Confirm' },
  ]}
  activeStep={1}
/>`,
    },
    {
      title: 'Vertical',
      description: 'Sidebar-style progress for tall forms',
      code: `<Steps
  orientation="vertical"
  steps={[
    { label: 'Account info' },
    { label: 'Profile details' },
    { label: 'Preferences' },
  ]}
  activeStep={0}
/>`,
    },
    {
      title: 'With explicit error state',
      description: 'Override derived state on a specific step',
      code: `<Steps
  steps={[
    { label: 'Upload' },
    { label: 'Validate', state: 'error' },
    { label: 'Process' },
  ]}
  activeStep={1}
/>`,
    },
  ],
  dependencies: ['@cascivo/core', '@cascivo/i18n'],
  tags: ['steps', 'wizard', 'stepper', 'progress', 'navigation', 'onboarding', 'checkout'],
  intent: {
    whenToUse: [
      'Checkout flows where the user moves through a fixed sequence of screens',
      'Onboarding wizards with a known number of steps',
      'Multi-step forms where showing overall progress reduces abandonment',
    ],
    whenNotToUse: [
      'General section navigation — use Tabs instead',
      'Simple back/next controls without step labels — use Pagination instead',
      'More than 7 steps where the connector lines become unreadable on mobile',
    ],
    antiPatterns: [
      {
        bad: 'Using Steps as a replacement for Tabs for non-sequential navigation',
        good: '<Tabs> for switching between independent views',
        why: 'Steps imply a linear sequence and derive complete/pending state from position',
      },
    ],
    related: [
      {
        name: 'Pagination',
        relationship: 'alternative',
        reason: 'Pagination is for paged data sets, Steps is for guided task sequences',
      },
      {
        name: 'Tabs',
        relationship: 'alternative',
        reason: 'Tabs are for non-sequential section switching, not ordered task flows',
      },
    ],
    a11yRationale:
      'Rendered as an ordered list (<ol>) with aria-label; the active item carries aria-current="step" to communicate progress to screen readers',
    flexibility: [
      {
        area: 'step state',
        level: 'flexible',
        note: 'Each step can override derived pending/active/complete state via step.state',
      },
      {
        area: 'orientation',
        level: 'flexible',
        note: 'Horizontal for top progress bars, vertical for sidebar wizards',
      },
    ],
  },
}
