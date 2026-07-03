import type { BlockMeta } from '../types'

export const meta: BlockMeta = {
  name: 'marketing-features',
  displayName: 'Feature Grid',
  description: 'Three-column responsive feature grid with icon, title, and description per cell.',
  category: 'marketing',
  tags: ['marketing', 'features', 'grid', 'icons'],
  screenshot: {
    light: '/blocks/screenshots/marketing-features-light.png',
    dark: '/blocks/screenshots/marketing-features-dark.png',
  },
  intent: {
    whenToUse: [
      'Landing-page section detailing product capabilities right after the hero',
      'A scannable grid of short value propositions, each with an icon, title, and one-sentence description',
    ],
    whenNotToUse: [
      'Comparing plans or tiers — use pricing',
      'Long-form explanations — the cells are built for one short sentence each, not prose',
    ],
    related: [
      {
        name: 'marketing-hero',
        relationship: 'pairs-with',
        reason: 'The feature grid conventionally follows the hero on a landing page',
      },
      {
        name: 'pricing',
        relationship: 'pairs-with',
        reason: 'Features establish value before the pricing section asks for commitment',
      },
    ],
    a11yRationale:
      'Each feature is an <article> with an <h3> under the section’s <h2>, keeping heading hierarchy intact; decorative icons are aria-hidden',
  },
}
