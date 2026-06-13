import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'Tooltip',
  description: 'Contextual label shown on hover or focus',
  category: 'overlay',
  states: ['hidden', 'visible'],
  variants: [],
  sizes: [],
  props: [
    { name: 'content', type: 'ReactNode', required: true },
    {
      name: 'placement',
      type: "'top' | 'right' | 'bottom' | 'left'",
      required: false,
      default: 'top',
    },
    { name: 'children', type: 'ReactElement', required: true },
    {
      name: 'delay',
      type: 'number',
      required: false,
      default: '200',
      description: 'Milliseconds to wait before showing',
    },
  ],
  tokens: [
    '--cascivo-color-text',
    '--cascivo-color-text-on-accent',
    '--cascivo-radius-sm',
    '--cascivo-z-tooltip',
  ],
  accessibility: {
    role: 'tooltip',
    wcag: '2.2-AA',
    keyboard: ['Tab', 'Escape'],
    apgPattern: 'tooltip',
    reducedMotion: true,
    forcedColors: true,
  },
  examples: [
    {
      title: 'Basic',
      code: '<Tooltip content="Copy to clipboard"><Button>Copy</Button></Tooltip>',
    },
  ],
  dependencies: ['@cascivo/core'],
  tags: ['overlay', 'hint', 'popover'],
  intent: {
    whenToUse: [
      'Labeling an icon-only control or clarifying a terse element on hover or focus',
      'Showing brief, supplementary text that is non-essential to completing the task',
      'Progressive disclosure of a short hint anchored to a trigger element',
    ],
    whenNotToUse: [
      'The content is interactive (links, buttons, inputs) — use Popover',
      'Richer non-interactive preview content is needed — use HoverCard',
      'The information is essential and must always be visible — render it inline instead',
    ],
    antiPatterns: [
      {
        bad: '<Tooltip content={<button>Undo</button>}><Icon /></Tooltip>',
        good: '<Popover><button>Undo</button></Popover>',
        why: 'Tooltips are hover/focus hints and cannot reliably hold focusable content; interactive content belongs in a Popover',
      },
    ],
    related: [
      {
        name: 'Popover',
        relationship: 'alternative',
        reason: 'Use when the floating content is interactive',
      },
      {
        name: 'HoverCard',
        relationship: 'alternative',
        reason: 'Use for richer non-interactive preview content',
      },
      {
        name: 'Button',
        relationship: 'pairs-with',
        reason: 'Commonly wraps an icon button to explain its action',
      },
    ],
    a11yRationale:
      'The floating element uses role="tooltip" and is linked to the trigger via aria-describedby only while visible; it shows on both hover and keyboard focus so it is reachable without a pointer.',
    content: {
      tone: 'Very short, plain phrase — a label or one-line hint',
      notes: 'No essential-only information; keep it to a few words and avoid full sentences',
    },
    flexibility: [
      {
        area: 'placement',
        level: 'strict',
        note: 'Limited to top | right | bottom | left, positioned via CSS anchor',
      },
      {
        area: 'delay',
        level: 'flexible',
        note: 'Consumer can tune the show delay (default 200ms)',
      },
    ],
  },
}
