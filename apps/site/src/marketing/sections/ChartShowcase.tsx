import { BarChart, LineChart, AreaChart } from '@cascivo/charts'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']

const BAR_SERIES = [
  {
    id: 'q1',
    label: 'Q1',
    data: months.map((m, i) => ({ x: m, y: 1000 + i * 150 })),
  },
  {
    id: 'q2',
    label: 'Q2',
    data: months.map((m, i) => ({ x: m, y: 800 + i * 200 })),
  },
]

const LINE_SERIES = [
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

const AREA_SERIES = [
  {
    id: 'visits',
    label: 'Visits',
    data: months.map((_, i) => ({ x: i, y: 5000 + i * 400 + (i % 3) * 300 })),
  },
  {
    id: 'signups',
    label: 'Sign-ups',
    data: months.map((_, i) => ({ x: i, y: 200 + i * 20 + (i % 5) * 30 })),
  },
]

export function ChartShowcase() {
  return (
    <section
      id="charts"
      className="chart-showcase section"
      aria-label="Charts showcase"
      data-reveal=""
    >
      <h2>17 chart types. CVD-safe. Keyboard-first.</h2>
      <p className="section-sub">
        Every chart adapts to the active theme — all 10 palettes are Okabe-Ito-grounded and verified
        under protanopia, deuteranopia, and tritanopia. Arrow keys navigate between data points.
      </p>

      <div className="chart-showcase-grid">
        <div className="chart-card">
          <h3>BarChart</h3>
          <BarChart
            series={BAR_SERIES}
            x={(d) => d.x}
            y={(d) => d.y}
            title="Quarterly sales by month"
            height={200}
          />
        </div>
        <div className="chart-card">
          <h3>LineChart</h3>
          <LineChart
            series={LINE_SERIES}
            x={(d) => d.x}
            y={(d) => d.y}
            title="Revenue vs cost over time"
            height={200}
          />
        </div>
        <div className="chart-card">
          <h3>AreaChart</h3>
          <AreaChart
            series={AREA_SERIES}
            x={(d) => d.x}
            y={(d) => d.y}
            title="Page visits and sign-ups"
            height={200}
          />
        </div>
      </div>

      <p className="chart-showcase-cvd">
        All {__CASCIVO_THEME_COUNT__} themes use CVD-safe palettes.{' '}
        <a href="/accessibility">See accessibility evidence →</a>
      </p>

      <p className="chart-showcase-keys">
        <kbd>Tab</kbd> to focus · <kbd>←</kbd> <kbd>→</kbd> navigate · <kbd>Enter</kbd> to announce
      </p>

      <p className="chart-showcase-cta">
        <a href="/docs/charts">See all 17 chart types in the docs →</a>
      </p>
    </section>
  )
}
