'use client'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@cascivo/react'

interface Stat {
  label: string
  value: string
  delta?: string
  trend?: 'up' | 'down' | 'neutral'
}

const demoStats: Stat[] = [
  { label: 'Total users', value: '12,483', delta: '+12%', trend: 'up' },
  { label: 'Revenue', value: '$48,290', delta: '+8.4%', trend: 'up' },
  { label: 'Active sessions', value: '1,042', delta: '-3%', trend: 'down' },
  { label: 'Uptime', value: '99.98%', delta: '+0.1%', trend: 'neutral' },
]

function trendVariant(trend: Stat['trend']): 'success' | 'destructive' | 'secondary' {
  if (trend === 'up') return 'success'
  if (trend === 'down') return 'destructive'
  return 'secondary'
}

export interface StatsCardsProps {
  stats?: Stat[]
}

export function StatsCards({ stats = demoStats }: StatsCardsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
        gap: '1rem',
      }}
    >
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader>
            <CardTitle>{stat.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stat.value}</div>
            {stat.delta && <Badge variant={trendVariant(stat.trend)}>{stat.delta}</Badge>}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
