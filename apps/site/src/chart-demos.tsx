import type { JSX } from 'preact'
import { LineChart } from '@cascivo/charts'
import { AreaChart } from '@cascivo/charts'
import { BarChart } from '@cascivo/charts'
import { PieChart } from '@cascivo/charts'
import { ScatterChart } from '@cascivo/charts'
import { Sparkline } from '@cascivo/charts'
import { Meter } from '@cascivo/charts'
import { Kpi } from '@cascivo/charts'
import { Histogram } from '@cascivo/charts'
import { Boxplot } from '@cascivo/charts'
import { BubbleChart } from '@cascivo/charts'
import { ComboChart } from '@cascivo/charts'
import { Heatmap } from '@cascivo/charts'
import { Treemap } from '@cascivo/charts'
import { Radar } from '@cascivo/charts'
import { Bullet } from '@cascivo/charts'
import { RadialBar } from '@cascivo/charts'
import { Funnel } from '@cascivo/charts'
import { Calendar } from '@cascivo/charts'
import { Candlestick } from '@cascivo/charts'
import { Gauge } from '@cascivo/charts'
import { Polar } from '@cascivo/charts'
import { Stream } from '@cascivo/charts'
import { Sunburst } from '@cascivo/charts'

// Small, self-contained sample datasets — mirrors the proven usages on the
// /docs/charts gallery page so each component's own doc page renders one live,
// representative preview instead of "No live preview.".
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
  { id: 'q1', label: 'Q1', data: months.slice(0, 6).map((m, i) => ({ x: m, y: 1000 + i * 150 })) },
  { id: 'q2', label: 'Q2', data: months.slice(0, 6).map((m, i) => ({ x: m, y: 800 + i * 200 })) },
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

const DAY_MS = 86_400_000
const calendarData = Array.from({ length: 70 }, (_, i) => ({
  day: new Date(Date.UTC(2024, 0, 1) + i * DAY_MS).toISOString().slice(0, 10),
  value: (i * 7 + (i % 5) * 11) % 40,
}))

const candleData = Array.from({ length: 14 }, (_, i) => {
  const open = 100 + i * 3 + (i % 3) * 4
  const close = open + (i % 2 === 0 ? 1 : -1) * (3 + (i % 4))
  return {
    t: `D${i + 1}`,
    open,
    high: Math.max(open, close) + 3,
    low: Math.min(open, close) - 3,
    close,
  }
})

const polarData = [
  { label: 'N', value: 20 },
  { label: 'NE', value: 34 },
  { label: 'E', value: 28 },
  { label: 'SE', value: 16 },
  { label: 'S', value: 24 },
  { label: 'SW', value: 38 },
  { label: 'W', value: 30 },
  { label: 'NW', value: 12 },
]

const streamCategories = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6']
const streamSeries = [
  { id: 'search', label: 'Search', values: [10, 14, 12, 18, 16, 22] },
  { id: 'direct', label: 'Direct', values: [8, 10, 14, 12, 16, 14] },
  { id: 'social', label: 'Social', values: [4, 6, 5, 9, 8, 12] },
]

const sunburstData = {
  label: 'Traffic',
  children: [
    {
      label: 'Search',
      children: [
        { label: 'Google', value: 40 },
        { label: 'Bing', value: 8 },
      ],
    },
    { label: 'Direct', value: 25 },
    {
      label: 'Social',
      children: [
        { label: 'X', value: 12 },
        { label: 'LinkedIn', value: 9 },
      ],
    },
  ],
}

