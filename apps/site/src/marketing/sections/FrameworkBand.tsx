// A slim "works with your stack" band. Every entry links to real, in-repo proof
// (a runnable example app or an adopter guide) — no aspirational logos.
const REPO = 'https://github.com/cascivo/cascivo/tree/main/apps/examples'
const DOCS_REPO = 'https://github.com/cascivo/cascivo/blob/main/docs'

interface Framework {
  name: string
  note: string
  href: string
}

const FRAMEWORKS: Framework[] = [
  {
    name: 'Next.js',
    note: 'App Router / RSC — components keep their "use client" boundary',
    href: `${REPO}/react-next`,
  },
  {
    name: 'Vite + React',
    note: 'The reference setup — themes import once, component CSS rides along',
    href: `${REPO}/react-vite`,
  },
  {
    name: 'Preact',
    note: 'Signals are natively reactive — no adapter, via preact/compat',
    href: `${DOCS_REPO}/USING-WITH-PREACT.md`,
  },
]

export function FrameworkBand() {
  return (
    <section
      className="section framework-band"
      id="frameworks"
      aria-label="Framework compatibility"
      data-reveal=""
    >
      <div className="flow-header">
        <p className="flow-eyebrow">Works with your stack</p>
        <h2 className="flow-title">Drops into Next.js, Vite, and Preact</h2>
      </div>
      <p className="section-sub">
        Plain React components with <code>"use client"</code> preserved — RSC-compatible, no
        framework adapter. Each link opens a runnable example or guide in the repo.
      </p>

      <ul className="framework-grid">
        {FRAMEWORKS.map((fw) => (
          <li key={fw.name} className="framework-card">
            <a className="framework-link" href={fw.href} target="_blank" rel="noopener noreferrer">
              <span className="framework-name">{fw.name}</span>
              <span className="framework-note">{fw.note}</span>
              <span className="framework-cta" aria-hidden="true">
                See the example ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
