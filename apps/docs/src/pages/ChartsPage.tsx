import { LineChart } from '@cascade-ui/charts'
import { AreaChart } from '@cascade-ui/charts'
import { BarChart } from '@cascade-ui/charts'
import { PieChart } from '@cascade-ui/charts'
import { ScatterChart } from '@cascade-ui/charts'
import { Sparkline } from '@cascade-ui/charts'
import { Meter } from '@cascade-ui/charts'
import { Kpi } from '@cascade-ui/charts'

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
    </article>
  )
}
