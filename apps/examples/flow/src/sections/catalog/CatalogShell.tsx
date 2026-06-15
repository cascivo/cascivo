'use client'
import { signal, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Tabs, TabsList, TabsTrigger, TabsContent, SegmentedControl } from '@cascivo/react'
import { CATALOG_ASSETS, PROJECT_DETAILS } from '../../data/catalog'
import { msg } from '../../i18n'
import { AdoptionView } from './AdoptionView'
import { AssetsTable } from './AssetsTable'
import { ProjectDetail } from './ProjectDetail'
import styles from './CatalogShell.module.css'

export const catalogTab = signal<'assets' | 'usage' | 'adoption'>('adoption')
export const catalogRange = signal<'7d' | '30d' | '90d'>('30d')
export const selectedAssetId = signal<string | null>(null)

const RANGE_OPTIONS = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
]

export function CatalogShell() {
  useSignals()

  const asset = CATALOG_ASSETS.find((a) => a.id === selectedAssetId.value)
  const detail = PROJECT_DETAILS.find((d) => d.assetId === selectedAssetId.value)

  if (asset && detail) {
    return (
      <ProjectDetail
        asset={asset}
        detail={detail}
        onBack={() => {
          selectedAssetId.value = null
        }}
      />
    )
  }

  return (
    <div className={styles['shell']}>
      <div className={styles['header']}>
        <h1 className={styles['title']}>{t(msg.catalogTitle)}</h1>
        <SegmentedControl
          options={RANGE_OPTIONS}
          value={catalogRange.value}
          onValueChange={(v) => {
            catalogRange.value = v as typeof catalogRange.value
          }}
          size="sm"
        />
      </div>
      <p className={styles['description']}>{t(msg.catalogDescription)}</p>
      <Tabs
        value={catalogTab.value}
        onValueChange={(v) => {
          catalogTab.value = v as typeof catalogTab.value
        }}
      >
        <TabsList>
          <TabsTrigger value="assets">{t(msg.catalogTabAssets)}</TabsTrigger>
          <TabsTrigger value="usage">{t(msg.catalogTabUsage)}</TabsTrigger>
          <TabsTrigger value="adoption">{t(msg.catalogTabAdoption)}</TabsTrigger>
        </TabsList>
        <TabsContent value="assets">
          <AssetsTable
            onSelect={(id) => {
              selectedAssetId.value = id
            }}
          />
        </TabsContent>
        <TabsContent value="usage">
          <p
            style={{
              color: 'var(--cascivo-color-foreground-muted)',
              padding: 'var(--cascivo-space-4)',
            }}
          >
            {t(msg.catalogUsagePlaceholder)}
          </p>
        </TabsContent>
        <TabsContent value="adoption">
          <AdoptionView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
