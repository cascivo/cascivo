import { useSignal, useSignals } from '@cascivo/core'
import {
  AreaChart,
  BarChart,
  Boxplot,
  BubbleChart,
  Bullet,
  ComboChart,
  Funnel,
  Heatmap,
  Histogram,
  Kpi,
  LineChart,
  Meter,
  PieChart,
  RadialBar,
  Radar,
  ScatterChart,
  Sparkline,
  Treemap,
} from '@cascivo/charts'
import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'

// ── Deterministic demo data (no Math.random) ─────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

const revenueSeries = [
  {
    id: 'mrr',
    label: 'MRR ($k)',
    data: [42, 44, 49, 53, 58, 61, 67, 72, 78, 85, 92, 101].map((y, i) => ({ x: i, y })),
  },
  {
    id: 'target',
    label: 'Forecast',
    data: [40, 45, 50, 55, 60, 66, 72, 78, 84, 90, 96, 104].map((y, i) => ({ x: i, y })),
  },
]

const trafficArea = [
  {
    id: 'organic',
    label: 'Organic',
    data: MONTHS.map((_, i) => ({ x: i, y: 5200 + i * 420 + (i % 3) * 280 })),
  },
  {
    id: 'paid',
    label: 'Paid',
    data: MONTHS.map((_, i) => ({ x: i, y: 1800 + i * 120 + (i % 4) * 160 })),
  },
]

const statusMix = [
  { id: 'done', label: 'Done', data: QUARTERS.map((x, i) => ({ x, y: [62, 71, 68, 80][i]! })) },
  {
    id: 'wip',
    label: 'In progress',
    data: QUARTERS.map((x, i) => ({ x, y: [22, 18, 24, 14][i]! })),
  },
  { id: 'blocked', label: 'Blocked', data: QUARTERS.map((x, i) => ({ x, y: [9, 6, 11, 4][i]! })) },
]

const pieData = [
  { id: 'direct', label: 'Direct', value: 38 },
  { id: 'organic', label: 'Organic', value: 27 },
  { id: 'referral', label: 'Referral', value: 21 },
  { id: 'social', label: 'Social', value: 14 },
]

const gauges = [
  { id: 'uptime', label: 'Uptime', value: 99.95, color: 'var(--cascivo-color-success)' },
  { id: 'csat', label: 'CSAT', value: 92 },
  { id: 'cov', label: 'Coverage', value: 81 },
]

const funnelStages = [
  { id: 'visit', label: 'Visited', value: 18200 },
  { id: 'signup', label: 'Signed up', value: 6400 },
  { id: 'active', label: 'Activated', value: 2950 },
  { id: 'paid', label: 'Paid', value: 1120 },
]

const heatDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const heatHours = ['00', '04', '08', '12', '16', '20']
const heatData = heatDays.flatMap((x, i) =>
  heatHours.map((y, j) => ({ x, y, value: ((i * 5 + j * 7) % 13) + (j === 3 ? 6 : 1) })),
)

const treemapData = [
  { id: 'eng', label: 'Engineering', value: 44 },
  { id: 'sales', label: 'Sales', value: 26 },
  { id: 'mkt', label: 'Marketing', value: 17 },
  { id: 'ops', label: 'Operations', value: 9 },
  { id: 'ppl', label: 'People', value: 6 },
]

const radarAxes = ['Speed', 'DX', 'A11y', 'Bundle', 'Theming', 'AI']
const radarSeries = [
  { id: 'cascivo', label: 'cascivo', values: [92, 88, 95, 90, 86, 94] },
  { id: 'legacy', label: 'Legacy kit', values: [60, 55, 48, 52, 70, 30] },
]

const histogramData = Array.from({ length: 160 }, (_, i) => 120 + ((i * 11) % 90) - ((i * 5) % 45))

const boxplotSeries = [
  { id: 'a', label: 'API', values: [42, 51, 47, 39, 58, 63, 49, 44, 67, 41, 55, 48] },
  { id: 'b', label: 'Web', values: [88, 95, 102, 91, 79, 110, 97, 84, 120, 93, 101, 87] },
  { id: 'c', label: 'Worker', values: [21, 25, 19, 28, 17, 24, 31, 15, 22, 26, 20, 18] },
]

const bubbleSeries = [
  {
    id: 'plans',
    label: 'Plans',
    data: [
      { x: 12, y: 38, size: 18 },
      { x: 28, y: 64, size: 42 },
      { x: 45, y: 52, size: 30 },
      { x: 63, y: 81, size: 56 },
      { x: 78, y: 47, size: 24 },
    ],
  },
]

