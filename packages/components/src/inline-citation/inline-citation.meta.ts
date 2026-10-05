import type { ComponentMeta } from '@cascivo/core'

export const meta: ComponentMeta = {
  name: 'InlineCitation',
  description:
    'A numbered citation marker inside AI-generated text that links to its source and previews it in a hover card',
  category: 'display',
  // The marker and its link work with JS off; the hover-card preview is HoverCard's own
  // client boundary, so this file adds none.
  clientJs: 'none',
  states: [],
  variants: [],
  sizes: [],
  props: [
    {
      name: 'index',
      description:
        'The visible citation number — the source’s position in the matching Sources list.',
      type: 'number',
      required: true,
    },
    {
      name: 'source',
      description:
        'The cited source (`title`, `url`, optional `description`). Only absolute http(s) URLs become links.',
      type: 'AiSource',
      required: true,
    },
    {
      name: 'labels',
      description:
        'Overrides for the component’s user-visible strings (i18n). `source` may contain `{index}`; the accessible name is "<source>: <title>".',
      type: '{ source?: string }',
      required: false,
    },
  ],
  typeDefs: [
    {
      name: 'AiSource',
      description: 'One source an answer cites (shared with Sources).',
      fields: [
        { name: 'title', type: 'string', required: true, description: 'The source’s title.' },
        {
          name: 'url',
          type: 'string',
          required: true,
          description: 'Treated as untrusted: only absolute http(s) URLs are linked.',
        },
        {
          name: 'description',
          type: 'ReactNode',
          required: false,
          description: 'An excerpt shown in the hover card.',
        },
      ],
    },
  ],
  tokens: [
    '--cascivo-color-ai-subtle',
    '--cascivo-color-ai-sheen',
    '--cascivo-color-text',
    '--cascivo-color-text-muted',
    '--cascivo-radius-full',
    '--cascivo-focus-ring',
  ],
  accessibility: {
    role: 'link',
    wcag: '2.2-AA',
    keyboard: ['Tab', 'Enter'],
    forcedColors: true,
  },
  examples: [
    {
      title: 'In a sentence',
      code: `<p>
  Refunds are available for 30 days.
  <InlineCitation index={1} source={{ title: 'Refund policy', url: 'https://example.com/refunds' }} />
</p>`,
    },
  ],
  dependencies: ['@cascivo/core', '@cascivo/i18n'],
  registryDependencies: ['hover-card', 'sources', 'visually-hidden'],
  tags: ['ai', 'citation', 'sources', 'footnote', 'references', 'provenance'],
  intent: {
    whenToUse: [
      'Attributing a claim in an AI answer to the source it came from, right where the claim is made',
    ],
    whenNotToUse: [
      'Listing every source of an answer — use Sources (and number the citations to match)',
      'General footnotes in authored content — use a plain link or Prose',
    ],
    antiPatterns: [
      {
        bad: 'Numbering citations independently of the Sources list',
        good: 'Use the source’s position in Sources as `index`',
        why: 'A reader matches "2" in the text to row 2 of the list; mismatched numbers point at the wrong source',
      },
    ],
    related: [
      {
        name: 'Sources',
        relationship: 'pairs-with',
        reason: 'The list the numbers point at',
      },
      {
        name: 'HoverCard',
        relationship: 'contains',
        reason: 'The preview opens in a HoverCard on hover and keyboard focus',
      },
    ],
    a11yRationale:
      'A real link whose accessible name starts with the visible number and includes the source title ("Source 1: Refund policy"), so it is meaningful without the hover card, which also opens on keyboard focus. Refused URLs keep the number and name but are not links',
    content: {
      tone: 'Place the marker right after the claim it supports',
    },
    flexibility: [
      {
        area: 'preview content',
        level: 'flexible',
        note: 'description can be any node — an excerpt, a date, a favicon',
      },
      {
        area: 'URL handling',
        level: 'strict',
        note: 'Do not bypass sourceHref() — model output is untrusted',
      },
    ],
  },
}
