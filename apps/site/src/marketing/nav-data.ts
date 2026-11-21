// Import-free so build-time code (vite.config.ts web-data) can read the same nav the SPA renders.

export type HeaderLink = { label: string; href: string }

// Slim primary nav (v36): three top-level links. Secondary routes group under a
// "Resources" menu; every route is also reachable from the footer link map.
export const PRIMARY_LINKS: HeaderLink[] = [
  { label: 'Docs', href: '/docs' },
  { label: 'Examples', href: '/examples' },
  { label: 'Guides', href: '/guides' },
]

export const RESOURCE_LINKS: HeaderLink[] = [
  { label: 'Highlights', href: '/highlights' },
  { label: 'Charts', href: '/charts' },
  { label: 'Showcase', href: '/showcase' },
  { label: 'Create', href: '/create' },
  { label: 'Blocks', href: '/blocks' },
  { label: 'Accessibility', href: '/accessibility' },
  { label: 'Performance', href: '/performance' },
  { label: 'Modern CSS', href: '/modern-css' },
  { label: 'AI', href: '/ai' },
]

export const REPO = 'https://github.com/cascivo/cascivo'

// Internal targets resolve to OTHER apps/assets on the deployed cascivo.com
// domain (not the landing SPA): /docs + /docs/benchmarks + /docs/why (docs app),
// /storybook → storybook.cascivo.com (separate CF Pages app), /llms.txt +
// /registry.json (served at site root by the deploy). Ecosystem packages link to
// their source under the GitHub repo (one canonical domain — no separate
// cascivo.dev microsite to drift). `pnpm links:check` (scripts/quality/
// landing-links.ts, run in CI) asserts every internal href maps to a known route,
// so a 404 fails the build rather than becoming a manual follow-up.
export interface NavLink {
  label: string
  href: string
  mono?: true
}

export const FOOTER_COLUMNS: { label: string; links: NavLink[] }[] = [
  {
    label: 'Build',
    links: [
      { label: 'Docs', href: '/docs' },
      { label: 'Storybook', href: 'https://storybook.cascivo.com' },
      { label: 'Templates', href: '/docs/marketplace' },
      { label: 'Examples', href: '/examples' },
      { label: 'Showcase', href: '/showcase' },
      { label: 'GitHub', href: REPO },
    ],
  },
  {
    label: 'Explore',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'Guides', href: '/guides' },
      { label: 'Migrating from shadcn', href: '/docs/migrating' },
      { label: 'Create a theme', href: '/create' },
      { label: 'Blocks', href: '/blocks' },
      { label: 'AI layer', href: '/ai' },
      { label: 'Modern CSS', href: '/modern-css' },
      { label: 'Cascivo Sans', href: '/cascivo-sans' },
      { label: 'FAQ', href: '/docs/faq' },
      { label: 'Changelog', href: '/docs/changelog' },
    ],
  },
  {
    label: 'Proof',
    links: [
      { label: 'Enterprise & AI-first', href: '/enterprise' },
      { label: 'Why cascivo', href: '/docs/why' },
      { label: 'Built on the platform', href: '/docs/platform' },
      { label: 'Upgrading', href: '/docs/upgrading' },
      { label: 'Accessibility', href: '/accessibility' },
      { label: 'Performance', href: '/performance' },
      { label: 'Agent evals', href: '/evals' },
      { label: 'Benchmarks', href: '/docs/benchmarks' },
      { label: 'Methodology', href: `${REPO}/blob/main/apps/bench/METHODOLOGY.md` },
    ],
  },
  {
    label: 'Ecosystem',
    links: [
      { label: '@cascivo/charts', href: `${REPO}/tree/main/packages/charts`, mono: true },
      { label: '@cascivo/flow', href: `${REPO}/tree/main/packages/flow`, mono: true },
      { label: '@cascivo/editor', href: `${REPO}/tree/main/packages/editor`, mono: true },
      { label: '@cascivo/layouts', href: `${REPO}/tree/main/packages/layouts`, mono: true },
      { label: '@cascivo/i18n', href: `${REPO}/tree/main/packages/i18n`, mono: true },
      { label: '@cascivo/icons', href: `${REPO}/tree/main/packages/icons`, mono: true },
      { label: '@cascivo/storage', href: `${REPO}/tree/main/packages/storage`, mono: true },
    ],
  },
  {
    label: 'Machine',
    links: [
      { label: 'llms.txt', href: '/llms.txt', mono: true },
      { label: 'registry.json', href: '/registry.json', mono: true },
      { label: 'MCP', href: `${REPO}/tree/main/packages/mcp` },
    ],
  },
]
