import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'Link',
  description: 'Styled anchor for navigation, standalone or inline within prose',
  category: 'navigation',
  clientJs: 'none',
  states: [],
  variants: ['standalone', 'inline'],
  sizes: ['sm', 'md', 'lg'],
  props: [
    {
      name: 'variant',
      description:
        "`standalone` uses the system's own type and underlines on hover — for a link that stands on its own. `inline` inherits the surrounding prose font and stays underlined — for a link inside a paragraph.",
      type: "'standalone' | 'inline'",
      required: false,
      default: 'standalone',
    },
    {
      name: 'size',
      description: "Visual size of the component (e.g. 'sm', 'md', 'lg').",
      type: "'sm' | 'md' | 'lg'",
      required: false,
      default: 'md',
    },
    {
      name: 'external',
      description: 'When true, treats the link as external (opens in a new tab with rel safety).',
      type: 'boolean',
      required: false,
      default: 'false',
    },
    { name: 'href', description: 'The destination URL.', type: 'string', required: false },
    {
      name: 'asChild',
      description:
        "Render the single child element instead of cascivo's own `<a>`, so the link styling lands on your router's Link. ⚠ This — not `setLinkComponent` — is how you style an in-content link in a routed app; `setLinkComponent` only covers the config-driven navs. See https://cascivo.com/docs/using-with-a-router.md.",
      type: 'boolean',
      required: false,
      default: 'false',
    },
  ],
  tokens: [
    '--cascivo-color-accent-text',
    '--cascivo-color-accent-text-hover',
    '--cascivo-link-color',
    '--cascivo-radius-sm',
    '--cascivo-focus-ring',
  ],
  accessibility: {
    role: 'link',
    wcag: '2.2-AA',
    keyboard: ['Enter'],
  },
  examples: [
    { title: 'Standalone', code: '<Link href="/docs">View documentation</Link>' },
    {
      title: 'Inline',
      code: '<p>Read the <Link variant="inline" href="/guide">guide</Link> first.</p>',
      description: 'Inline links inherit the surrounding font size and stay underlined.',
    },
    {
      title: 'External',
      code: '<Link external href="https://example.com">Example</Link>',
      description: 'Opens in a new tab with rel="noreferrer" and a visual indicator.',
    },
  ],
  dependencies: ['@cascivo/core'],
  tags: ['link', 'anchor', 'navigation'],
  intent: {
    whenToUse: [
      'Navigating to another page, view, or resource via a real href',
      'Inline cross-references within prose (variant="inline")',
      'Linking to an external destination with a clear new-tab indicator (external)',
    ],
    whenNotToUse: [
      'Triggering an action or mutation with no destination — use Button',
      'Submitting a form — use a submit Button',
    ],
    antiPatterns: [
      {
        bad: '<Link onClick={doThing}> with no href',
        good: '<Button onClick={doThing}>',
        why: 'Links are for navigation; actions belong to buttons so keyboard and assistive tech behave correctly',
      },
    ],
    related: [
      {
        name: 'Button',
        relationship: 'alternative',
        reason: 'Button is for actions; Link is for navigation',
      },
    ],
    a11yRationale:
      'Renders a native <a> so role, Enter activation, and focus come from the platform; external links add rel="noreferrer" and a visual indicator so users know a new tab will open',
    content: {
      tone: 'Descriptive link text that makes sense out of context',
      notes: 'Avoid "click here"; the text should name the destination',
    },
    flexibility: [
      {
        area: 'variant',
        level: 'flexible',
        note: 'standalone vs inline depending on whether the link sits in prose',
      },
      {
        area: 'token names',
        level: 'strict',
        note: 'Accent colors and focus ring must resolve to --cascivo-* tokens',
      },
    ],
  },
}
