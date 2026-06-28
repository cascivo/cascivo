import { Separator } from '@cascivo/components/separator'

const REPO = 'https://github.com/cascivo/cascivo'

// Internal targets resolve to OTHER apps/assets on the deployed cascivo.com
// domain (not the landing SPA): /docs + /docs/benchmarks + /docs/why (docs app),
// /storybook → storybook.cascivo.com (separate CF Pages app), /llms.txt +
// /registry.json (served at site root by the deploy). Ecosystem packages link to
// their source under the GitHub repo (one canonical domain — no separate
// cascivo.dev microsite to drift). `pnpm links:check` (scripts/quality/
// landing-links.ts, run in CI) asserts every internal href maps to a known route,
// so a 404 fails the build rather than becoming a manual follow-up.
interface NavLink {
  label: string
  href: string
  mono?: true
}

const isExternal = (href: string) => /^https?:\/\//.test(href)

const COLUMNS: { label: string; links: NavLink[] }[] = [
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
      { label: 'Guides', href: '/guides' },
      { label: 'Create a theme', href: '/create' },
      { label: 'Blocks', href: '/blocks' },
      { label: 'AI layer', href: '/ai' },
      { label: 'Accessibility', href: '/accessibility' },
      { label: 'Performance', href: '/performance' },
      { label: 'Modern CSS', href: '/modern-css' },
    ],
  },
  {
    label: 'Proof',
    links: [
      { label: 'Why cascivo', href: '/docs/why' },
      { label: 'Benchmarks', href: '/docs/benchmarks' },
      { label: 'Methodology', href: `${REPO}/blob/main/apps/bench/METHODOLOGY.md` },
    ],
  },
  {
    label: 'Ecosystem',
    links: [
      { label: '@cascivo/charts', href: `${REPO}/tree/main/packages/charts`, mono: true },
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

export function Footer() {
  return (
    <footer className="footer">
      <Separator />
      <div className="footer-inner">
        <div className="footer-brand">cascivo</div>
        <div className="footer-columns">
          {COLUMNS.map((col) => (
            <nav key={col.label} className="footer-column" aria-label={`Footer: ${col.label}`}>
              <h3 className="footer-column-title">{col.label}</h3>
              <ul className="footer-column-links">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className={link.mono ? 'footer-link-mono' : undefined}
                      {...(isExternal(link.href)
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="footer-note">
          MIT licensed. Built with cascivo — view source, it&apos;s all tokens.
        </div>
      </div>
    </footer>
  )
}
