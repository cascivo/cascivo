import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  LineChart,
  AreaChart,
  BarChart,
  ScatterChart,
  PieChart,
  Histogram,
  Boxplot,
  BubbleChart,
  ComboChart,
  Heatmap,
  Radar,
  Treemap,
} from '@cascade-ui/charts'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

const lineSeries = [
  {
    id: 'revenue',
    label: 'Revenue',
    data: months.map((_, i) => ({ x: i, y: 2000 + i * 300 })),
  },
  {
    id: 'cost',
    label: 'Cost',
    data: months.map((_, i) => ({ x: i, y: 1200 + i * 120 })),
  },
]

const barSeries = [
  {
    id: 'q1',
    label: 'Q1',
    data: months.map((m, i) => ({ x: m, y: 1000 + i * 150 })),
  },
]

const pieData = [
  { id: 'direct', label: 'Direct', value: 35 },
  { id: 'organic', label: 'Organic', value: 28 },
  { id: 'referral', label: 'Referral', value: 37 },
]

const scatterSeries = [
  {
    id: 'a',
    label: 'Group A',
    data: months.map((_, i) => ({ x: i * 5, y: 10 + i * 4 })),
  },
]

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBlock: '1rem' }}>
      <div
        style={{
          width: '8rem',
          fontSize: '0.75rem',
          color: 'var(--cascivo-text-secondary)',
          flexShrink: 0,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}

function ColLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        fontSize: '0.6875rem',
        color: 'var(--cascivo-text-secondary)',
        marginBlockEnd: '0.25rem',
      }}
    >
      {children}
    </div>
  )
}

