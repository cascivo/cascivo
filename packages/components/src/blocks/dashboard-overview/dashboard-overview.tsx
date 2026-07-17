'use client'
import { useSignals } from '@cascivo/core'
import { Badge } from '../../badge/badge'
import { Card } from '../../card/card'
import styles from './dashboard-overview.module.css'

type Stat = {
  label: string
  value: string
  delta: string
  trend: 'up' | 'down'
  icon: string
}

const STATS: Stat[] = [
  { label: 'Revenue', value: '$48,295', delta: '+12.5%', trend: 'up', icon: '💰' },
  { label: 'Active Users', value: '2,847', delta: '+8.1%', trend: 'up', icon: '👥' },
  { label: 'Orders', value: '1,204', delta: '-3.2%', trend: 'down', icon: '📦' },
  { label: 'Conversion Rate', value: '3.6%', delta: '+0.4%', trend: 'up', icon: '📈' },
]

export function DashboardOverview() {
  useSignals()

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Good morning</h1>
        <p className={styles.date}>Today&apos;s overview</p>
      </header>

      <div className={styles.gridOuter}>
        <div className={styles.grid}>
          {STATS.map((stat) => (
            <div key={stat.label} data-testid="stat-card">
              <Card className={styles.statCard}>
                <div className={styles.statIcon} aria-hidden="true">
                  {stat.icon}
                </div>
                <p className={styles.statLabel}>{stat.label}</p>
                <p className={styles.statValue}>{stat.value}</p>
                <div className={styles.statDelta}>
                  <Badge variant={stat.trend === 'up' ? 'success' : 'destructive'}>
                    {stat.delta}
                  </Badge>
                  <span className={styles.statTrend}>vs last month</span>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
