import { LineChart } from '@cascade-ui/charts'
import { AreaChart } from '@cascade-ui/charts'
import { BarChart } from '@cascade-ui/charts'
import { PieChart } from '@cascade-ui/charts'
import { ScatterChart } from '@cascade-ui/charts'
import { Sparkline } from '@cascade-ui/charts'
import { Meter } from '@cascade-ui/charts'
import { Kpi } from '@cascade-ui/charts'
import { Histogram } from '@cascade-ui/charts'
import { Boxplot } from '@cascade-ui/charts'
import { BubbleChart } from '@cascade-ui/charts'
import { ComboChart } from '@cascade-ui/charts'
import { Heatmap } from '@cascade-ui/charts'
import { Treemap } from '@cascade-ui/charts'
import { Radar } from '@cascade-ui/charts'
import { Bullet } from '@cascade-ui/charts'

// Palette gallery — all 10 themes, 8-series BarChart (one slot per Okabe-Ito color)
const PALETTE_THEMES = [
  'light',
  'dark',
  'warm',
  'flat',
  'minimal',
  'midnight',
  'pastel',
  'brutalist',
  'corporate',
  'terminal',
] as const

const PALETTE_DEMO_DATA = [
  { label: 'Q1', s1: 40, s2: 28, s3: 35, s4: 22, s5: 31, s6: 18, s7: 25, s8: 15 },
  { label: 'Q2', s1: 55, s2: 38, s3: 42, s4: 30, s5: 44, s6: 25, s7: 33, s8: 20 },
  { label: 'Q3', s1: 48, s2: 32, s3: 38, s4: 26, s5: 37, s6: 21, s7: 28, s8: 17 },
] as const

type PaletteRow = (typeof PALETTE_DEMO_DATA)[number]

const PALETTE_SERIES: Array<{ id: string; label: string; key: keyof Omit<PaletteRow, 'label'> }> = [
  { id: 'c1', label: 'Series 1', key: 's1' },
  { id: 'c2', label: 'Series 2', key: 's2' },
  { id: 'c3', label: 'Series 3', key: 's3' },
  { id: 'c4', label: 'Series 4', key: 's4' },
  { id: 'c5', label: 'Series 5', key: 's5' },
  { id: 'c6', label: 'Series 6', key: 's6' },
  { id: 'c7', label: 'Series 7', key: 's7' },
  { id: 'c8', label: 'Series 8', key: 's8' },
]

const paletteSeries = PALETTE_SERIES.map(({ id, label, key }) => ({
  id,
  label,
  data: PALETTE_DEMO_DATA.map((row) => ({ x: row.label, y: row[key] })),
}))

// Deterministic demo data — no Math.random, index-based
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const lineSeries = [
  {
    id: 'revenue',
    label: 'Revenue',
    data: months.map((_, i) => ({ x: i, y: 2000 + i * 300 + (i % 3) * 200 })),
  },
  {
    id: 'cost',
    label: 'Cost',
    data: months.map((_, i) => ({ x: i, y: 1200 + i * 120 + (i % 4) * 80 })),
  },
]

const areaSeries = [
  {
    id: 'visits',
    label: 'Page Visits',
    data: months.map((_, i) => ({ x: i, y: 5000 + i * 400 + (i % 3) * 300 })),
  },
  {
    id: 'signups',
    label: 'Sign-ups',
    data: months.map((_, i) => ({ x: i, y: 200 + i * 20 + (i % 5) * 30 })),
  },
]

const barSeries = [
  {
    id: 'q1',
    label: 'Q1',
    data: months.slice(0, 6).map((m, i) => ({ x: m, y: 1000 + i * 150 })),
  },
  {
    id: 'q2',
    label: 'Q2',
    data: months.slice(0, 6).map((m, i) => ({ x: m, y: 800 + i * 200 })),
  },
]

const pieData = [
  { id: 'direct', label: 'Direct', value: 35 },
  { id: 'organic', label: 'Organic', value: 28 },
  { id: 'referral', label: 'Referral', value: 22 },
  { id: 'social', label: 'Social', value: 15 },
]

const scatterSeries = [
  {
    id: 'group-a',
    label: 'Group A',
    data: Array.from({ length: 20 }, (_, i) => ({ x: i * 5, y: 10 + i * 4 + (i % 3) * 8 })),
  },
  {
    id: 'group-b',
    label: 'Group B',
    data: Array.from({ length: 15 }, (_, i) => ({ x: i * 7, y: 50 + i * 3 - (i % 4) * 5 })),
  },
]

