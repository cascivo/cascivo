import { CopyCommand } from '../../sections/CopyCommand'
import { bench, fmtKb, LIB_LABELS } from '../perf-data'
import { AXE } from '../accessibility/data'
import { MIGRATION } from './data'

export function MigrationGuide() {
  // Live bench values — read at render time, never hardcoded. Both selectors
  // return undefined when their bench slice is absent, so each delta degrades
  // to a qualitative line that links to the full receipt.
  const apps = bench.bundle?.apps
  const bundle =
    apps?.cascade && apps.shadcn
      ? { cascade: apps.cascade.totalGzKb, shadcn: apps.shadcn.totalGzKb }
      : null

  return (
    <section id="migrate" className="guides-section">
      <h2>Coming from shadcn/ui?</h2>
      <p className="guides-section-sub">{MIGRATION.intro}</p>

      <div className="migrate-model">
        <div className="migrate-col">
          <h3 className="migrate-col-title">Transfers for free</h3>
          <ul className="migrate-transfers">
            {MIGRATION.transfers.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div className="migrate-col">
          <h3 className="migrate-col-title">What changes</h3>
          <ul className="migrate-changes">
            {MIGRATION.changes.map((c) => (
              <li key={c.from} className="migrate-change">
                <span className="migrate-from">{c.from}</span>
                <span className="migrate-arrow" aria-hidden="true">
                  →
                </span>
                <span className="migrate-to">{c.to}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ol className="migrate-steps">
        {MIGRATION.steps.map((step) => (
          <li key={step.n} className="migrate-step">
            <span className="migrate-step-num" aria-hidden="true">
              {step.n}
            </span>
            <div className="migrate-step-body">
              <h3 className="migrate-step-title">{step.title}</h3>
              <p className="migrate-step-detail">{step.detail}</p>
              {step.code && <CopyCommand command={step.code} />}
            </div>
          </li>
        ))}
      </ol>

      <div className="migrate-verdict">
        <h3 className="migrate-col-title">Is it worth it?</h3>
        <p>{MIGRATION.verdict}</p>
        <div className="migrate-deltas">
          {bundle ? (
            <p className="migrate-delta">
              <strong>Bundle:</strong> the same component set ships at {fmtKb(bundle.cascade)}{' '}
              gzipped in {LIB_LABELS.cascade} vs {fmtKb(bundle.shadcn)} in {LIB_LABELS.shadcn}.{' '}
              <a href="/performance">See the full performance breakdown →</a>
            </p>
          ) : (
            <p className="migrate-delta">
              <strong>Bundle:</strong> measured across the same component set.{' '}
              <a href="/performance">See the full performance breakdown →</a>
            </p>
          )}
          {AXE ? (
            <p className="migrate-delta">
              <strong>Accessibility:</strong> {AXE.cascade.violations} axe violations in{' '}
              {LIB_LABELS.cascade} vs {AXE.shadcn.violations} in {LIB_LABELS.shadcn} on the same
              run. <a href="/accessibility">See the axe comparison →</a>
            </p>
          ) : (
            <p className="migrate-delta">
              <strong>Accessibility:</strong> every component is verified at WCAG 2.2 AA and CI
              fails on a single axe violation. <a href="/accessibility">See the axe comparison →</a>
            </p>
          )}
        </div>
      </div>

      <div className="migrate-cta">
        <CopyCommand command="npx @cascivo/cli init" />
        <a href="/docs" className="migrate-cta-link">
          Full quickstart →
        </a>
      </div>
    </section>
  )
}
