'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Skeleton } from '@cascivo/react'
import { deployMsg } from '../i18n'
import { loading, metrics } from '../data/fixtures'
import styles from './MetricsBar.module.css'

const DORA_LABELS = [
  {
    labelMsg: deployMsg.metricDeployFreq,
    unitMsg: deployMsg.metricDeployFreqUnit,
    key: 'deployFrequency',
  },
  { labelMsg: deployMsg.metricLeadTime, unitMsg: deployMsg.metricLeadTimeUnit, key: 'leadTime' },
  {
    labelMsg: deployMsg.metricChangeFailRate,
    unitMsg: deployMsg.metricChangeFailRateUnit,
    key: 'changeFailRate',
  },
  { labelMsg: deployMsg.metricMttr, unitMsg: deployMsg.metricMttrUnit, key: 'mttr' },
] as const

export function MetricsBar() {
  useSignals()
  const isLoading = loading.value
  const data = metrics.value

  return (
    <div className={styles['root']}>
      {DORA_LABELS.map((m) => (
        <div key={m.key} className={styles['card']}>
          <span className={styles['label']}>{t(m.labelMsg)}</span>
          {isLoading || !data ? (
            <Skeleton variant="text" width="4rem" height="2rem" />
          ) : (
            <span className={styles['value']}>{data[m.key]}</span>
          )}
          <span className={styles['unit']}>{t(m.unitMsg)}</span>
        </div>
      ))}
    </div>
  )
}
