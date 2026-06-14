'use client'
import { t } from '@cascivo/i18n'
import type { Environment } from '@cascivo/example-kit'
import { deployMsg } from '../i18n'
import { environments } from '../data/fixtures'
import styles from './EnvironmentGrid.module.css'

function tierLabel(tier: Environment['tier']): string {
  switch (tier) {
    case 'prod':
      return t(deployMsg.tierProd)
    case 'staging':
      return t(deployMsg.tierStaging)
    case 'dev':
      return t(deployMsg.tierDev)
  }
}

function healthLabel(health: Environment['health']): string {
  switch (health) {
    case 'healthy':
      return t(deployMsg.healthHealthy)
    case 'degraded':
      return t(deployMsg.healthDegraded)
    case 'down':
      return t(deployMsg.healthDown)
  }
}

function EnvironmentCard({ env }: { env: Environment }) {
  return (
    <div className={styles['card']} data-health={env.health}>
      <div className={styles['header']}>
        <span className={styles['name']}>{env.name}</span>
        <span className={styles['tier']}>{tierLabel(env.tier)}</span>
      </div>
      <div className={styles['meta']}>
        <span>
          {t(deployMsg.labelVersion)}: {env.currentVersion}
        </span>
        <span>
          {t(deployMsg.labelLastDeploy)}: {new Date(env.lastDeployAt).toLocaleDateString()}
        </span>
      </div>
      <div className={styles['health']} data-health={env.health}>
        <span className={styles['healthDot']} data-health={env.health} aria-hidden="true" />
        {healthLabel(env.health)}
      </div>
    </div>
  )
}

export function EnvironmentGrid() {
  return (
    <div className={styles['root']}>
      {environments.map((env) => (
        <EnvironmentCard key={env.id} env={env} />
      ))}
    </div>
  )
}
