import { cn } from '@cascivo/core/pure'
import { builtin, t } from '@cascivo/i18n'
import type { HTMLAttributes, ReactNode } from 'react'
import { Button } from '../button/button'
import { ShimmerText } from '../shimmer-text/shimmer-text'
import styles from './ai-status.module.css'

export type AiStatusValue = 'thinking' | 'generating' | 'complete' | 'error' | 'stopped'

export interface AiStatusProps extends HTMLAttributes<HTMLDivElement> {
  status: AiStatusValue
  label?: ReactNode
  labels?: {
    thinking?: string
    generating?: string
    complete?: string
    error?: string
    stopped?: string
    stop?: string
  }
  onStop?: () => void
}

function defaultLabel(status: AiStatusValue, labels: AiStatusProps['labels']): string {
  switch (status) {
    case 'thinking':
      return labels?.thinking ?? t(builtin.aiStatus.thinking)
    case 'generating':
      return labels?.generating ?? t(builtin.aiStatus.generating)
    case 'complete':
      return labels?.complete ?? t(builtin.aiStatus.complete)
    case 'error':
      return labels?.error ?? t(builtin.aiStatus.error)
    case 'stopped':
      return labels?.stopped ?? t(builtin.aiStatus.stopped)
  }
}

function StatusGlyph({ status }: { status: AiStatusValue }) {
  if (status === 'thinking' || status === 'generating') {
    return (
      <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
        <path d="M8 1c.6 3.9 3.1 6.4 7 7-3.9.6-6.4 3.1-7 7-.6-3.9-3.1-6.4-7-7 3.9-.6 6.4-3.1 7-7Z" />
      </svg>
    )
  }
  if (status === 'complete') {
    return (
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
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
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
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
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
      <rect x="5.5" y="5.5" width="5" height="5" rx="1" fill="currentColor" />
    </svg>
  )
}

export function AiStatus({ status, label, labels, onStop, className, ...props }: AiStatusProps) {
  const active = status === 'thinking' || status === 'generating'
  const text = label ?? defaultLabel(status, labels)

  return (
    <div
      data-status={status}
      className={cn(styles['ai-status'], className as string | undefined)}
      {...props}
    >
      <span className={styles['glyph']} aria-hidden="true">
        <StatusGlyph status={status} />
      </span>
      {/* The status node holds one stable string per phase, so a phase change is announced
          once; the Stop button sits outside it so pressing Stop does not re-announce. */}
      <span role="status" className={styles['label']}>
        {active ? <ShimmerText>{text}</ShimmerText> : text}
      </span>
      {active && onStop && (
        <Button variant="ghost" size="sm" className={styles['stop']} onClick={onStop}>
          {labels?.stop ?? t(builtin.aiStatus.stop)}
        </Button>
      )}
    </div>
  )
}
