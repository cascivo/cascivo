import { BarChart } from '@cascivo/charts'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@cascivo/components/card'
import bench from 'virtual:bench'

const axe = bench.a11y
const bundle = bench.bundle

const BUNDLE_SERIES = bundle
  ? [
      {
        id: 'gzip',
        label: 'Total gzip (KB)',
        data: [
          { x: 'cascivo', y: bundle.apps.cascade.totalGzKb },
          { x: 'shadcn', y: bundle.apps.shadcn.totalGzKb },
          { x: 'carbon', y: bundle.apps.carbon.totalGzKb },
        ],
      },
    ]
  : null

export function ProofTeasers({
  withLeadingDivider = false,
}: { withLeadingDivider?: boolean } = {}) {
  if (!axe && !BUNDLE_SERIES) return null
  return (
    <>
      {withLeadingDivider && <hr className="flow-divider" />}
      <section className="section" id="proof" aria-label="Proof pages" data-reveal="">
        <h2>Numbers, not adjectives.</h2>
        <p className="section-sub">
          Every figure below is generated at build time from the component registry and the
          cross-library benchmark suite — methodology included, raw data committed.
        </p>
        <div className="proof-teasers">
          {axe && (
            <Card variant="outlined">
              <CardHeader>
                <CardTitle>Accessibility</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="proof-number">{axe.cascade.violations}</p>
                <p className="proof-number-label">axe violations · WCAG 2.2 AA · four app states</p>
                <p className="proof-line">
                  Same scan, same rules: shadcn {axe.shadcn.violations} · Carbon{' '}
                  {axe.carbon.violations}. Plus a keyboard and ARIA matrix generated from every
                  manifest in the registry.
                </p>
              </CardContent>
              <CardFooter>
                <a className="proof-link" href="/accessibility">
                  See the accessibility evidence
                </a>
              </CardFooter>
            </Card>
          )}
          {BUNDLE_SERIES && bundle && (
            <Card variant="outlined">
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="proof-number">{bundle.apps.cascade.totalGzKb.toFixed(1)} KB</p>
                <p className="proof-number-label">total gzip · full benchmark app · JS + CSS</p>
                <div className="proof-chart-wrap">
                  <BarChart
                    orientation="horizontal"
                    title="Total gzip size: cascivo vs shadcn vs Carbon"
                    series={BUNDLE_SERIES}
                    x={(d) => d.x}
                    y={(d) => d.y}
                    height={72}
                  />
                </div>
                <p className="proof-line">
                  shadcn {bundle.apps.shadcn.totalGzKb.toFixed(1)} KB · Carbon{' '}
                  {bundle.apps.carbon.totalGzKb.toFixed(1)} KB — plus latency, re-render, and
                  Lighthouse comparisons under throttled CPU.
                </p>
              </CardContent>
              <CardFooter>
                <a className="proof-link" href="/performance">
                  See the performance numbers
                </a>
              </CardFooter>
            </Card>
          )}
        </div>
      </section>
    </>
  )
}
