import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Sheet',
  description: 'Slide-in panel from any edge, using popover=manual and @starting-style animations',
  category: 'overlay',
  states: ['open', 'closed'],
  variants: [],
  sizes: [],
  props: [],
  tokens: [
    '--cascivo-color-surface',
    '--cascivo-color-border',
    '--cascivo-radius-lg',
    '--cascivo-shadow-xl',
    '--cascivo-motion-enter',
    '--cascivo-motion-exit',
  ],
  accessibility: {
    role: 'dialog',
    wcag: '2.2-AA',
    keyboard: ['Escape', 'Tab', 'Shift+Tab'],
  },
  examples: [],
  dependencies: ['@cascade-ui/core', '@cascade-ui/i18n'],
  tags: ['overlay', 'drawer', 'panel', 'slide'],
  intent: {
    whenToUse: [
      'Showing secondary content or a form in a panel that slides in from a screen edge',
      'Navigation, filters, or detail views that benefit from full-height side space without leaving the page',
      'Mobile-friendly drawers where a centered modal would feel cramped',
    ],
    whenNotToUse: [
      'A short confirmation or focused decision — use Modal or AlertDialog',
      'Small contextual content anchored to a trigger — use Popover',
    ],
    antiPatterns: [
      {
        bad: '<Sheet title="Delete item?">Are you sure?</Sheet>',
        good: '<AlertDialog title="Delete item?" />',
        why: 'A full edge-to-edge panel is overkill for a yes/no decision; AlertDialog is the right scale and semantics',
      },
    ],
    related: [
      {
        name: 'Modal',
        relationship: 'alternative',
        reason: 'Use for centered, focused dialogs rather than edge panels',
      },
      {
        name: 'Popover',
        relationship: 'alternative',
        reason: 'Use for small content anchored to a trigger element',
      },
    ],
    a11yRationale:
      'Uses popover="manual" with role="dialog" and aria-modal so it is announced as a modal surface; the title labels it via aria-label and Escape/Tab handling comes from the popover platform behavior.',
    flexibility: [
      {
        area: 'side',
        level: 'strict',
        note: 'Limited to start | end | top | bottom — drives the slide direction and animation',
      },
      {
        area: 'body content',
        level: 'flexible',
        note: 'Any children; consumer owns the panel contents',
      },
    ],
  },
}
