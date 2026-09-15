/**
 * Live byte budget.
 *
 * Shows *encoded* bytes, not raw. Gmail measures the encoded message body, and a gauge
 * reading raw bytes would show green on a template that arrives clipped — the exact failure
 * `docs/specs/email-target.md` §6.3 warns about.
 */
import { analyze, CLIP_BUDGETS, type RenderStats } from '@cascivo/email'

const TIERS = [
  { key: 'strict', label: 'iOS Gmail', bytes: CLIP_BUDGETS.strict },
  { key: 'mobile', label: 'Mobile', bytes: CLIP_BUDGETS.mobile },
  { key: 'standard', label: 'Gmail desktop', bytes: CLIP_BUDGETS.standard },
] as const

function kb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`
}

export function SizeGauge({ stats, html }: { stats: RenderStats; html: string }) {
  const breakdown = analyze(html)
  const worst = CLIP_BUDGETS.standard
  const pct = Math.min(100, (stats.encodedBytes / worst) * 100)

  return (
    <section className="panel">
      <h2>Size</h2>
      <p className={`size ${stats.clipRisk}`}>
        {kb(stats.encodedBytes)} <span>encoded</span>
      </p>
      <div className="bar">
        <div className="fill" style={{ width: `${pct}%` }} />
        {TIERS.map((t) => (
          <span
            key={t.key}
            className="clip"
            style={{ left: `${Math.min(100, (t.bytes / worst) * 100)}%` }}
            title={`${t.label} clips at ${kb(t.bytes)}`}
          />
        ))}
      </div>
      <dl>
        <dt>Raw</dt>
        <dd>{kb(stats.bytes)}</dd>
        <dt>Encoded</dt>
        <dd>{kb(stats.encodedBytes)}</dd>
        <dt>Elements</dt>
        <dd>{stats.nodeCount}</dd>
        <dt>Table depth</dt>
        <dd>{stats.maxTableDepth}</dd>
      </dl>
      <p className="hint">
        Clip lines: {TIERS.map((t) => `${t.label} ${kb(t.bytes)}`).join(' · ')}
      </p>

      <h2>Where the bytes are</h2>
      <dl>
        <dt>Inline CSS</dt>
        <dd>{kb(breakdown.inlineStyles)}</dd>
        <dt>Markup</dt>
        <dd>{kb(breakdown.markup)}</dd>
        <dt>Text</dt>
        <dd>{kb(breakdown.text)}</dd>
      </dl>
      {breakdown.repeatedDeclarations.length > 0 ? (
        <>
          <p className="hint">Most repeated declarations — usually where a saving is.</p>
          <ul className="repeats">
            {breakdown.repeatedDeclarations.slice(0, 4).map((d) => (
              <li key={d.declaration}>
                <span className="count">×{d.count}</span>
                <span className="cost">{kb(d.bytes)}</span>
                <code>{d.declaration}</code>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  )
}
