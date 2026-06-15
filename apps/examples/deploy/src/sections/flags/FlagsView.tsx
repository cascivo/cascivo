'use client'
import { signal, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Select, Button, EmptyState, Card, CardHeader, CardContent, Link } from '@cascivo/react'
import { deployMsg } from '../../i18n'
import styles from './FlagsView.module.css'

const typeFilter = signal<string>('all')

interface Provider {
  id: string
  name: string
  description: string
}

const PROVIDERS: Provider[] = [
  { id: 'statsig', name: 'Statsig', description: 'Manage flags and A/B tests' },
  { id: 'growthbook', name: 'GrowthBook', description: 'Open source experimentation' },
  { id: 'posthog', name: 'PostHog', description: 'Feature flags and A/B tests' },
]

const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'multivariate', label: 'Multivariate' },
]

export function FlagsView() {
  useSignals()

  return (
    <div className={styles['root']}>
      <div className={styles['topBar']}>
        <Select
          options={TYPE_OPTIONS}
          value={typeFilter.value}
          onChange={(v) => {
            typeFilter.value = v
          }}
          aria-label={t(deployMsg.flagsFilterLabel)}
        />
        <Button variant="primary" size="sm">
          {t(deployMsg.flagsCreateBtn)}
        </Button>
      </div>

      <div className={styles['content']}>
        <div className={styles['emptyWrap']}>
          <EmptyState
            title={t(deployMsg.flagsEmptyTitle)}
            description={t(deployMsg.flagsEmptyDesc)}
            action={
              <Button variant="secondary" size="sm">
                {t(deployMsg.flagsCreateBtn)}
              </Button>
            }
          />
        </div>

        <section className={styles['marketplace']}>
          <div className={styles['marketplaceHeader']}>
            <div>
              <h2 className={styles['marketplaceTitle']}>{t(deployMsg.flagsMarketplaceTitle)}</h2>
              <p className={styles['marketplaceSub']}>{t(deployMsg.flagsMarketplaceSub)}</p>
            </div>
            <Link href="#">{t(deployMsg.flagsLearnMore)}</Link>
          </div>

          <h3 className={styles['providersTitle']}>{t(deployMsg.flagsProvidersTitle)}</h3>

          <div className={styles['providerGrid']}>
            {PROVIDERS.map((p) => (
              <Card key={p.id} className={styles['providerCard']}>
                <CardHeader>
                  <span className={styles['providerName']}>{p.name}</span>
                </CardHeader>
                <CardContent>
                  <p className={styles['providerDesc']}>{p.description}</p>
                  <Button variant="secondary" size="sm">
                    {t(deployMsg.flagsProviderCreateBtn)}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
