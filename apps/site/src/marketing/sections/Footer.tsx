import { FOOTER_COLUMNS } from '../nav-data'

const isExternal = (href: string) => /^https?:\/\//.test(href)

export function Footer() {
  return (
    <footer className="footer pg-invert">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-brand-name">cascivo</span>
          <span className="footer-brand-facts">
            MIT · {__CASCIVO_COMPONENT_COUNT__} components · {__CASCIVO_THEME_COUNT__} themes
          </span>
        </div>
        <div className="footer-columns">
          {FOOTER_COLUMNS.map((col) => (
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
        <div className="footer-note">Built with cascivo — view source, it&apos;s all tokens.</div>
      </div>
    </footer>
  )
}
