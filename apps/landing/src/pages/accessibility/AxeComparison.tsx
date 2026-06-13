'use client'
import { BarChart } from '@cascivo/charts'
import { AXE } from './data'

const LIBS = ['cascade', 'shadcn', 'carbon'] as const
const LIB_LABELS: Record<(typeof LIBS)[number], string> = {
  cascade: 'cascade',
  shadcn: 'shadcn/ui',
  carbon: 'Carbon',
}

export function AxeComparison() {
  const axe = AXE
  if (!axe) return null
  const data = LIBS.map((lib) => ({ x: LIB_LABELS[lib], y: axe[lib].violations }))
  return (
    <section className="section" id="axe" data-reveal="">
      <h2>Same app, same axe run, three libraries</h2>
      <p className="section-sub">
        The bench suite builds one identical app three times — with cascade, shadcn/ui, and Carbon —
        and runs @axe-core/playwright with WCAG 2.1 AA tags over four app states: empty table,
        populated table, form, and open dialog. Violations are summed across states.
      </p>
      <BarChart
        series={[{ id: 'violations', label: 'axe violations', data }]}
        x={(d) => d.x}
        y={(d) => d.y}
        orientation="horizontal"
        height={200}
        title="Axe violations — WCAG 2.1 AA, four app states"
        description="Total axe violations per library across the bench suite's four-state matrix. Zero is the gate."
      />
      <ul className="a11y-rule-list">
        {LIBS.map((lib) => (
          <li key={lib}>
            <strong>{LIB_LABELS[lib]}</strong> —{' '}
            {axe[lib].rules.length > 0 ? axe[lib].rules.join(', ') : 'no failing rules'}
          </li>
        ))}
      </ul>
      <p className="a11y-disclosure">
        Automated checkers detect roughly 57% of WCAG issues at best (WebAIM research) — these
        counts are a floor, not a ranking. Carbon is IBM&apos;s accessibility flagship; this is a
        parity gate, not a contest. All dependency versions are pinned per bench app — full
        conditions in the methodology linked below.
      </p>
      <div className="a11y-ceiling">
        <p>
          <strong>Automated coverage ceiling:</strong> axe-core detects approximately 30–40% of WCAG
          issues by design — the tool&apos;s own documentation notes this. A{' '}
          <code>0 violations</code> result is necessary but not sufficient. Cascade complements
          automated testing with:
        </p>
        <ul>
          <li>APG pattern conformance checks (keyboard + role enforcement, runs in CI)</li>
          <li>
            A <code>prefers-reduced-motion</code> / <code>forced-colors</code> /{' '}
            <code>prefers-contrast</code> media-feature audit (runs in CI)
          </li>
          <li>
            An AT support matrix covering representative components (manual, see{' '}
            <code>docs/specs/at-matrix.md</code>)
          </li>
        </ul>
      </div>
    </section>
  )
}
