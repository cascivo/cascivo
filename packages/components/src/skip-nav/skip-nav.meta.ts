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
    '--cascade-color-surface',
    '--cascade-color-border',
    '--cascade-color-text',
    '--cascade-radius-control',
    '--cascade-focus-ring',
  ],
  accessibility: {
    role: 'link',
    wcag: 'AA',
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
}