const comboBars = QUARTERS.map((label, i) => ({ label, value: [320, 410, 380, 470][i]! }))
const comboLine = QUARTERS.map((_, i) => ({ x: i, y: [42, 51, 47, 63][i]! }))

const sparkUsers = [120, 132, 128, 145, 139, 158, 162, 171, 169, 184, 196, 212]
const sparkErrors = [9, 7, 8, 5, 6, 4, 5, 3, 4, 2, 3, 2]

const drillSeries = [
  {
    id: 'rev',
    label: 'Revenue',
    data: QUARTERS.map((x, i) => ({ x, y: [318, 402, 377, 468][i]! })),
  },
]

// ── KPI sparkline-backed tiles ───────────────────────────────────────────────
function Kpis() {
  return (
    <div className="cx-kpis">
      <Kpi label="MRR" value="$101k" delta={9.4} deltaLabel="vs last mo" sparkline={sparkUsers} />
      <Kpi label="Active users" value="21,480" delta={4.1} sparkline={sparkUsers} />
      <Kpi
        label="Error rate"
        value="0.21%"
        delta={-38}
        deltaLabel="vs last mo"
        sparkline={sparkErrors}
      />
      <Kpi label="NRR" value="118%" delta={2.6} />
    </div>
  )
}

export function ChartsPage() {
  useSignals()
  // onSelect drill-down — clicking a bar updates this readout (signal-driven, zero re-renders elsewhere).
  const selected = useSignal<{ label: string; value: number | string } | null>(null)

  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main className="charts-page">
          {/* ── Hero ─────────────────────────────────────────── */}
          <section className="cx-hero section" aria-labelledby="charts-hero-title">
            <p className="cx-eyebrow">@cascivo/charts</p>
            <h1 id="charts-hero-title">
              A charting library that ships <em>with</em> the design system.
            </h1>
            <p className="section-sub">
              18 chart types built from scratch — own scales, shapes, and signal-driven rendering,
              zero runtime dependencies. Every chart is keyboard-navigable, theme-aware, and
              CVD-safe across all 14 palettes. Hover, focus with <kbd>Tab</kbd>, and arrow between
              points. Switch the theme — the charts follow.
            </p>
            <div className="cx-hero-stats">
              <div className="cx-stat">
                <strong>18</strong>
                <span>chart types</span>
              </div>
              <div className="cx-stat">
                <strong>14</strong>
                <span>CVD-safe themes</span>
              </div>
              <div className="cx-stat">
                <strong>0</strong>
                <span>runtime deps</span>
              </div>
              <div className="cx-stat">
                <strong>100%</strong>
                <span>keyboard-first</span>
              </div>
            </div>
          </section>

          {/* ── Live analytics dashboard ─────────────────────── */}
          <section className="section" aria-labelledby="cx-dash-title" data-reveal="">
            <h2 id="cx-dash-title">Composed like a real product dashboard</h2>
            <p className="section-sub">
              KPIs, a forecast line with a target band, 100%-stacked status, a donut, gauges, a
              funnel, and an activity heatmap — every tile is a cascivo chart reading the same theme
              tokens.
            </p>
            <Kpis />
            <div className="cx-dashboard">
              <div className="cx-panel cx-panel--wide">
                <h3>Revenue vs forecast</h3>
                <LineChart
                  series={revenueSeries}
                  x={(d) => d.x}
                  y={(d) => d.y}
                  title="MRR vs forecast with target band"
                  height={260}
                  legend
                  tooltip
                  annotations={[
                    { kind: 'area', axis: 'y', from: 90, to: 110, label: 'Goal band' },
                    {
                      kind: 'line',
                      axis: 'y',
                      value: 100,
                      label: 'Target',
                      color: 'var(--cascivo-color-accent)',
                    },
                  ]}
                />
              </div>
              <div className="cx-panel">
                <h3>Status mix (100%)</h3>
                <BarChart
                  series={statusMix}
                  x={(d) => d.x}
                  y={(d) => d.y}
                  title="Work status by quarter, normalized to 100%"
                  mode="percent"
                  height={260}
                  legend
                  tooltip
                />
              </div>
              <div className="cx-panel">
                <h3>Traffic sources</h3>
                <PieChart
                  data={pieData}
                  title="Traffic sources"
                  donut
                  height={240}
                  thickness={26}
                  centerValue="100%"
                  centerLabel="sessions"
                  labels
                  legend
                />
              </div>
              <div className="cx-panel">
                <h3>SLO gauges</h3>
                <RadialBar
                  data={gauges}
                  title="Service levels"
                  max={100}
                  height={240}
                  tooltip
                  legend
                />
              </div>
              <div className="cx-panel">
                <h3>Signup funnel</h3>
                <Funnel
                  data={funnelStages}
                  title="Signup funnel"
                  showConversion
                  height={240}
                  tooltip
                />
              </div>
              <div className="cx-panel cx-panel--wide">
                <h3>Activity heatmap</h3>
                <Heatmap data={heatData} title="Activity by day and hour" height={220} />
              </div>
            </div>
          </section>

          {/* ── Interactive drill-down ───────────────────────── */}
          <section
            className="section cx-drill-section"
            aria-labelledby="cx-drill-title"
            data-reveal=""
          >
            <h2 id="cx-drill-title">Charts you can click</h2>
            <p className="section-sub">
              Every data-bearing chart fires <code>onSelect</code> on click or <kbd>Enter</kbd> —
              keyboard-reachable drill-down with no wrapper. Pick a quarter:
            </p>
            <div className="cx-drill">
              <div className="cx-panel">
                <BarChart
                  series={drillSeries}
                  x={(d) => d.x}
                  y={(d) => d.y}
                  title="Quarterly revenue — click a bar"
                  labels
                  tooltip
                  height={260}
                  onSelect={(p: { label: string; value: number | string }) => {
                    selected.value = { label: p.label, value: p.value }
                  }}
                />
              </div>
              <aside className="cx-drill-readout" aria-live="polite">
                {selected.value ? (
                  <>
                    <p className="cx-readout-eyebrow">Selected</p>
                    <p className="cx-readout-value">{selected.value.value}</p>
                    <p className="cx-readout-label">{selected.value.label} revenue ($k)</p>
                  </>
                ) : (
                  <p className="cx-readout-hint">Click or focus + Enter a bar to drill in.</p>
                )}
              </aside>
            </div>
          </section>

          {/* ── The full gallery ─────────────────────────────── */}
          <section className="section" aria-labelledby="cx-gallery-title" data-reveal="">
            <h2 id="cx-gallery-title">Every chart type</h2>
            <p className="section-sub">
              From trend lines to treemaps, sparklines to funnels — the full catalog, each one a
              copy-paste-free import.
            </p>
            <div className="cx-gallery">
              <article className="cx-card">
                <h3>LineChart</h3>
                <LineChart
                  series={revenueSeries}
                  x={(d) => d.x}
                  y={(d) => d.y}
                  title="Trend over time"
                  height={180}
                  tooltip
                />
              </article>
              <article className="cx-card">
                <h3>AreaChart (stacked)</h3>
                <AreaChart
                  series={trafficArea}
                  x={(d) => d.x}
                  y={(d) => d.y}
                  title="Cumulative traffic"
                  height={180}
                  stacked
                />
              </article>
              <article className="cx-card">
                <h3>BarChart (grouped)</h3>
                <BarChart
                  series={statusMix}
                  x={(d) => d.x}
                  y={(d) => d.y}
                  title="Grouped categories"
                  height={180}
                />
              </article>
              <article className="cx-card">
                <h3>PieChart</h3>
                <PieChart data={pieData} title="Proportions" height={180} labels />
              </article>
              <article className="cx-card">
                <h3>ComboChart</h3>
                <ComboChart
                  bars={comboBars}
                  line={comboLine}
                  title="Bars + line, dual axis"
                  secondAxis
                  height={180}
                />
              </article>
              <article className="cx-card">
                <h3>ScatterChart</h3>
                <ScatterChart series={bubbleSeries} title="Observations" height={180} tooltip />
              </article>
              <article className="cx-card">
                <h3>BubbleChart</h3>
                <BubbleChart series={bubbleSeries} title="Three-dimensional" height={180} tooltip />
              </article>
              <article className="cx-card">
                <h3>Radar</h3>
                <Radar
                  axes={radarAxes}
                  series={radarSeries}
                  max={100}
                  title="Capability profile"
                  height={200}
                />
              </article>
              <article className="cx-card">
                <h3>Heatmap</h3>
                <Heatmap data={heatData} title="Density grid" height={180} />
              </article>
              <article className="cx-card">
                <h3>Treemap</h3>
                <Treemap data={treemapData} title="Hierarchy" height={180} />
              </article>
              <article className="cx-card">
                <h3>Histogram</h3>
                <Histogram data={histogramData} title="Distribution" label="ms" height={180} />
              </article>
              <article className="cx-card">
                <h3>Boxplot</h3>
                <Boxplot series={boxplotSeries} title="Spread by service" height={180} />
              </article>
              <article className="cx-card">
                <h3>RadialBar</h3>
                <RadialBar data={gauges} title="Radial gauges" max={100} height={180} />
              </article>
              <article className="cx-card">
                <h3>Funnel</h3>
                <Funnel data={funnelStages} title="Conversion" height={180} />
              </article>
              <article className="cx-card cx-card--mini">
                <h3>KPI</h3>
                <Kpi label="MRR" value="$101k" delta={9.4} sparkline={sparkUsers} />
              </article>
              <article className="cx-card cx-card--mini">
                <h3>Meter</h3>
                <Meter label="Disk" value={68} variant="bar" />
                <Meter label="CPU" value={82} variant="gauge" />
              </article>
              <article className="cx-card cx-card--mini">
                <h3>Bullet</h3>
                <Bullet label="Revenue %" value={72} target={80} ranges={[40, 70, 100]} max={100} />
                <Bullet label="CSAT" value={91} target={85} ranges={[50, 75, 100]} max={100} />
              </article>
              <article className="cx-card cx-card--mini">
                <h3>Sparkline</h3>
                <Sparkline data={sparkUsers} label="Users, 12 weeks" endDot />
                <Sparkline data={sparkErrors} label="Errors, 12 weeks" />
              </article>
            </div>
          </section>

          {/* ── Feature spotlights ───────────────────────────── */}
          <section className="section" aria-labelledby="cx-feat-title" data-reveal="">
            <h2 id="cx-feat-title">Composable enrichment, one prop away</h2>
            <p className="section-sub">
              Annotations, value labels, percent stacking, and honest gap handling — the primitives
              that make a chart dashboard-ready.
            </p>
            <div className="cx-spotlights">
              <article className="cx-spot">
                <div className="cx-spot-head">
                  <h3>Reference lines &amp; bands</h3>
                  <p>Target lines, thresholds, shaded ranges — announced to screen readers.</p>
                </div>
                <LineChart
                  series={[revenueSeries[0]!]}
                  x={(d) => d.x}
                  y={(d) => d.y}
                  title="MRR with a target line"
                  height={200}
                  annotations={[
                    {
                      kind: 'line',
                      axis: 'y',
                      value: 80,
                      label: 'Plan',
                      color: 'var(--cascivo-color-destructive)',
                    },
                  ]}
                />
              </article>
              <article className="cx-spot">
                <div className="cx-spot-head">
                  <h3>Value labels</h3>
                  <p>
                    Opt-in, collision-aware, and kept out of the a11y tree (the table has them).
                  </p>
                </div>
                <BarChart
                  series={[statusMix[0]!]}
                  x={(d) => d.x}
                  y={(d) => d.y}
                  title="Done per quarter, labelled"
                  labels
                  height={200}
                />
              </article>
              <article className="cx-spot">
                <div className="cx-spot-head">
                  <h3>100% stacking</h3>
                  <p>
                    Normalize each category to its share with a single <code>mode</code>.
                  </p>
                </div>
                <BarChart
                  series={statusMix}
                  x={(d) => d.x}
                  y={(d) => d.y}
                  title="Status share by quarter"
                  mode="percent"
                  height={200}
                  legend
                />
              </article>
              <article className="cx-spot">
                <div className="cx-spot-head">
                  <h3>Honest gaps</h3>
                  <p>Missing data breaks the line by default — no invented straight segment.</p>
                </div>
                <LineChart
                  series={[
                    {
                      id: 'uptime',
                      label: 'Uptime',
                      data: [99, 98, Number.NaN, 97, 99, 100, Number.NaN, 98, 99].map((y, i) => ({
                        x: i,
                        y,
                      })),
                    },
                  ]}
                  x={(d) => d.x}
                  y={(d) => d.y}
                  title="Uptime with real gaps"
                  height={200}
                  tooltip
                />
              </article>
            </div>
          </section>

          {/* ── CVD / keyboard callout + CTA ─────────────────── */}
          <section className="section cx-closing" aria-labelledby="cx-close-title" data-reveal="">
            <h2 id="cx-close-title">Accessible and theme-true by default</h2>
            <p className="section-sub">
              Palettes are Okabe-Ito-grounded and verified under protanopia, deuteranopia, and
              tritanopia in CI. Every chart renders a visually-hidden data table and an
              <code> aria-live</code> readout for assistive tech.
            </p>
            <p className="cx-keys">
              <kbd>Tab</kbd> focus · <kbd>←</kbd> <kbd>→</kbd> navigate · <kbd>Enter</kbd> select ·
              <kbd>Esc</kbd> clear
            </p>
            <div className="cx-cta">
              <a className="btn btn-primary" href="/docs/charts">
                Read the charts docs
              </a>
              <a className="btn btn-ghost" href="/accessibility">
                See the CVD evidence
              </a>
            </div>
          </section>
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
