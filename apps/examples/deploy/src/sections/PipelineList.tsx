'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { ProgressBar, Skeleton } from '@cascivo/react'
import type { DeployStatus, Pipeline } from '@cascivo/example-kit'
import { deployMsg } from '../i18n'
import { loading, pipelines } from '../data/fixtures'
import styles from './PipelineList.module.css'

function statusLabel(s: DeployStatus): string {
  switch (s) {
    case 'pending':
      return t(deployMsg.statusPending)
    case 'running':
      return t(deployMsg.statusRunning)
    case 'success':
      return t(deployMsg.statusSuccess)
    case 'failed':
      return t(deployMsg.statusFailed)
    case 'cancelled':
      return t(deployMsg.statusCancelled)
  }
}

function PipelineRow({ pipeline }: { pipeline: Pipeline }) {
  const completedStages = pipeline.stages.filter(
    (s) => s.status === 'success' || s.status === 'failed',
  ).length
  const progress =
    pipeline.stages.length > 0 ? Math.round((completedStages / pipeline.stages.length) * 100) : 0

  return (
    <div className={styles['row']}>
      <div className={styles['info']}>
        <span className={styles['name']}>{pipeline.name}</span>
        <div className={styles['meta']}>
          <span>
            {t(deployMsg.labelBranch)}: {pipeline.branch}
          </span>
          <span>
            {t(deployMsg.labelCommit)}: <code>{pipeline.commit}</code>
          </span>
        </div>
        {pipeline.status === 'running' && (
          <ProgressBar value={progress} label={t(deployMsg.statusRunning)} size="sm" />
        )}
        <div className={styles['stages']} aria-label={t(deployMsg.labelStages)}>
          {pipeline.stages.map((stage) => (
            <span key={stage.id} data-status={stage.status} className={styles['stage']}>
              {stage.name}
            </span>
          ))}
        </div>
      </div>
      <span data-status={pipeline.status} className={styles['statusBadge']}>
        {statusLabel(pipeline.status)}
      </span>
    </div>
  )
}

export function PipelineList() {
  useSignals()
  const isLoading = loading.value
  const data = pipelines.value

  if (isLoading) {
    return (
      <div className={styles['root']}>
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} variant="rect" height="5rem" />
        ))}
      </div>
    )
  }

  return (
    <div className={styles['root']}>
      {data.map((p) => (
        <PipelineRow key={p.id} pipeline={p} />
      ))}
    </div>
  )
}
