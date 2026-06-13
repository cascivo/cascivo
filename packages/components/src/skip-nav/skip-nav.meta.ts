import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'SkipNav',
  description: 'Skip link that jumps keyboard users past the navigation to the main content',
  category: 'navigation',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'targetId',
      type: 'string',
      required: false,
      default: 'cascade-skip-target',
      description: 'SkipNavLink: id of the SkipNavTarget to jump to',
    },
    {
      name: 'labels',
      type: '{ label?: string }',
      required: false,
      description: 'SkipNavLink: overrides the built-in i18n label per instance',
    },
    {
      name: 'id',
      type: 'string',
      required: false,
      default: 'cascade-skip-target',
      description: 'SkipNavTarget: anchor id — must match the link targetId',
    },
  ],
  tokens: [
    '--cascivo-color-surface',
    '--cascivo-color-border',
    '--cascivo-color-text',
    '--cascivo-radius-control',
    '--cascivo-focus-ring',
  ],
  accessibility: {
    role: 'link',
    wcag: '2.2-AA',
    keyboard: ['Tab', 'Enter'],
  },
  examples: [
    {
      title: 'Default pair',
      code: '<><SkipNavLink /><nav>…</nav><SkipNavTarget /><main>…</main></>',
      description: 'SkipNavLink must be the first focusable element on the page',
    },
    {
      title: 'Custom target',
      code: '<><SkipNavLink targetId="main-content" /><SkipNavTarget id="main-content" /></>',
    },
  ],
  dependencies: ['@cascade-ui/core', '@cascade-ui/i18n'],
  tags: ['accessibility', 'skip-link', 'keyboard', 'navigation'],
  intent: {
    whenToUse: [
      'Letting keyboard users jump past repeated navigation to the main content',
      'Meeting WCAG bypass-blocks by providing a skip link as the first focusable element',
      'Targeting a custom main-content anchor (targetId / matching SkipNavTarget id)',
    ],
    whenNotToUse: [
      'General in-page navigation — use anchor links or a table of contents',
      'Visible persistent navigation — this link is hidden until focused',
    ],
    antiPatterns: [
      {
        bad: 'Placing SkipNavLink after the navigation in the DOM',
        good: 'Make SkipNavLink the first focusable element on the page',
        why: 'A skip link only works if the user reaches it before tabbing through the nav it bypasses',
      },
    ],
    related: [
      {
        name: 'ShellHeader',
        relationship: 'alternative',
        reason: 'ShellHeader has a built-in skip-to-content link for console shells',
      },
    ],
    a11yRationale:
      'Renders an anchor that is visually hidden until focused, then becomes visible so sighted keyboard users see where focus is; activating it moves focus to the matching target past the navigation',
    content: {
      tone: 'Plain instruction ("Skip to content")',
      notes: 'Label is i18n-driven and overridable per instance',
    },
    flexibility: [
      {
        area: 'target id',
        level: 'flexible',
        note: 'targetId/id may be customized as long as they match',
      },
      {
        area: 'first-focusable placement',
        level: 'strict',
        note: 'SkipNavLink must be the first focusable element to function',
      },
    ],
  },
}
