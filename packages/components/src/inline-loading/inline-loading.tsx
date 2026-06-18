'use client'
import { cn } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import type { HTMLAttributes, ReactNode } from 'react'
import { Spinner } from '../spinner/spinner'
import styles from './inline-loading.module.css'

export type InlineLoadingStatus = 'inactive' | 'active' | 'finished' | 'error'

export interface InlineLoadingProps extends HTMLAttributes<HTMLDivElement> {
  status: InlineLoadingStatus
  label?: ReactNode
  labels?: {
    active?: string
    finished?: string
    error?: string
  }
}

function defaultLabel(status: InlineLoadingStatus, labels?: InlineLoadingProps['labels']): string {
  switch (status) {
    case 'active':
      return labels?.active ?? t(builtin.inlineLoading.active)
    case 'finished':
      return labels?.finished ?? t(builtin.inlineLoading.finished)
    case 'error':
      return labels?.error ?? t(builtin.inlineLoading.error)
    default:
      return ''
  }
}

function StatusIcon({ status }: { status: InlineLoadingStatus }) {
  if (status === 'active') {
    return <Spinner size="sm" className={styles['spinner']} />
  }
  if (status === 'finished') {
    return (
      <svg
        className={styles['icon']}
        viewBox="0 0 16 16"
        width="16"
        height="16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3.5 8.5l3 3 6-7"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  if (status === 'error') {
    return (
      <svg
        className={styles['icon']}
        viewBox="0 0 16 16"
        width="16"
        height="16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M8 4.5v4M8 11h.01"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  }
  return null
}

export function InlineLoading({ status, label, labels, className, ...props }: InlineLoadingProps) {
  const resolvedLabel = label ?? defaultLabel(status, labels)

  return (
    <div
      role="status"
      aria-live="polite"
      data-status={status}
      className={cn(styles['inline-loading'], className as string | undefined)}
      {...props}
    >
      <span className={styles['indicator']} aria-hidden="true">
        <StatusIcon status={status} />
      </span>
      {resolvedLabel && <span className={styles['label']}>{resolvedLabel}</span>}
    </div>
  )
}
