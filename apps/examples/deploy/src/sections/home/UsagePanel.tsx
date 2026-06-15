'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Badge, Button, Card, CardContent, CardHeader, ProgressBar } from '@cascivo/react'
import { USAGE_METRICS } from '../../data/edge'
import { deployMsg } from '../../i18n'
import styles from './UsagePanel.module.css'

export function UsagePanel() {
  useSignals()

  return (
    <aside className={styles['panel']}>
      <Card>
        <CardHeader>
          <div className={styles['sectionHeader']}>
            <h2 className={styles['sectionTitle']}>{t(deployMsg.usageTitle)}</h2>
            <span className={styles['sectionMeta']}>{t(deployMsg.usageRange)}</span>
            <Badge variant="secondary" size="sm">
              {t(deployMsg.usageUpgrade)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className={styles['sectionTitle']}>{t(deployMsg.alertsTitle)}</h2>
        </CardHeader>
        <CardContent>
          <div className={styles['compactEmpty']}>
            <p className={styles['compactTitle']}>{t(deployMsg.alertsEmptyTitle)}</p>
            <p className={styles['compactDesc']}>{t(deployMsg.alertsEmptyDesc)}</p>
            <Button variant="secondary" size="sm">
              {t(deployMsg.alertsUpgradeBtn)}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className={styles['sectionTitle']}>{t(deployMsg.recentTitle)}</h2>
        </CardHeader>
        <CardContent>
          <p className={styles['compactDesc']}>{t(deployMsg.recentEmptyDesc)}</p>
        </CardContent>
      </Card>
    </aside>
  )
}
