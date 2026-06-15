'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Badge, Button, EmptyState, ProgressBar } from '@cascivo/react'
import { USAGE_METRICS } from '../../data/edge'
import { deployMsg } from '../../i18n'
import styles from './UsagePanel.module.css'

export function UsagePanel() {
  useSignals()

  return (
    <aside className={styles['panel']}>
      <section className={styles['section']}>
        <div className={styles['sectionHeader']}>
          <h2 className={styles['sectionTitle']}>{t(deployMsg.usageTitle)}</h2>
          <span className={styles['sectionMeta']}>{t(deployMsg.usageRange)}</span>
          <Badge variant="secondary" size="sm">
            {t(deployMsg.usageUpgrade)}
          </Badge>
        </div>
        <div className={styles['metrics']}>
          {USAGE_METRICS.map((m) => (
            <div key={m.label} className={styles['metricRow']}>
              <span className={styles['metricLabel']}>{m.label}</span>
              <span className={styles['metricCost']}>
                {m.unit === '$'
                  ? `$${m.used.toFixed(2)} / $${m.limit.toFixed(2)}`
                  : `${m.used}${m.unit}`}
              </span>
              <div className={styles['metricBar']}>
                <ProgressBar value={m.ratio * 100} max={100} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles['section']}>
        <h2 className={styles['sectionTitle']}>{t(deployMsg.alertsTitle)}</h2>
        <EmptyState
          title={t(deployMsg.alertsEmptyTitle)}
          description={t(deployMsg.alertsEmptyDesc)}
          action={
            <Button variant="secondary" size="sm">
              {t(deployMsg.alertsUpgradeBtn)}
            </Button>
          }
        />
      </section>

      <section className={styles['section']}>
        <h2 className={styles['sectionTitle']}>{t(deployMsg.recentTitle)}</h2>
        <EmptyState title="" description={t(deployMsg.recentEmptyDesc)} />
      </section>
    </aside>
  )
}
