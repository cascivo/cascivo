import { A11Y_ROWS } from './data'

const WCAG22_COUNT = A11Y_ROWS.filter((r) => r.wcag === '2.2-AA').length
const APG_COUNT = A11Y_ROWS.filter((r) => r.apgPattern !== null).length
const TOTAL = A11Y_ROWS.length

const LEGAL_ROWS: { responsibility: string; cascade: boolean; integrator: boolean }[] = [
  { responsibility: 'Component-level WCAG conformance', cascade: true, integrator: false },
  { responsibility: 'APG pattern keyboard interactions', cascade: true, integrator: false },
  {
    responsibility: 'Media features (reduced-motion, forced-colors)',
    cascade: true,
    integrator: false,
  },
  { responsibility: 'Representative AT testing', cascade: true, integrator: false },
  {
    responsibility: 'Accessible content (alt text, labels, headings)',
    cascade: false,
    integrator: true,
  },
  { responsibility: 'End-to-end product conformance', cascade: false, integrator: true },
  { responsibility: 'VPAT / GPAT for the final product', cascade: false, integrator: true },
  { responsibility: 'Third-party component conformance', cascade: false, integrator: true },
]

export function AccessibilityStatement() {
  return (
    <section className="section" id="statement" data-reveal="">
      <h2>Conformance statement</h2>
      <p className="section-sub">
        WCAG 2.2 AA · APG-conformant · AT-tested · EAA / EN 301 549 / Section 508 mapped
      </p>

      <div className="a11y-stmt-grid">
        {/* WCAG 2.2 AA */}
        <article className="a11y-stmt-card">
          <h3>WCAG 2.2 AA target</h3>
          <p className="a11y-stmt-stat">
            {WCAG22_COUNT} of {TOTAL}
          </p>
          <p className="a11y-stmt-desc">
            registry entries verified at WCAG 2.2 AA — the most current W3C recommendation,
            targeting perceivability, operability, understandability, and robustness.
          </p>
        </article>

        {/* APG conformance */}
        <article className="a11y-stmt-card">
          <h3>APG pattern conformance</h3>
          <p className="a11y-stmt-stat">{APG_COUNT}</p>
          <p className="a11y-stmt-desc">
            components verified against{' '}
            <a
              href="https://www.w3.org/WAI/ARIA/apg/patterns/"
              target="_blank"
              rel="noopener noreferrer"
            >
              ARIA APG patterns
            </a>{' '}
            (keyboard + role enforcement, runs in CI).
          </p>
        </article>

        {/* AT matrix */}
        <article className="a11y-stmt-card">
          <h3>AT support matrix</h3>
          <p className="a11y-stmt-stat">12 × 4</p>
          <p className="a11y-stmt-desc">
            Representative manual AT testing across 12 components and 4 stacks (NVDA/Chrome,
            JAWS/Chrome, VoiceOver/Safari, TalkBack/Chrome). Results in{' '}
            <code>docs/specs/at-matrix.md</code>.
          </p>
        </article>

        {/* Axe */}
        <article className="a11y-stmt-card">
          <h3>Automated axe-core testing</h3>
          <p className="a11y-stmt-stat">0 violations</p>
          <p className="a11y-stmt-desc">
            Zero axe violations across all components in CI — four app states, WCAG 2.1 AA tags.
            This is a floor, not a ceiling: axe detects roughly 30–40% of WCAG issues by design. See
            the <a href="#axe">axe comparison</a> section above for methodology.
          </p>
        </article>
      </div>

      {/* Legal mapping */}
      <h3 className="a11y-stmt-sub-heading">Legal framework mapping</h3>
      <p className="a11y-disclosure">
        Cascade targets WCAG 2.2 AA at the component level. All three major frameworks reference
        WCAG as their technical standard — EAA (effective 28 June 2025) via EN 301 549 Clause 9
        (WCAG 2.1 AA minimum); US Section 508 via WCAG 2.0 AA. Cascade at 2.2 AA exceeds all three
        normative thresholds. Full mapping in <code>docs/specs/legal-mapping.md</code>.
      </p>
      <table className="a11y-stmt-table">
        <caption>Responsibility split — cascade vs. integrator</caption>
        <thead>
          <tr>
            <th scope="col">Responsibility</th>
            <th scope="col">Cascade</th>
            <th scope="col">Integrator</th>
          </tr>
        </thead>
        <tbody>
          {LEGAL_ROWS.map((row) => (
            <tr key={row.responsibility}>
              <td>{row.responsibility}</td>
              <td>{row.cascade ? '✓' : ''}</td>
              <td>{row.integrator ? '✓' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Scope + Limitations */}
      <h3 className="a11y-stmt-sub-heading">Scope and limitations</h3>
      <ul className="a11y-stmt-limits">
        <li>Conformance is at the component level, not the application level.</li>
        <li>AT testing is representative (12 components × 4 stacks), not exhaustive.</li>
        <li>No third-party VPAT has been issued for cascade.</li>
        <li>
          Legal accessibility compliance of the final product is the integrator&apos;s
          responsibility.
        </li>
      </ul>
    </section>
  )
}
