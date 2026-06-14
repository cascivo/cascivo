'use client'
import { t } from '@cascivo/i18n'
import { deployMsg } from '../i18n'
import { metrics } from '../data/fixtures'
import styles from './MetricsBar.module.css'

const DORA_METRICS = [
  {
    labelMsg: deployMsg.metricDeployFreq,
    unitMsg: deployMsg.metricDeployFreqUnit,
    value: metrics.deployFrequency,
  },
  {
    labelMsg: deployMsg.metricLeadTime,
    unitMsg: deployMsg.metricLeadTimeUnit,
    value: metrics.leadTime,
  },
  {
    labelMsg: deployMsg.metricChangeFailRate,
    unitMsg: deployMsg.metricChangeFailRateUnit,
    value: metrics.changeFailRate,
  },
  {
    labelMsg: deployMsg.metricMttr,
    unitMsg: deployMsg.metricMttrUnit,
    value: metrics.mttr,
  },
] as const

export function MetricsBar() {
  return (
    <div className={styles['root']}>
      {DORA_METRICS.map((m) => (
        <div key={m.labelMsg.key} className={styles['card']}>
          <span className={styles['label']}>{t(m.labelMsg)}</span>
          <span className={styles['value']}>{m.value}</span>
          <span className={styles['unit']}>{t(m.unitMsg)}</span>
        </div>
      ))}
    </div>
  )
}
