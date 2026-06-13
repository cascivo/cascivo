import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'HoverCard',
  description: 'Hover-triggered popover with configurable open/close delay',
  category: 'overlay',
  states: ['open', 'closed'],
  variants: [],
  sizes: [],
  props: [],
  tokens: [
    '--cascade-color-surface',
    '--cascade-color-border',
    '--cascade-radius-md',
    '--cascade-shadow-md',
    '--cascade-motion-enter',
    '--cascade-motion-exit',
  ],
  accessibility: {
    role: 'complementary',
    wcag: 'AA',
    keyboard: ['Tab', 'Escape'],
  },
  examples: [],
  dependencies: ['@cascade-ui/core'],
  tags: ['overlay', 'hover', 'preview', 'floating'],
  intent: {
    whenToUse: [
      'Showing a rich preview (avatar, summary, links) when a user hovers or focuses a trigger',
      'Supplementary, non-essential context the user can ignore without losing functionality',
      'Cases needing an open/close delay so brief mouse passes do not flicker the card',
    ],
    whenNotToUse: [
      'Short plain-text hints — use Tooltip',
      'Content the user must interact with or that should trap focus — use Popover or Modal',
      'Touch-primary flows where there is no hover — prefer a tap-triggered Popover',
    ],
    antiPatterns: [
      {
        bad: 'Putting required actions (buttons users must click) inside HoverCardContent',
        good: 'Use a Popover triggered by click so the surface is reliably reachable',
        why: 'Hover surfaces are transient and unreachable by touch and many keyboard paths, so essential controls get lost',
      },
    ],
    related: [
      {
        name: 'Tooltip',
        relationship: 'alternative',
        reason: 'Use Tooltip for brief text labels rather than rich preview content',
      },
      {
        name: 'Popover',
        relationship: 'alternative',
        reason: 'Use Popover for click-triggered, interactive, focus-managed content',
      },
    ],
    a11yRationale:
      'The trigger opens on both mouseenter and focus (and closes on mouseleave/blur) so keyboard users get the same preview, and the content is marked role="complementary" to signal it is supplementary rather than a required dialog; the open/close delays prevent accidental flicker.',
    flexibility: [
      {
        area: 'token names',
        level: 'strict',
        note: 'Surface, border, radius, shadow, and motion must resolve to the listed --cascade-* tokens',
      },
      {
        area: 'open/close delay',
        level: 'flexible',
        note: 'openDelay and closeDelay are tunable per instance (defaults 300/100ms)',
      },
      {
        area: 'content',
        level: 'flexible',
        note: 'HoverCardContent accepts arbitrary children',
      },
    ],
  },
}
