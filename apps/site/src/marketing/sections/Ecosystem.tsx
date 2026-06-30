const GITHUB_BASE = 'https://github.com/cascivo/cascivo/tree/main/packages'

const PACKAGES = [
  {
    name: '@cascivo/charts',
    value:
      'Chart components built from scratch — scales, shapes, and signal-driven rendering, zero dependencies.',
    install: 'pnpm add @cascivo/charts',
    href: '/docs/charts',
    linkLabel: 'View charts docs',
  },
  {
    name: '@cascivo/flow',
    value:
      'Node/edge diagrams from plain data — pan, zoom, draggable nodes, animated edges. CSS-native, zero dependencies.',
    install: 'pnpm add @cascivo/flow',
    href: '/docs/flow',
    linkLabel: 'View flow docs',
  },
  {
    name: '@cascivo/editor',
    value:
      'A lightweight code editor — owned tokenizer, syntax highlighting, find/replace, slash commands, per-instance theming.',
    install: 'pnpm add @cascivo/editor',
    href: '/docs/editor',
    linkLabel: 'View editor docs',
  },
  {
    name: '@cascivo/layouts',
    value: 'AppShell, off-canvas nav, responsive grid — the shell that powers these very docs.',
    install: 'pnpm add @cascivo/layouts',
    href: '/docs/layouts',
    linkLabel: 'View layouts docs',
  },
  {
    name: '@cascivo/i18n',
    value:
      'Built-in string catalog in every component. Override per-instance via the `labels` prop. Zero hardcoded English.',
    install: 'pnpm add @cascivo/i18n',
    href: `${GITHUB_BASE}/i18n`,
    linkLabel: 'View on GitHub',
  },
  {
    name: '@cascivo/icons',
    value: 'Optional SVG icon components.',
    install: 'pnpm add @cascivo/icons',
    href: `${GITHUB_BASE}/icons`,
    linkLabel: 'View on GitHub',
  },
  {
    name: '@cascivo/storage',
    value:
      'Persisted signals over localStorage and IndexedDB — SSR-safe, no boilerplate. The backbone of cascivo example apps.',
    install: 'pnpm add @cascivo/storage',
    href: `${GITHUB_BASE}/storage`,
    linkLabel: 'View on GitHub',
  },
]

export function Ecosystem() {
  return (
    <section id="ecosystem" className="ecosystem section" data-reveal>
      <h2>Everything you need, nothing you don&rsquo;t</h2>
      <p className="ecosystem-sub section-sub">
        cascivo ships more than components. Every package is optional, versioned, and built on the
        same token architecture.
      </p>
      <div className="ecosystem-grid">
        {PACKAGES.map((pkg) => (
          <div key={pkg.name} className="ecosystem-card">
            <p className="ecosystem-pkg">{pkg.name}</p>
            <p className="ecosystem-value">{pkg.value}</p>
            <pre className="ecosystem-install">
              <code>{pkg.install}</code>
            </pre>
            <a className="ecosystem-link" href={pkg.href} rel="noopener noreferrer">
              {pkg.linkLabel} &rarr;
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}
