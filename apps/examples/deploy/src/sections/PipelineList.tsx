'use client'
import { t } from '@cascivo/i18n'
import type { DeployStatus, Pipeline } from '@cascivo/example-kit'
import { deployMsg } from '../i18n'
import { pipelines } from '../data/fixtures'
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
  return (
    <div className={styles['root']}>
      {pipelines.map((p) => (
        <PipelineRow key={p.id} pipeline={p} />
      ))}
    </div>
  )
}
