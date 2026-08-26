import { BarChart } from '@cascivo/charts'
import { Stat } from '@cascivo/components/stat'
import { axeViolations, gzip, kb } from './figures'

const BUNDLE_SERIES = gzip
  ? [
      {
        id: 'gzip',
        label: 'Total gzip (KB)',
        data: [
          { x: 'cascivo', y: gzip.cascivo },
          { x: 'shadcn/ui', y: gzip.shadcn },
          { x: 'Carbon', y: gzip.carbon },
        ],
      },
    ]
  : null

const A11Y_STATS: { value: string; label: string }[] = [
  ...(axeViolations !== undefined
    ? [{ value: String(axeViolations), label: 'axe violations' }]
    : []),
  { value: 'APG', label: 'keyboard matrix' },
  { value: 'CVD', label: 'safe chart palettes' },
  { value: '320px', label: 'zero overflow' },
]

/**
 * The proof band. The chart animates in once when it scrolls into view (the
 * shared `data-reveal` observer unobserves after the first hit, so it never
 * replays, and no-ops entirely under prefers-reduced-motion).
 */
export function PosterProof() {
  return (
    <section className="pg-section pg-cols" id="proof" aria-label="Proof">
      <div className="pg-pad">
        <p className="pg-eyebrow">04 / proof</p>
        <h2 className="pg-display pg-display--section pg-proof-head">
          Numbers,
          <br />
          not adjectives
        </h2>
        <p className="pg-body pg-proof-body">
          Every figure is generated at build time from the component registry and the cross-library
          benchmark suite — methodology included, raw data committed.
        </p>
        {BUNDLE_SERIES && gzip && (
          <>
            <div className="pg-bars" data-reveal="">
              <BarChart
                orientation="horizontal"
                title="Total gzip size: cascivo vs shadcn/ui vs Carbon"
                description={`cascivo ${kb(gzip.cascivo)}, shadcn/ui ${kb(gzip.shadcn)}, Carbon ${kb(gzip.carbon)}`}
                series={BUNDLE_SERIES}
                x={(d) => d.x}
                y={(d) => d.y}
                height={140}
              />
            </div>
            <p className="pg-note pg-mono pg-bars-caption">
              total gzip · full benchmark app · js + css
            </p>
          </>
        )}
        <a className="pg-link" href="/performance">
          See the performance numbers →
        </a>
      </div>

      <div className="pg-pad pg-surface">
        <p className="pg-eyebrow">accessibility</p>
        <h2 className="pg-display pg-display--section pg-proof-head">
          WCAG 2.2 AA,
          <br />
          gated in CI
        </h2>
        <p className="pg-body pg-proof-body">
          A published conformance statement, a keyboard and ARIA matrix generated from every
          manifest, and colour-blind-safe chart palettes. Table stakes too: {axeViolations ?? 0} axe
          violations across four app states — the same scan run against shadcn and Carbon.
        </p>
        <div className="pg-evidence">
          {A11Y_STATS.map((s) => (
            <div key={s.label} className="pg-evidence-cell">
              <Stat className="pg-stat pg-stat--sm" value={s.value} label={s.label} />
            </div>
          ))}
        </div>
        <a className="pg-link" href="/accessibility">
          See the accessibility evidence →
        </a>
      </div>
    </section>
  )
}
