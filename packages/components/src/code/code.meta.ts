import type { ComponentMeta } from '@cascade-ui/core'

export const meta: ComponentMeta = {
  name: 'Code',
  description: 'Inline code span for identifiers, commands, and short snippets',
  category: 'display',
  states: [],
  variants: [],
  sizes: ['sm', 'md'],
  props: [{ name: 'size', type: "'sm' | 'md'", required: false, default: 'md' }],
  tokens: [
    '--cascade-font-mono',
    '--cascade-color-text',
    '--cascade-color-surface',
    '--cascade-color-border',
    '--cascade-radius-indicator',
    '--cascade-text-xs',
    '--cascade-text-sm',
  ],
  accessibility: {
    role: 'code',
    wcag: '2.2-AA',
    keyboard: [],
  },
  examples: [
    { title: 'Default', code: '<Code>npx cascade add button</Code>' },
    {
      title: 'In a sentence',
      code: '<Text>Run <Code>vp check</Code> before committing.</Text>',
      description: 'Sits inline with surrounding text',
    },
    { title: 'Small', code: '<Code size="sm">--cascade-color-accent</Code>' },
  ],
  dependencies: ['@cascade-ui/core'],
  tags: ['typography', 'code', 'inline', 'mono'],
  intent: {
    whenToUse: [
      'Marking up an inline identifier, command, path, or token within prose',
      'Distinguishing literal code from surrounding text with a monospace span',
    ],
    whenNotToUse: [
      'Multi-line code blocks with syntax highlighting — use a <pre> block',
      'Keyboard shortcuts the user should press — use Kbd',
    ],
    antiPatterns: [
      {
        bad: '<Code>Press Cmd+K</Code>',
        good: '<Kbd>⌘</Kbd> <Kbd>K</Kbd>',
        why: 'Code marks literal code; key presses are semantically Kbd',
      },
    ],
    related: [
      {
        name: 'Kbd',
        relationship: 'alternative',
        reason: 'Kbd is for keys to press, not code to read',
      },
      {
        name: 'Prose',
        relationship: 'pairs-with',
        reason: 'Prose styles inline <code> automatically in authored content',
      },
    ],
    a11yRationale:
      'Renders a native <code> element so assistive tech can expose the content as code; relies on monospace and surface, not color alone, to distinguish it',
    flexibility: [
      {
        area: 'size',
        level: 'flexible',
        note: 'sm fits dense UI; md matches body text',
      },
      {
        area: 'token names',
        level: 'strict',
        note: 'Font and surface must resolve to --cascade-font-mono and --cascade-* tokens',
      },
    ],
  },
}