function PlainSheetInner() {
  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '2rem', marginBlockEnd: '0.5rem' }}>
        <div style={{ width: '8rem' }} />
        <div
          style={{
            width: 280,
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--cascivo-text-secondary)',
          }}
        >
          Full chrome
        </div>
        <div
          style={{
            width: 120,
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--cascivo-text-secondary)',
          }}
        >
          plain (120×32)
        </div>
      </div>

      <Row label="LineChart">
        <div>
          <LineChart
            series={lineSeries}
            x={(d) => d.x}
            y={(d) => d.y}
            title="Revenue"
            height={100}
            width={280}
          />
        </div>
        <div>
          <LineChart
            series={lineSeries}
            x={(d) => d.x}
            y={(d) => d.y}
            title="Revenue micro"
            plain
            width={120}
            height={32}
          />
        </div>
      </Row>

      <Row label="AreaChart">
        <div>
          <AreaChart
            series={lineSeries}
            x={(d) => d.x}
            y={(d) => d.y}
            title="Revenue"
            height={100}
            width={280}
          />
        </div>
        <div>
          <AreaChart
            series={lineSeries}
            x={(d) => d.x}
            y={(d) => d.y}
            title="Revenue micro"
            plain
            width={120}
            height={32}
          />
        </div>
      </Row>

      <Row label="BarChart">
        <div>
          <BarChart
            series={barSeries}
            x={(d) => d.x}
            y={(d) => d.y}
            title="Sales"
            height={100}
            width={280}
          />
        </div>
        <div>
          <BarChart
            series={barSeries}
            x={(d) => d.x}
            y={(d) => d.y}
            title="Sales micro"
            plain
            width={120}
            height={32}
          />
        </div>
      </Row>

      <Row label="ScatterChart">
        <div>
          <ScatterChart series={scatterSeries} title="Scatter" height={100} width={280} />
        </div>
        <div>
          <ScatterChart
            series={scatterSeries}
            title="Scatter micro"
            plain
            width={120}
            height={32}
          />
        </div>
      </Row>

      <Row label="PieChart">
        <div>
          <PieChart data={pieData} title="Sources" height={120} width={280} />
        </div>
        <div>
          <PieChart data={pieData} title="Sources micro" plain width={120} height={32} />
        </div>
      </Row>

      <Row label="Histogram">
        <div>
          <Histogram
            data={months.map((_, i) => 10 + i * 4)}
            title="Dist"
            label="X"
            height={100}
            width={280}
          />
        </div>
        <div>
          <Histogram
            data={months.map((_, i) => 10 + i * 4)}
            title="Dist micro"
            label="X"
            plain
            width={120}
            height={32}
          />
        </div>
      </Row>

      <Row label="Boxplot">
        <div>
          <Boxplot
            series={[{ id: 'a', label: 'A', values: [1, 2, 3, 4, 5, 6, 7, 8] }]}
            title="Box"
            height={100}
            width={280}
          />
        </div>
        <div>
          <Boxplot
            series={[{ id: 'a', label: 'A', values: [1, 2, 3, 4, 5, 6, 7, 8] }]}
            title="Box micro"
            plain
            width={120}
            height={32}
          />
        </div>
      </Row>

      <Row label="BubbleChart">
        <div>
          <BubbleChart
            series={[
              { name: 'A', data: months.map((_, i) => ({ x: i, y: i * 5, size: 5 + i * 3 })) },
            ]}
            title="Bubble"
            height={100}
            width={280}
          />
        </div>
        <div>
          <BubbleChart
            series={[
              { name: 'A', data: months.map((_, i) => ({ x: i, y: i * 5, size: 5 + i * 3 })) },
            ]}
            title="Bubble micro"
            plain
            width={120}
            height={32}
          />
        </div>
      </Row>

      <Row label="ComboChart">
        <div>
          <ComboChart
            bars={months.map((m, i) => ({ label: m, value: 80 + i * 15 }))}
            line={months.map((_, i) => ({ x: i, y: 40 + i * 10 }))}
            title="Combo"
            height={100}
            width={280}
          />
        </div>
        <div>
          <ComboChart
            bars={months.map((m, i) => ({ label: m, value: 80 + i * 15 }))}
            line={months.map((_, i) => ({ x: i, y: 40 + i * 10 }))}
            title="Combo micro"
            plain
            width={120}
            height={32}
          />
        </div>
      </Row>

      <Row label="Heatmap">
        <div>
          <Heatmap
            data={['Mon', 'Tue'].flatMap((x) =>
              ['AM', 'PM', 'Eve'].map((y, i) => ({ x, y, value: 10 + i * 5 })),
            )}
            title="Heat"
            height={120}
            width={280}
          />
        </div>
        <div>
          <Heatmap
            data={['Mon', 'Tue'].flatMap((x) =>
              ['AM', 'PM', 'Eve'].map((y, i) => ({ x, y, value: 10 + i * 5 })),
            )}
            title="Heat micro"
            plain
            width={120}
            height={32}
          />
        </div>
      </Row>

      <Row label="Radar">
        <div>
          <Radar
            axes={['A', 'B', 'C', 'D']}
            series={[{ id: 'x', label: 'X', values: [80, 60, 70, 90] }]}
            title="Radar"
            height={120}
            width={280}
          />
        </div>
        <div>
          <Radar
            axes={['A', 'B', 'C', 'D']}
            series={[{ id: 'x', label: 'X', values: [80, 60, 70, 90] }]}
            title="Radar micro"
            plain
            width={120}
            height={32}
          />
        </div>
      </Row>

      <Row label="Treemap">
        <div>
          <Treemap
            data={pieData.map((d) => ({ id: d.id, label: d.label, value: d.value }))}
            title="Tree"
            height={120}
            width={280}
          />
        </div>
        <div>
          <Treemap
            data={pieData.map((d) => ({ id: d.id, label: d.label, value: d.value }))}
            title="Tree micro"
            plain
            width={120}
            height={32}
          />
        </div>
      </Row>
    </div>
  )
}

const meta: Meta = {
  title: 'Charts/PlainCharts',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

export const AllMicroCharts: Story = {
  render: () => <PlainSheetInner />,
}

export const InTableCell: Story = {
  render: () => (
    <div style={{ padding: '2rem' }}>
      <ColLabel>Plain LineChart at 120×32 inside a table cell</ColLabel>
      <table style={{ borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr>
            {['Metric', 'Value', 'Trend'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '0.5rem 1rem',
                  textAlign: 'start',
                  borderBlockEnd: '1px solid var(--cascivo-color-border)',
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
            { label: 'Revenue', value: '$48.3k' },
            { label: 'Cost', value: '$22.1k', color: 'var(--cascivo-chart-2)' },
          ].map((row, ri) => (
            <tr key={row.label}>
              <td
                style={{
                  padding: '0.5rem 1rem',
                  borderBlockEnd: '1px solid var(--cascivo-color-border-subtle)',
                }}
              >
                {row.label}
              </td>
              <td
                style={{
                  padding: '0.5rem 1rem',
                  borderBlockEnd: '1px solid var(--cascivo-color-border-subtle)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {row.value}
              </td>
              <td
                style={{
                  padding: '0.5rem 1rem',
                  borderBlockEnd: '1px solid var(--cascivo-color-border-subtle)',
                }}
              >
                <LineChart
                  series={[{ ...lineSeries[ri]!, ...(row.color ? { color: row.color } : {}) }]}
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
  ),
}
