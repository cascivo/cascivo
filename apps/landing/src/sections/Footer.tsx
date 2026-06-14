import { Separator } from '@cascivo/components/separator'

const REPO = 'https://github.com/urbanisierung/cascivo'

// Internal targets resolve to OTHER apps/assets on the deployed cascivo.com
// domain (not the landing SPA): /docs + /storybook (separate CF Pages apps),
// /why + /docs/benchmarks (docs app), /llms.txt + /registry.json (served at
// site root by the deploy). If a target ever 404s, that's a deploy-config
// follow-up, not a landing change.
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
      { label: 'Storybook', href: '/storybook' },
      { label: 'GitHub', href: REPO },
    ],
  },
  {
    label: 'Proof',
    links: [
      { label: 'Why cascivo', href: '/why' },
      { label: 'Accessibility', href: '/accessibility' },
      { label: 'Performance', href: '/performance' },
      { label: 'Benchmarks', href: '/docs/benchmarks' },
      { label: 'Methodology', href: `${REPO}/blob/main/apps/bench/METHODOLOGY.md` },
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
