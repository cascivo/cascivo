import type { BlockMeta } from '../types'

export const meta: BlockMeta = {
  name: 'marketing-hero',
  displayName: 'Hero Section',
  description: 'Full-width hero with headline, subtitle, CTA pair, and trust badges.',
  category: 'marketing',
  tags: ['marketing', 'hero', 'landing', 'cta'],
  screenshot: {
    light: '/blocks/screenshots/marketing-hero-light.png',
    dark: '/blocks/screenshots/marketing-hero-dark.png',
  },
  intent: {
    whenToUse: [
      'The opening section of a landing page: headline, supporting subtitle, and a primary/secondary CTA pair',
      'Announcing a product or release — the eyebrow Badge slot carries the "New" callout',
      'Building credibility above the fold via the trust-badge row (licence, a11y, dependency claims)',
    ],
    whenNotToUse: [
      'Interior or app pages — use a page header inside app-shell instead',
      'Sections without one clear primary action — the layout is built around a dominant CTA',
    ],
    related: [
      {
        name: 'marketing-features',
        relationship: 'pairs-with',
        reason: 'The feature grid is the natural next section after the hero',
      },
      {
        name: 'pricing',
        relationship: 'pairs-with',
        reason: 'Hero CTA commonly leads to the pricing section further down the page',
      },
      {
        name: 'site-footer',
        relationship: 'pairs-with',
        reason: 'Hero and footer bookend the standard marketing page composition',
      },
    ],
    a11yRationale:
      'The headline is the page’s single <h1>; CTAs are real Buttons and the section reads top-to-bottom in DOM order',
  },
}