/** Keyed by the chart slug WITHOUT the `chart/` category prefix. */
export const chartDemos: Record<string, () => JSX.Element> = {
  'line-chart': () => (
    <LineChart
      series={lineSeries}
      x={(d) => d.x}
      y={(d) => d.y}
      title="Revenue vs Cost"
      height={260}
    />
  ),
  'area-chart': () => (
    <AreaChart
      series={areaSeries}
      x={(d) => d.x}
      y={(d) => d.y}
      title="Visits and sign-ups"
      height={260}
      stacked
    />
  ),
  'bar-chart': () => (
    <BarChart
      series={barSeries}
      x={(d) => d.x}
      y={(d) => d.y}
      title="Sales by month"
      height={260}
    />
  ),
  'pie-chart': () => <PieChart data={pieData} title="Traffic sources" height={260} donut />,
  'scatter-chart': () => (
    <ScatterChart series={scatterSeries} title="Group A vs Group B" height={260} />
  ),
  sparkline: () => (
    <Sparkline data={sparkData} label="Monthly revenue trend" width={200} height={48} />
  ),
  meter: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Meter value={45} label="CPU" width={240} />
      <Meter value={72} label="Memory" width={240} thresholds={{ warning: 60, critical: 80 }} />
      <Meter value={88} label="Disk" width={240} thresholds={{ warning: 70, critical: 85 }} />
    </div>
  ),
  kpi: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
    </div>
  ),
  histogram: () => (
    <Histogram
      data={months.map((_, i) => 20 + i * 4 + (i % 3) * 8)}
      title="Value distribution"
      label="Value"
    />
  ),
  boxplot: () => (
    <Boxplot
      series={[
        { id: 'a', label: 'Group A', values: months.map((_, i) => 10 + i * 5 + (i % 4) * 3) },
        { id: 'b', label: 'Group B', values: months.map((_, i) => 20 + i * 3 + (i % 3) * 7) },
      ]}
      title="Group comparison"
    />
  ),
  'bubble-chart': () => (
    <BubbleChart
      series={[
        {
          name: 'Products',
          data: months.slice(0, 6).map((_, i) => ({ x: i * 10, y: 20 + i * 8, size: 10 + i * 5 })),
        },
      ]}
      title="Product metrics"
    />
  ),
  'combo-chart': () => (
    <ComboChart
      bars={months.slice(0, 6).map((m, i) => ({ label: m, value: 80 + i * 15 }))}
      line={months.slice(0, 6).map((_, i) => ({ x: i, y: 40 + i * 10 }))}
      title="Sales vs Target"
    />
  ),
  heatmap: () => (
    <Heatmap
      data={['Mon', 'Tue', 'Wed'].flatMap((x) =>
        ['AM', 'PM', 'Eve'].map((y, i) => ({ x, y, value: 10 + i * 5 + x.length * 3 })),
      )}
      title="Activity heatmap"
    />
  ),
  treemap: () => (
    <Treemap
      data={[
        { id: 'a', label: 'Alpha', value: 40 },
        { id: 'b', label: 'Beta', value: 25 },
        { id: 'c', label: 'Gamma', value: 20 },
        { id: 'd', label: 'Delta', value: 15 },
      ]}
      title="Market segments"
    />
  ),
  radar: () => (
    <Radar
      axes={['Speed', 'Power', 'Range', 'Efficiency', 'Cost']}
      series={[
        { id: 'a', label: 'Model A', values: [80, 70, 60, 90, 50] },
        { id: 'b', label: 'Model B', values: [60, 85, 75, 70, 80] },
      ]}
      title="Model comparison"
    />
  ),
  bullet: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Bullet value={72} target={80} ranges={[40, 70, 100]} label="Revenue %" />
      <Bullet value={55} target={70} ranges={[30, 60, 100]} label="Satisfaction" />
    </div>
  ),
  'radial-bar': () => (
    <RadialBar
      data={[
        { id: 'rev', label: 'Revenue', value: 84 },
        { id: 'nps', label: 'NPS', value: 61 },
        { id: 'ret', label: 'Retention', value: 72 },
      ]}
      title="Quarterly goals"
      max={100}
      size={240}
      centerValue="72%"
      centerLabel="On track"
      tooltip
      legend
    />
  ),
  funnel: () => (
    <Funnel
      data={[
        { id: 'visit', label: 'Visited', value: 8200 },
        { id: 'signup', label: 'Signed up', value: 3100 },
        { id: 'active', label: 'Activated', value: 1400 },
        { id: 'paid', label: 'Paid', value: 520 },
      ]}
      title="Signup funnel"
      showConversion
      height={280}
      tooltip
    />
  ),
  calendar: () => <Calendar data={calendarData} title="Contributions" height={160} />,
  candlestick: () => <Candlestick data={candleData} title="Price (OHLC)" height={260} volume />,
  gauge: () => (
    <Gauge
      value={68}
      unit="%"
      title="Throughput"
      width={240}
      height={170}
      thresholds={[
        { upTo: 50, color: 'var(--cascivo-color-success)' },
        { upTo: 80, color: 'var(--cascivo-color-warning)' },
        { upTo: 100, color: 'var(--cascivo-color-destructive)' },
      ]}
    />
  ),
  polar: () => <Polar data={polarData} title="Wind by direction" mode="bar" height={260} />,
  stream: () => (
    <Stream
      series={streamSeries}
      categories={streamCategories}
      title="Channels over time"
      height={260}
      legend
    />
  ),
  sunburst: () => <Sunburst data={sunburstData} title="Traffic breakdown" height={260} />,
}
