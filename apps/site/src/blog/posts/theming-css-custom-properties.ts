import type { BlogPost } from '../types'

export const post: BlogPost = {
  slug: 'theming-css-custom-properties',
  title: 'Theming a React app with CSS custom properties, no build step',
  description:
    'No config file, no build plugin, no CSS-in-JS runtime. A three-tier token system and a data-theme attribute — here’s how far you can get with plain CSS custom properties.',
  datePublished: '2026-07-07',
  tags: ['tutorial', 'css', 'theming'],
  blocks: [
    {
      type: 'p',
      text: 'Theming doesn’t need a config file to compile, a build plugin, or a runtime CSS-in-JS engine generating class names on every render. CSS custom properties, scoped with a data-theme attribute, get you a full theming system with none of that — the browser already does the work.',
    },
    { type: 'h2', text: 'Three tiers, three reasons to touch each one' },
    {
      type: 'p',
      text: 'The trick that makes this scale past "just override some colors" is splitting tokens into three layers, each answering a different question:',
    },
    {
      type: 'ul',
      items: [
        'Primitive — the raw palette. --cascivo-blue-50: oklch(0.97 0.025 250). Fixed values with no meaning attached; you rarely touch these directly.',
        'Semantic — what a role means. --cascivo-color-accent-subtle: var(--cascivo-blue-50). Themes override this layer, and so do you, to rebrand broadly.',
        'Component — per-component knobs. --cascivo-button-radius: var(--cascivo-radius-control). Override on one element or subtree to tune just that component.',
      ],
    },
    {
      type: 'p',
      text: 'You only ever touch the layer that matches how widely you want a change to apply. That’s the whole system — no theming DSL to learn, just three levels of CSS custom property, each pointing at the one below it.',
    },
    { type: 'h2', text: 'Rebrand in one line' },
    {
      type: 'code',
      lang: 'tsx',
      code: `[data-theme='myco'] {
  --cascivo-color-accent: oklch(0.7 0.18 35);
}`,
    },
    {
      type: 'p',
      text: 'Name a theme, override one semantic token, apply it with data-theme="myco". Every accent-driven surface in the app follows — buttons, focus rings, active states — because they all resolve back to that one semantic token, not to a hardcoded color repeated in fifty places.',
    },
    { type: 'h2', text: 'Brand one component, or theme a subtree' },
    {
      type: 'code',
      lang: 'tsx',
      code: `/* Scope a semantic token to a single element */
.checkout-button {
  --cascivo-color-primary: oklch(0.62 0.2 145);
}

/* data-theme cascades to its subtree — a dark sidebar in a light app */
<div data-theme="dark">
  <Sidebar />
</div>`,
    },
    {
      type: 'p',
      text: 'Both of these are the same mechanism as the full-app rebrand, just scoped smaller — a semantic override on one selector instead of the whole document. No new API to learn for "just this one button" versus "the whole app."',
    },
    { type: 'h2', text: 'Where CSS custom properties stop being enough' },
    {
      type: 'p',
      text: 'This approach has a real ceiling: it’s static per data-theme value, computed at parse time, not derived at runtime from arbitrary logic. Generating a full accessible palette from a single brand color — computing contrast-safe shades, dark-mode variants, and every semantic mapping — is a genuinely computational problem, not a CSS-authoring one. That’s a legitimate reason to reach for a generator instead of hand-writing every token.',
    },
    {
      type: 'callout',
      text: 'The honest split: hand-write tokens when you know the values (a brand guide with exact colors). Generate them when you only know the starting point (one brand color and a vibe) and need the rest computed.',
    },
    {
      type: 'links',
      items: [
        { text: 'Generate a full theme from one color', href: '/create' },
        { text: 'The full customization guide', href: '/guides/customization' },
        { text: 'Browse every first-party theme', href: '/docs/tokens' },
      ],
    },
  ],
}
