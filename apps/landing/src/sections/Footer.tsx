import { Separator } from '@cascivo/components/separator'

const REPO = 'https://github.com/urbanisierung/cascivo'

interface NavLink {
  label: string
  href: string
  mono?: true
}

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
      { label: 'Why cascivo', href: '/docs/why' },
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
                    <a href={link.href} className={link.mono ? 'footer-link-mono' : undefined}>
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
