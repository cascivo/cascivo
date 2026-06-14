import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'CodeSnippet',
  description:
    'Displays code (inline, single-line, or multi-line) with an optional copy button; no syntax highlighting',
  category: 'display',
  states: ['idle', 'copied'],
  variants: ['inline', 'single', 'multi'],
  sizes: [],
  props: [],
  tokens: [
    '--cascivo-font-mono',
    '--cascivo-color-text',
    '--cascivo-color-text-muted',
    '--cascivo-color-bg-subtle',
    '--cascivo-color-surface',
    '--cascivo-color-border',
    '--cascivo-radius-surface',
    '--cascivo-radius-control',
  ],
  accessibility: {
    role: 'group',
    wcag: '2.2-AA',
    keyboard: ['Enter', 'Space'],
  },
  examples: [],
  dependencies: ['@cascivo/core', '@cascivo/i18n'],
  tags: ['display', 'code', 'snippet', 'copy', 'pre'],
  intent: {
    whenToUse: [
      'Showing a command, token, or path the user is expected to copy',
      'Displaying a short read-only code block in docs or UI',
      'Inline code references inside flowing text (inline variant)',
    ],
    whenNotToUse: [
      'An editable code input — use a textarea or code editor',
      'Long files needing syntax highlighting and folding — use a dedicated viewer',
    ],
    antiPatterns: [
      {
        bad: '<CodeSnippet variant="inline" code={"line1\\nline2"} />',
        good: '<CodeSnippet variant="multi" code={"line1\\nline2"} />',
        why: 'The inline variant is a single in-text chip; multi-line content belongs in the multi variant',
      },
    ],
    related: [
      {
        name: 'CopyButton',
        relationship: 'pairs-with',
        reason: 'CodeSnippet embeds the same clipboard behavior for its copy affordance',
      },
    ],
    a11yRationale:
      'Code is rendered in semantic <code>/<pre>. The copy button is a real button with an aria-label that flips between the copy and copied messages so the action and its result are announced. Line numbers are aria-hidden so they are not read as content.',
    flexibility: [
      {
        area: 'variant',
        level: 'strict',
        note: 'inline | single | multi — controls the wrapping element and layout',
      },
      {
        area: 'copy button',
        level: 'flexible',
        note: 'Shown by default for single/multi; togglable via showCopyButton',
      },
    ],
  },
}
