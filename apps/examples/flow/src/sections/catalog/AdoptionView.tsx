'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Badge, ProgressBar } from '@cascivo/react'
import { Kpi, AreaChart } from '@cascivo/charts'
import { ADOPTION_METRICS, CHART_DATA, TOP_ASSETS } from '../../data/catalog'
import { msg } from '../../i18n'
import styles from './AdoptionView.module.css'

export function AdoptionView() {
  useSignals()

  const chartSeries = [
    {
      id: 'upToDate',
      label: t(msg.chartLegendUpToDate),
      data: CHART_DATA.map((p) => ({ x: p.day, y: p.upToDate })),
      color: 'var(--cascivo-color-success)',
    },
    {
      id: 'outdated',
      label: t(msg.chartLegendOutdated),
      data: CHART_DATA.map((p) => ({ x: p.day, y: p.outdated })),
      color: 'var(--cascivo-color-warning)',
    },
    {
      id: 'unpublished',
      label: t(msg.chartLegendUnpublished),
      data: CHART_DATA.map((p) => ({ x: p.day, y: p.unpublished })),
      color: 'var(--cascivo-color-foreground-muted)',
    },
  ]

  return (
    <div className={styles['root']}>
      <div className={styles['metrics']}>
        {ADOPTION_METRICS.map((m) => (
          <div key={m.label} className={styles['metricCard']}>
            <Kpi value={m.value} label={m.label} />
            <p className={styles['metricSub']}>{m.sub}</p>
            <Badge variant="success" size="sm">
              ↑ {m.trend}
            </Badge>
          </div>
        ))}
      </div>

      <div className={styles['charts']}>
        <div className={styles['areaChartWrap']}>
          <h2 className={styles['sectionTitle']}>{t(msg.chartTitleUsageOverTime)}</h2>
          <p className={styles['chartDesc']}>{t(msg.chartDescUsageOverTime)}</p>
          <AreaChart
            series={chartSeries}
            x={(d) => d.x}
            y={(d) => d.y}
            title={t(msg.chartTitleUsageOverTime)}
            height={220}
            legend
          />
        </div>

        <div className={styles['rankedList']}>
          <h2 className={styles['sectionTitle']}>{t(msg.chartTitleTopAssets)}</h2>
          <p className={styles['chartDesc']}>{t(msg.chartDescTopAssets)}</p>
          <div className={styles['rankItems']}>
            {TOP_ASSETS.map((a) => (
              <div key={a.name} className={styles['rankRow']}>
                <span className={styles['rankName']}>{a.name}</span>
                <ProgressBar value={a.count} max={a.max} size="sm" />
                <span className={styles['rankCount']}>{a.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
