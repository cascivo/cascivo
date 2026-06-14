'use client'
import { signal, useSignalEffect, useSignals } from '@cascivo/core'
import { formatNumber, t } from '@cascivo/i18n'
import { Skeleton } from '@cascivo/react'
import { AreaChart, BarChart, Kpi } from '@cascivo/charts'
import { SegmentedControl } from '@cascivo/react'
import { rangeSignal } from '../App'
import { getRevenueSeries, getVolumeByProduct } from '../api'
import { TRANSACTIONS } from '../data/fixtures'
import { msg } from '../i18n'
import type { RevenueDatum, VolumeDatum, Range } from '../api'
import styles from './Overview.module.css'

// Module-level signals
const revenueSeries = signal<RevenueDatum[]>([])
const volumeByProduct = signal<VolumeDatum[]>([])
const loading = signal(true)
const error = signal<string | null>(null)

function computeKpis(range: Range) {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const cutoff = new Date(Date.UTC(2026, 5, 14))
  cutoff.setUTCDate(cutoff.getUTCDate() - days + 1)
  const inRange = TRANSACTIONS.filter((tx) => new Date(tx.timestamp) >= cutoff)
  const succeeded = inRange.filter((tx) => tx.status === 'succeeded')
  const grossRevenue = succeeded.reduce((sum, tx) => sum + tx.amount, 0) / 100
  const successRate = inRange.length > 0 ? (succeeded.length / inRange.length) * 100 : 0
  const avgTx = succeeded.length > 0 ? grossRevenue / succeeded.length : 0
  // Count distinct customers in range
  const uniqueCustomers = new Set(inRange.map((tx) => tx.customerId)).size
  return { grossRevenue, successRate, avgTx, uniqueCustomers }
}

const RANGE_OPTIONS = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
]

export function Overview() {
  useSignals()

  useSignalEffect(() => {
    const currentRange = rangeSignal.value
    let cancelled = false
    loading.value = true
    error.value = null

    Promise.all([getRevenueSeries(currentRange), getVolumeByProduct(currentRange)])
      .then(([rev, vol]) => {
        if (cancelled) return
        revenueSeries.value = rev
        volumeByProduct.value = vol
        loading.value = false
      })
      .catch((err: unknown) => {
        if (cancelled) return
        error.value = err instanceof Error ? err.message : 'Unknown error'
        loading.value = false
      })

    return () => {
      cancelled = true
    }
  })

  const kpis = computeKpis(rangeSignal.value)

  // Build x-axis indices for AreaChart (day index 0..N)
  const areaSeries = [
    {
      id: 'revenue',
      label: 'Revenue',
      data: revenueSeries.value,
    },
  ]

  // Bar chart data
  const barSeries = [
    {
      id: 'volume',
      label: 'Volume',
      data: volumeByProduct.value,
    },
  ]

  return (
    <div className={styles['root']}>
      <div className={styles['toolbar']}>
        <h2 className={styles['title']}>{t(msg.sectionOverview)}</h2>
        <SegmentedControl
          options={RANGE_OPTIONS}
          value={rangeSignal.value}
          onValueChange={(v) => {
            rangeSignal.value = v as Range
          }}
        />
      </div>

      {/* KPI row — not lazy */}
      <div className={styles['kpiRow']}>
        <Kpi
          label={t(msg.kpiGrossRevenue)}
          value={`$${formatNumber(kpis.grossRevenue, { maximumFractionDigits: 0 })}`}
        />
        <Kpi label={t(msg.kpiSuccessRate)} value={`${kpis.successRate.toFixed(1)}%`} />
        <Kpi
          label={t(msg.kpiAvgTransaction)}
          value={`$${formatNumber(kpis.avgTx, { maximumFractionDigits: 2 })}`}
        />
        <Kpi label={t(msg.kpiNewCustomers)} value={kpis.uniqueCustomers} />
      </div>

      {loading.value ? (
        <div className={styles['skeletons']}>
          <Skeleton style={{ height: '300px', borderRadius: 'var(--cascivo-radius-surface)' }} />
          <Skeleton style={{ height: '300px', borderRadius: 'var(--cascivo-radius-surface)' }} />
        </div>
      ) : (
        <>
          <div className={styles['chart']}>
            <AreaChart
              title={t(msg.chartRevenue)}
              series={areaSeries}
              x={(d) => new Date(d.date).getTime()}
              y={(d) => d.revenue}
              tooltip
              legend={false}
            />
          </div>
          <div className={styles['chart']}>
            <BarChart
              title={t(msg.chartVolumeByProduct)}
              series={barSeries}
              x={(d) => d.product}
              y={(d) => d.volume}
              tooltip
            />
          </div>
        </>
      )}
    </div>
  )
}
