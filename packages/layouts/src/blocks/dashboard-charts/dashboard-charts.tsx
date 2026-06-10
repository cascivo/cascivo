'use client'
import { LineChart, BarChart, PieChart, Kpi } from '@cascade-ui/charts'
import { DashboardLayout } from '../../dashboard-layout/dashboard-layout'

// Deterministic demo data — no Math.random
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

const lineSeries = [
  {
    id: 'revenue',
    label: 'Revenue',
    data: months.map((_, i) => ({ x: i, y: 2000 + i * 350 + (i % 3) * 150 })),
  },
  {
    id: 'cost',
    label: 'Cost',
    data: months.map((_, i) => ({ x: i, y: 1200 + i * 100 + (i % 4) * 80 })),
  },
]

const barSeries = [
  {
    id: 'sales',
    label: 'Sales',
    data: months.map((m, i) => ({ x: m, y: 800 + i * 120 })),
  },
]

const pieData = [
  { id: 'direct', label: 'Direct', value: 38 },
  { id: 'organic', label: 'Organic', value: 30 },
  { id: 'referral', label: 'Referral', value: 20 },
  { id: 'social', label: 'Social', value: 12 },
]

const kpiTrend = [120, 145, 132, 178, 165, 210]

export interface DashboardChartsProps {
  className?: string
}

export function DashboardCharts({ className }: DashboardChartsProps) {
  return (
    <DashboardLayout
      className={className}
      stats={
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
          }}
        >
          <Kpi value={12483} label="Total Users" delta={12.4} sparkline={kpiTrend} />
          <Kpi value="$48,290" label="Revenue" delta={8.4} />
          <Kpi value={1042} label="Active Sessions" delta={-3.2} />
          <Kpi value="99.98%" label="Uptime" />
        </div>
      }
      main={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <LineChart
            series={lineSeries}
            x={(d) => d.x}
            y={(d) => d.y}
            title="Revenue vs Cost"
            height={240}
          />
          <BarChart
            series={barSeries}
            x={(d) => d.x}
            y={(d) => d.y}
            title="Monthly Sales"
            height={200}
          />
        </div>
      }
      aside={<PieChart data={pieData} title="Traffic Sources" height={260} donut />}
    />
  )
}
