// Results imported directly — stays in sync with the artifact automatically.
// If the relative import escapes the app root in your build, copy results.json
// into apps/docs/src/data/ via a predev/prebuild script instead.
import results from '../../../bench/results/results.json'

const LIBS = ['cascade', 'shadcn', 'carbon'] as const
type Lib = (typeof LIBS)[number]

function ms(v: number) {
  return `${v.toFixed(1)}ms`
}

export function Benchmarks() {
  const { meta, bundle, runtime, renders, lighthouse, a11y } = results as typeof results & {
    bundle?: Record<string, unknown>
    runtime?: Record<string, unknown>
    renders?: Record<string, unknown>
    lighthouse?: Record<string, unknown>
    a11y?: Record<string, unknown>
  }

  return (
    <article>
      <h1>Benchmarks</h1>
      <p>
        cascade vs shadcn/ui vs Carbon — identical apps, pinned versions, trace-based timing.
        Methodology and reproduction: <code>apps/bench/METHODOLOGY.md</code>. Run{' '}
        <code>pnpm bench</code> to reproduce.
      </p>
      <p>
        {meta.date} · {meta.cpu} · {meta.chrome} · {meta.cpuThrottle}× CPU throttle
      </p>

      {bundle && (
        <section>
          <h2>Bundle size (min+gzip, level 6)</h2>
          <table>
            <thead>
              <tr>
                <th>App</th>
                <th>JS</th>
                <th>CSS</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {LIBS.map((lib) => {
                const a = (
                  bundle.apps as Record<
                    Lib,
                    { jsGzKb: number; cssGzKb: number; totalGzKb: number } | undefined
                  >
                )[lib]
                if (!a) return null
                return (
                  <tr key={lib}>
                    <td>{lib}</td>
                    <td>{a.jsGzKb}KB</td>
                    <td>{a.cssGzKb}KB</td>
                    <td>
                      <strong>{a.totalGzKb}KB</strong>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}

      {runtime && (
        <section>
          <h2>Interaction latency (Chrome trace, click→paint)</h2>
          <p>
            Median of ≥12 samples at {meta.cpuThrottle}× CPU throttle; IQR in parentheses. Deltas
            with Mann-Whitney p ≥ 0.05 are reported as tie.
          </p>
          <table>
            <thead>
              <tr>
                <th>Scenario</th>
                {LIBS.map((l) => (
                  <th key={l}>{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(runtime).map(([id, row]) => (
                <tr key={id}>
                  <td>{id}</td>
                  {LIBS.map((lib) => {
                    const s = (
                      row as Record<Lib, { median: number; p25: number; p75: number } | undefined>
                    )[lib]
                    if (!s) return <td key={lib}>n/a</td>
                    const p =
                      lib !== 'cascade'
                        ? (row as Record<string, Record<Lib, number> | undefined>)['pVsCascade']?.[
                            lib
                          ]
                        : undefined
                    const tie = p !== undefined && p >= 0.05 ? ' (tie)' : ''
                    return (
                      <td key={lib}>
                        {ms(s.median)} ({ms(s.p25)}–{ms(s.p75)}){tie}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {renders && (
        <section>
          <h2>Re-render counts (React Profiler root commits)</h2>
          <p>Deterministic integers from dev builds. Timings above are NOT from these builds.</p>
          <table>
            <thead>
              <tr>
                <th>Scenario</th>
                {LIBS.map((l) => (
                  <th key={l}>{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(renders).map(([id, row]) => (
                <tr key={id}>
                  <td>{id}</td>
                  {LIBS.map((l) => (
                    <td key={l}>{(row as Record<Lib, number | undefined>)[l] ?? 'n/a'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {lighthouse && (
        <section>
          <h2>Lighthouse (median of 5 runs, desktop preset)</h2>
          <p>TBT is a lab proxy for INP — INP itself cannot be measured in a lab.</p>
          <table>
            <thead>
              <tr>
                <th>App</th>
                <th>FCP</th>
                <th>LCP</th>
                <th>TBT</th>
                <th>Transfer</th>
              </tr>
            </thead>
            <tbody>
              {LIBS.map((lib) => {
                const l = (
                  lighthouse as Record<
                    Lib,
                    { fcpMs: number; lcpMs: number; tbtMs: number; transferKb: number } | undefined
                  >
                )[lib]
                if (!l) return null
                return (
                  <tr key={lib}>
                    <td>{lib}</td>
                    <td>{l.fcpMs}ms</td>
                    <td>{l.lcpMs}ms</td>
                    <td>{l.tbtMs}ms</td>
                    <td>{l.transferKb}KB</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}

      {a11y && (
        <section>
          <h2>Accessibility (axe-core sweep — parity gate, not a score)</h2>
          <p>
            Automated tools detect roughly 57% of WCAG issues at best; these numbers are a floor,
            not a ranking. cascade CI fails on any violation. Competitor numbers are context only.
          </p>
          <table>
            <thead>
              <tr>
                <th>App</th>
                <th>Violations</th>
                <th>Rules</th>
              </tr>
            </thead>
            <tbody>
              {LIBS.map((lib) => {
                const entry = (
                  a11y as Record<Lib, { violations: number; rules: string[] } | undefined>
                )[lib]
                if (!entry) return null
                return (
                  <tr key={lib}>
                    <td>{lib}</td>
                    <td>{entry.violations}</td>
                    <td>{entry.rules.join(', ') || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}
    </article>
  )
}
