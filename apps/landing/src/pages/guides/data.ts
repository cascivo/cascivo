// Static content for the /guides page. Prose, steps, and code strings only —
// competitor numbers are never hardcoded here; they come from the live bench
// modules (perf-data.ts / accessibility/data.ts) at render time.

export const GUIDES_HERO = {
  eyebrow: 'Guides',
  title: 'From "looks good" to "shipping Monday."',
  sub: 'Switching from shadcn? Branding it for your team? Wondering if it even fits your project? Straight answers, real steps, every one ending in a next move.',
  ctas: [
    { label: 'Coming from shadcn →', href: '#migrate' },
    { label: 'Make it yours →', href: '#customize' },
  ],
} as const
