'use client'
import { useSignal, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Input, Select, Button, FileUploader, AlertDialog } from '@cascivo/react'
import { msg } from '../../i18n'
import styles from './Workspace.module.css'

const MONTH_OPTIONS = [
  { value: '1', label: 'January' },
  { value: '4', label: 'April' },
  { value: '7', label: 'July' },
  { value: '10', label: 'October' },
]

const REGION_OPTIONS = [
  { value: 'us', label: 'United States' },
  { value: 'eu', label: 'European Union' },
  { value: 'ap', label: 'Asia Pacific' },
]

export function Workspace() {
  useSignals()

  const workspaceName = useSignal('Forum')
  const workspaceUrl = useSignal('forum')
  const deleteOpen = useSignal(false)

  return (
    <div className={styles['root']}>
      <h1 className={styles['title']}>{t(msg.wsTitle)}</h1>

      <section className={styles['section']}>
        <div className={styles['row']}>
          <div className={styles['rowLabel']}>
            <span className={styles['label']}>{t(msg.wsLogo)}</span>
            <p className={styles['desc']}>{t(msg.wsLogoDesc)}</p>
          </div>
          <FileUploader accept="image/*" label={t(msg.wsLogo)} />
        </div>
      </section>

      <section className={styles['section']}>
        <div className={styles['row']}>
          <label className={styles['label']} htmlFor="ws-name">
            {t(msg.wsName)}
          </label>
          <Input
            id="ws-name"
            value={workspaceName.value}
            onChange={(e) => {
              workspaceName.value = e.target.value
            }}
          />
        </div>

        <div className={styles['row']}>
          <label className={styles['label']} htmlFor="ws-url">
            {t(msg.wsUrl)}
          </label>
          <Input
            id="ws-url"
            value={workspaceUrl.value}
            onChange={(e) => {
              workspaceUrl.value = e.target.value
            }}
          />
        </div>
      </section>

      <section className={styles['section']}>
        <h2 className={styles['sectionTitle']}>{t(msg.wsSectionTimeRegion)}</h2>
        <div className={styles['row']}>
          <div className={styles['rowLabel']}>
            <span className={styles['label']}>{t(msg.wsFirstMonth)}</span>
            <p className={styles['desc']}>{t(msg.wsFirstMonthDesc)}</p>
          </div>
          <Select
            options={MONTH_OPTIONS}
            value="1"
            onChange={() => {}}
            aria-label={t(msg.wsFirstMonth)}
          />
        </div>
        <div className={styles['row']}>
          <div className={styles['rowLabel']}>
            <span className={styles['label']}>{t(msg.wsRegion)}</span>
            <p className={styles['desc']}>{t(msg.wsRegionDesc)}</p>
          </div>
          <Select
            options={REGION_OPTIONS}
            value="us"
            onChange={() => {}}
            aria-label={t(msg.wsRegion)}
          />
        </div>
      </section>

      <section className={styles['section']}>
        <h2 className={styles['dangerTitle']}>{t(msg.wsDangerZone)}</h2>
        <div className={styles['row']}>
          <div className={styles['rowLabel']}>
            <span className={styles['label']}>{t(msg.wsDeleteWorkspace)}</span>
            <p className={styles['desc']}>{t(msg.wsDeleteDesc)}</p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              deleteOpen.value = true
            }}
          >
            {t(msg.wsDeleteBtn)}
          </Button>
        </div>
      </section>

      <AlertDialog
        open={deleteOpen.value}
        title={t(msg.wsDeleteDialogTitle)}
        description={t(msg.wsDeleteDialogDesc)}
        variant="destructive"
        labels={{ confirm: t(msg.wsDeleteDialogConfirm), cancel: t(msg.wsDeleteDialogCancel) }}
        onConfirm={() => {
          deleteOpen.value = false
        }}
        onCancel={() => {
          deleteOpen.value = false
        }}
      />
    </div>
  )
}
