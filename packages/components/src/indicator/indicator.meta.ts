import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'Indicator',
  description: 'Positions an overlay element (badge, dot, count) at a corner of its child',
  category: 'layout',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'children',
      type: 'React.ReactNode',
      required: true,
    },
    {
      name: 'overlay',
      type: 'React.ReactNode',
      required: true,
      description: 'The element to display at the corner (badge, dot, count)',
    },
    {
      name: 'placement',
      type: "'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'",
      required: false,
      default: 'top-end',
    },
    {
      name: 'className',
      type: 'string',
      required: false,
    },
  ],
  tokens: [],
  accessibility: {
    role: 'none',
    wcag: '2.2-AA',
    keyboard: [],
  },
  examples: [
    {
      title: 'Notification count',
      code: '<Indicator overlay={<Badge>3</Badge>}><Button variant="ghost"><Icon name="bell" /></Button></Indicator>',
      description: 'Notification count badge on an icon button',
    },
    {
      title: 'Online status',
      code: '<Indicator overlay={<span className="status-dot" />} placement="bottom-end"><Avatar src="/user.jpg" /></Indicator>',
      description: 'Online status dot on an avatar',
    },
    {
      title: 'Bottom-start placement',
      code: '<Indicator overlay={<Badge variant="destructive">!</Badge>} placement="bottom-start"><Card>Content</Card></Indicator>',
      description: 'Indicator positioned at the bottom-start corner',
    },
  ],
  dependencies: [],
  tags: ['badge', 'indicator', 'overlay', 'notification', 'layout'],
  intent: {
    whenToUse: ['Notification counts on icon buttons', 'Status dots on avatars'],
    whenNotToUse: [
      'Inline badges within text — use Badge directly',
      'Status messages below a field — use a form hint or Alert',
    ],
    related: [
      {
        name: 'Badge',
        relationship: 'contained-by',
        reason: 'Badge is the most common overlay content placed inside Indicator',
      },
      {
        name: 'Avatar',
        relationship: 'used-with',
        reason: 'Indicator is frequently used to attach a status dot to an Avatar',
      },
    ],
    a11yRationale:
      "The overlay is marked aria-hidden because it is a visual affordance — the underlying control (button, avatar) carries its own accessible label. Screen-reader users should receive the count or status through the control's accessible name or a live region, not from the overlay div.",
    flexibility: [
      {
        area: 'placement',
        level: 'flexible',
        note: 'All four corners are supported; top-end is the most common convention for notification counts',
      },
    ],
  },
}
