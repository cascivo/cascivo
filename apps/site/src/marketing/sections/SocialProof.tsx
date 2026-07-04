const GITHUB_HREF = 'https://github.com/cascivo/cascivo'

// Honest, verifiable credibility signals only — no fabricated logos or
// testimonials. Each links to the evidence: the repo (open source), the
// showcase (this site dogfoods the library), and the accessibility page
// (WCAG conformance proven in CI). The lead line frames the competitive
// choice the visitor is actually making and points at /docs/why.
interface Signal {
  label: string
  detail: string
  href: string
  external?: true
}

const SIGNALS: Signal[] = [
  {
    label: 'Open source, MIT',
    detail: 'star it on GitHub',
    href: GITHUB_HREF,
    external: true,
  },
  {
    label: 'Built with cascivo',
    detail: 'this whole site dogfoods the library',
    href: '/showcase',
  },
  {
    label: 'WCAG 2.2 AA',
    detail: 'zero axe violations in the automated axe suite',
    href: '/accessibility',
  },
]

export function SocialProof() {
  return (
    <section className="social-proof" aria-label="Why teams choose cascivo">
      <p className="social-proof-lead">
        The shadcn copy-in model, without the Tailwind tax — <a href="/docs/why">the numbers</a>{' '}
        back it up.
      </p>
      <ul className="social-proof-list">
        {SIGNALS.map((s) => (
          <li key={s.label}>
            <a
              href={s.href}
              {...(s.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              <strong>{s.label}</strong>
              <span>{s.detail}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
