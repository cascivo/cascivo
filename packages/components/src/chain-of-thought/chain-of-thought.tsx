import { cn, normalizeProgress } from '@cascivo/core/pure'
import type { Progress, ProgressInput } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import type { HTMLAttributes, ReactNode } from 'react'
import { ShimmerText } from '../shimmer-text/shimmer-text'
import { VisuallyHidden } from '../visually-hidden/visually-hidden'
import styles from './chain-of-thought.module.css'

export interface ChainOfThoughtItem {
  id: string
  title: ReactNode
  description?: ReactNode
  /**
   * Where this step is. Takes the catalog-wide `Progress` vocabulary
   * (`pending | active | complete | error`, plus the `current` / `upcoming` aliases), so one
   * status enum drives `ChainOfThought`, `Timeline` and `Steps`.
   */
  status?: ProgressInput
  /** Collapsible detail — search results, a file list, tool output. Makes the title a toggle. */
  detail?: ReactNode
  icon?: ReactNode
}

export interface ChainOfThoughtProps extends HTMLAttributes<HTMLOListElement> {
  items: ChainOfThoughtItem[]
  labels?: {
    pending?: string
    active?: string
    complete?: string
    error?: string
  }
}

function statusLabel(progress: Progress, labels: ChainOfThoughtProps['labels']): string {
  switch (progress) {
    case 'pending':
      return labels?.pending ?? t(builtin.chainOfThought.pending)
    case 'active':
      return labels?.active ?? t(builtin.chainOfThought.active)
    case 'complete':
      return labels?.complete ?? t(builtin.chainOfThought.complete)
    case 'error':
      return labels?.error ?? t(builtin.chainOfThought.error)
  }
}

function StepGlyph({ progress }: { progress: Progress }) {
  if (progress === 'active') {
    return (
      <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
        <path d="M8 1c.6 3.9 3.1 6.4 7 7-3.9.6-6.4 3.1-7 7-.6-3.9-3.1-6.4-7-7 3.9-.6 6.4-3.1 7-7Z" />
      </svg>
    )
  }
  if (progress === 'complete') {
    return (
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
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
  if (progress === 'error') {
    return (
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
        <path
          d="M4.5 4.5l7 7M11.5 4.5l-7 7"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
      <circle cx="8" cy="8" r="4.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function ChainOfThought({ items, labels, className, ...props }: ChainOfThoughtProps) {
  const busy = items.some((item) => normalizeProgress(item.status ?? 'pending') === 'active')

  return (
    <ol
      aria-busy={busy || undefined}
      className={cn(styles['chain'], className as string | undefined)}
      {...props}
    >
      {items.map((item) => {
        const progress = normalizeProgress(item.status ?? 'pending')
        const heading = (
          <>
            <span className={styles['title']}>
              {progress === 'active' ? <ShimmerText>{item.title}</ShimmerText> : item.title}
            </span>
            {/* The marker is decorative, so the step's state is spoken as text. */}
            <VisuallyHidden>{`, ${statusLabel(progress, labels)}`}</VisuallyHidden>
          </>
        )

        return (
          <li
            key={item.id}
            data-status={progress}
            aria-current={progress === 'active' ? 'step' : undefined}
            className={styles['step']}
          >
            <span className={styles['marker']} aria-hidden="true">
              {item.icon ?? <StepGlyph progress={progress} />}
            </span>
            <div className={styles['body']}>
              {item.detail ? (
                <details className={styles['disclosure']}>
                  <summary className={styles['summary']}>
                    {heading}
                    <span className={styles['indicator']} aria-hidden="true" />
                  </summary>
                  {item.description ? (
                    <div className={styles['description']}>{item.description}</div>
                  ) : null}
                  <div className={styles['detail']}>{item.detail}</div>
                </details>
              ) : (
                <>
                  <div className={styles['heading']}>{heading}</div>
                  {item.description ? (
                    <div className={styles['description']}>{item.description}</div>
                  ) : null}
                </>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