const sparkData = [120, 132, 101, 134, 90, 230, 210, 182, 191, 234, 290, 330]

export function ChartsPage() {
  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">Data visualization</div>
        <h1>Charts</h1>
        <p class="doc-lede">
          Signal-driven, zero-dependency chart components. SVG rendering, accessible fallback
          tables, and crosshair hover with zero React re-renders.
        </p>
      </header>

      <section class="doc-section">
        <h2>LineChart</h2>
        <p>Multi-series line chart with monotone curve, crosshair, and interactive legend.</p>
        <LineChart
          series={lineSeries}
          x={(d) => d.x}
          y={(d) => d.y}
          title="Revenue vs Cost over time"
          description="Monthly revenue and cost comparison"
          height={280}
        />
      </section>

      <section class="doc-section">
        <h2>AreaChart</h2>
        <p>Area chart with optional stacking for cumulative totals.</p>
        <AreaChart
          series={areaSeries}
          x={(d) => d.x}
          y={(d) => d.y}
          title="Page visits and sign-ups"
          height={280}
        />
        <div style={{ marginTop: '1rem' }}>
          <strong>Stacked:</strong>
          <AreaChart
            series={areaSeries}
            x={(d) => d.x}
            y={(d) => d.y}
            title="Page visits and sign-ups (stacked)"
            height={280}
            stacked
          />
        </div>
      </section>

      <section class="doc-section">
        <h2>BarChart</h2>
        <p>Vertical grouped bars by default; supports horizontal and stacked variants.</p>
        <BarChart
          series={barSeries}
          x={(d) => d.x}
          y={(d) => d.y}
          title="Sales by month (grouped)"
          height={280}
        />
        <div style={{ marginTop: '1rem' }}>
          <strong>Stacked:</strong>
          <BarChart
            series={barSeries}
            x={(d) => d.x}
            y={(d) => d.y}
            title="Sales by month (stacked)"
            height={280}
            mode="stacked"
          />
        </div>
        <div style={{ marginTop: '1rem' }}>
          <strong>Horizontal:</strong>
          <BarChart
            series={barSeries}
            x={(d) => d.x}
            y={(d) => d.y}
            title="Sales by month (horizontal)"
            height={280}
            orientation="horizontal"
          />
        </div>
      </section>

      <section class="doc-section">
        <h2>PieChart</h2>
        <p>Pie and donut variants with interactive legend.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <PieChart data={pieData} title="Traffic sources (pie)" height={260} />
          <PieChart data={pieData} title="Traffic sources (donut)" height={260} donut />
        </div>
      </section>

      <section class="doc-section">
        <h2>ScatterChart</h2>
        <p>Two-axis scatter plot with multi-series support.</p>
        <ScatterChart series={scatterSeries} title="Scatter — Group A vs Group B" height={280} />
      </section>

      <section class="doc-section">
        <h2>Sparkline</h2>
        <p>Minimal inline trend lines — no axes, no legend, no tooltip.</p>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Monthly revenue</div>
            <Sparkline data={sparkData} label="Monthly revenue trend" width={160} height={40} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Active users</div>
            <Sparkline
              data={sparkData.map((v, i) => v * 0.6 + i * 10)}
              label="Active users trend"
              width={160}
              height={40}
              color="var(--cascade-chart-2)"
            />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Error rate</div>
            <Sparkline
              data={[5, 3, 8, 2, 6, 1, 4, 7, 3, 5, 2, 1]}
              label="Error rate trend"
              width={160}
              height={40}
              color="var(--cascade-chart-4)"
            />
          </div>
        </div>
      </section>

      <section class="doc-section">
        <h2>Meter</h2>
        <p>Bar and gauge variants with threshold-based color coding.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <strong>Bar</strong>
            <Meter value={45} label="CPU Usage" width={240} />
            <Meter
              value={72}
              label="Memory"
              width={240}
              thresholds={{ warning: 60, critical: 80 }}
            />
            <Meter value={88} label="Disk" width={240} thresholds={{ warning: 70, critical: 85 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <strong>Gauge</strong>
            <Meter value={65} label="Performance" variant="gauge" width={200} height={120} />
          </div>
        </div>
      </section>

      <section class="doc-section">
        <h2>KPI</h2>
        <p>Stat tiles with trend delta and optional embedded sparkline.</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          <Kpi
            value={12483}
            label="Total Users"
            delta={12.4}
            deltaLabel="this month"
            sparkline={sparkData}
          />
          <Kpi value="$48,290" label="Revenue" delta={8.4} />
          <Kpi value={1042} label="Active Sessions" delta={-3.2} />
          <Kpi value="99.98%" label="Uptime" />
        </div>
      </section>

      <section class="doc-section">
        <h2>Histogram</h2>
        <p>Frequency distribution using Freedman–Diaconis binning.</p>
        <Histogram
          data={months.map((_, i) => 20 + i * 4 + (i % 3) * 8)}
          title="Value distribution"
          label="Value"
        />
      </section>

      <section class="doc-section">
        <h2>Boxplot</h2>
        <p>Box-and-whisker with five-number summary per series.</p>
        <Boxplot
          series={[
            { id: 'a', label: 'Group A', values: months.map((_, i) => 10 + i * 5 + (i % 4) * 3) },
            { id: 'b', label: 'Group B', values: months.map((_, i) => 20 + i * 3 + (i % 3) * 7) },
          ]}
          title="Group comparison"
        />
      </section>

      <section class="doc-section">
        <h2>BubbleChart</h2>
        <p>Three-dimensional scatter with area-proportional bubble sizes.</p>
        <BubbleChart
          series={[
            {
              name: 'Products',
              data: months.slice(0, 6).map((_, i) => ({
                x: i * 10,
                y: 20 + i * 8,
                size: 10 + i * 5,
              })),
            },
          ]}
          title="Product metrics"
        />
      </section>

      <section class="doc-section">
        <h2>ComboChart</h2>
        <p>Bars + line on shared or dual y-axes.</p>
        <ComboChart
          bars={months.slice(0, 6).map((m, i) => ({ label: m, value: 80 + i * 15 }))}
          line={months.slice(0, 6).map((_, i) => ({ x: i, y: 40 + i * 10 }))}
          title="Sales vs Target"
        />
      </section>

      <section class="doc-section">
        <h2>Heatmap</h2>
        <p>Matrix heatmap with color-mix cell interpolation.</p>
        <Heatmap
          data={['Mon', 'Tue', 'Wed'].flatMap((x) =>
            ['AM', 'PM', 'Eve'].map((y, i) => ({ x, y, value: 10 + i * 5 + x.length * 3 })),
          )}
          title="Activity heatmap"
        />
      </section>

      <section class="doc-section">
        <h2>Treemap</h2>
        <p>Squarified treemap for part-to-whole visualization.</p>
        <Treemap
          data={[
            { id: 'a', label: 'Alpha', value: 40 },
            { id: 'b', label: 'Beta', value: 25 },
            { id: 'c', label: 'Gamma', value: 20 },
            { id: 'd', label: 'Delta', value: 15 },
          ]}
          title="Market segments"
        />
      </section>

      <section class="doc-section">
        <h2>Radar</h2>
        <p>Spider / radar chart for multi-dimensional comparison.</p>
        <Radar
          axes={['Speed', 'Power', 'Range', 'Efficiency', 'Cost']}
          series={[
            { id: 'a', label: 'Model A', values: [80, 70, 60, 90, 50] },
            { id: 'b', label: 'Model B', values: [60, 85, 75, 70, 80] },
          ]}
          title="Model comparison"
        />
      </section>

      <section class="doc-section">
        <h2>Bullet</h2>
        <p>Bullet chart for KPI progress against targets with qualitative ranges.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Bullet value={72} target={80} ranges={[40, 70, 100]} label="Revenue %" />
          <Bullet value={55} target={70} ranges={[30, 60, 100]} label="Satisfaction" />
        </div>
      </section>

      <section class="doc-section">
        <h2>Keyboard Tooltip Demo</h2>
        <p>
          Tab to focus the chart, use Arrow keys to traverse data points, Escape to clear.
          Announcement plays in the aria-live region (read by screen readers).
        </p>
        <p>Tab into the chart, then use ← → arrow keys to navigate. Press Escape to dismiss.</p>
        <BarChart
          series={[
            {
              id: 'alpha',
              label: 'Alpha',
              data: ['Jan', 'Feb', 'Mar', 'Apr', 'May'].map((m, i) => ({ x: m, y: 400 + i * 120 })),
            },
            {
              id: 'beta',
              label: 'Beta',
              data: ['Jan', 'Feb', 'Mar', 'Apr', 'May'].map((m, i) => ({ x: m, y: 300 + i * 80 })),
            },
            {
              id: 'gamma',
              label: 'Gamma',
              data: ['Jan', 'Feb', 'Mar', 'Apr', 'May'].map((m, i) => ({ x: m, y: 200 + i * 60 })),
            },
          ]}
          x={(d) => d.x}
          y={(d) => d.y}
          title="Keyboard tooltip demo — Alpha, Beta, Gamma series"
          description="Use Tab to focus, arrow keys to navigate data points, and Escape to dismiss the tooltip."
          height={280}
          tooltip
        />
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--cascade-text-secondary)',
            marginBlockStart: '0.5rem',
          }}
        >
          Screen readers will announce each data point as you navigate (e.g., "Jan · 400 — Alpha").
        </p>
      </section>

      <section class="doc-section">
        <h2>Micro charts</h2>
        <p>
          Every chrome-bearing chart accepts <code>plain</code> — no axes, no grid, no legend.
          Margins collapse to 2px; default height drops to 48px. Drop them anywhere: table cells,
          KPI cards, list rows.
        </p>

        <h3>Inline row of plain charts at 120×32</h3>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                marginBottom: '0.25rem',
                color: 'var(--cascade-text-secondary)',
              }}
            >
              Revenue
            </div>
            <LineChart
              series={[lineSeries[0]!]}
              x={(d) => d.x}
              y={(d) => d.y}
              title="Revenue micro"
              plain
              width={120}
              height={32}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                marginBottom: '0.25rem',
                color: 'var(--cascade-text-secondary)',
              }}
            >
              Visits
            </div>
            <AreaChart
              series={[areaSeries[0]!]}
              x={(d) => d.x}
              y={(d) => d.y}
              title="Visits micro"
              plain
              width={120}
              height={32}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                marginBottom: '0.25rem',
                color: 'var(--cascade-text-secondary)',
              }}
            >
              Sales Q1
            </div>
            <BarChart
              series={[barSeries[0]!]}
              x={(d) => d.x}
              y={(d) => d.y}
              title="Sales micro"
              plain
              width={120}
              height={32}
            />
          </div>
        </div>

        <h3 style={{ marginBlockStart: '1.5rem' }}>Plain chart in a table cell</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--cascade-text-secondary)' }}>
          A plain LineChart at 120×32 embedded directly in a data table cell.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: '0.875rem', width: '100%' }}>
            <thead>
              <tr>
                {['Metric', 'Value', 'Trend (12 mo)'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '0.5rem 1rem',
                      textAlign: 'start',
                      borderBlockEnd: '1px solid var(--cascade-color-border)',
                      fontWeight: 500,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Revenue', value: '$48.3k', series: lineSeries[0]! },
                { label: 'Cost', value: '$22.1k', series: lineSeries[1]! },
                { label: 'Visits', value: '9,720', series: areaSeries[0]! },
              ].map((row) => (
                <tr key={row.label}>
                  <td
                    style={{
                      padding: '0.5rem 1rem',
                      borderBlockEnd: '1px solid var(--cascade-color-border-subtle)',
                    }}
                  >
                    {row.label}
                  </td>
                  <td
                    style={{
                      padding: '0.5rem 1rem',
                      borderBlockEnd: '1px solid var(--cascade-color-border-subtle)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {row.value}
                  </td>
                  <td
                    style={{
                      padding: '0.5rem 1rem',
                      borderBlockEnd: '1px solid var(--cascade-color-border-subtle)',
                    }}
                  >
                    <LineChart
                      series={[row.series]}
                      x={(d) => d.x}
                      y={(d) => d.y}
                      title={`${row.label} trend`}
                      plain
                      width={120}
                      height={32}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 style={{ marginBlockStart: '1.5rem' }}>Multi-series plain area chart</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--cascade-text-secondary)' }}>
          In plain mode, series are distinguishable by color only — no legend. Suitable for
          glanceable comparisons, not analytical detail.
        </p>
        <AreaChart
          series={areaSeries}
          x={(d) => d.x}
          y={(d) => d.y}
          title="Visits vs Sign-ups (plain)"
          plain
          height={64}
        />
      </section>
    </article>
  )
}
