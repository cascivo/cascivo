import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'Steps',
  description:
    'Visual progress indicator for multi-step flows with horizontal and vertical orientations',
  category: 'navigation',
  states: ['pending', 'active', 'complete', 'error'],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'steps',
      type: 'Step[]',
      required: true,
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
      description: 'Layout direction of the steps',
    },
    {
      name: 'className',
      description: 'Additional CSS class names merged onto the root element.',
      type: 'string',
      required: false,
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
  dependencies: ['@cascivo/core'],
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
