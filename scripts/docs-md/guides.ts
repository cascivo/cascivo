/**
 * Curated adopter-facing guides. `src` is the docs/ filename, `slug` the served name.
 *
 * One list for every surface a guide is published to: the raw `/docs/<slug>.md` mirror
 * (`generate.ts`), the rendered `/docs/guides/<slug>` pages (`apps/site`'s guides plugin) and
 * the sitemap. A guide added here appears on all three.
 */
export const GUIDES: { src: string; slug: string }[] = [
  { src: 'GETTING-STARTED.md', slug: 'getting-started' },
  { src: 'UPGRADING.md', slug: 'upgrading' },
  { src: 'THEMING.md', slug: 'theming' },
  { src: 'HEADLESS.md', slug: 'headless' },
  { src: 'COMPATIBILITY.md', slug: 'compatibility' },
  { src: 'TOKENS.md', slug: 'tokens' },
  { src: 'RECIPE-DASHBOARD.md', slug: 'recipe-dashboard' },
  { src: 'RECIPE-EMAIL.md', slug: 'recipe-email' },
  { src: 'RECIPE-PAYMENTS.md', slug: 'recipe-payments' },
  { src: 'RECIPE-SOCIAL.md', slug: 'recipe-social' },
  { src: 'EMAIL-PRIMITIVES.md', slug: 'email-primitives' },
  { src: 'EMAIL-CLIENT-SUPPORT.md', slug: 'email-client-support' },
  { src: 'MIGRATING-FROM-SHADCN.md', slug: 'migrating-from-shadcn' },
  { src: 'COMPARED-TO-STYLEX.md', slug: 'compared-to-stylex' },
  { src: 'ENTERPRISE-READINESS.md', slug: 'enterprise-readiness' },
  { src: 'AI-RULES.md', slug: 'ai-rules' },
  { src: 'MACHINE-MODE.md', slug: 'machine-mode' },
  { src: 'TROUBLESHOOTING.md', slug: 'troubleshooting' },
  { src: 'TESTING.md', slug: 'testing' },
  { src: 'USING-WITH-A-ROUTER.md', slug: 'using-with-a-router' },
  { src: 'USING-WITH-NEXTJS.md', slug: 'using-with-nextjs' },
  { src: 'USING-WITH-VITE-SSR.md', slug: 'using-with-vite-ssr' },
  { src: 'USING-WITH-TAILWIND.md', slug: 'using-with-tailwind' },
  { src: 'USING-WITH-PREACT.md', slug: 'using-with-preact' },
  { src: 'USING-WITH-ASTRO.md', slug: 'using-with-astro' },
  { src: 'USING-WITH-GHOST.md', slug: 'using-with-ghost' },
  { src: 'STYLING-INTERNALS.md', slug: 'styling-internals' },
  { src: 'MOTION.md', slug: 'motion' },
  { src: 'CSS-LAYERS-PITFALL.md', slug: 'css-layers-pitfall' },
  { src: 'THIRD-PARTY-CSS.md', slug: 'third-party-css' },
  { src: 'USING-WITH-STRICT-ESLINT.md', slug: 'using-with-strict-eslint' },
]
