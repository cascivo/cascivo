import { cn } from '@cascivo/core/pure'
import { builtin, t } from '@cascivo/i18n'
import type { HTMLAttributes, ReactNode } from 'react'
import { ShimmerText } from '../shimmer-text/shimmer-text'
import styles from './reasoning.module.css'

export interface ReasoningProps extends HTMLAttributes<HTMLDetailsElement> {
  children: ReactNode
  /**
   * True while reasoning is still arriving: the panel opens, the trigger shimmers
   * "Thinking…" and the content is aria-busy. Turning it off closes the panel.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  streaming?: boolean
  duration?: number
  label?: ReactNode
  labels?: {
    thinking?: string
    thoughtFor?: string
    label?: string
  }
}

export function Reasoning({
  children,
  streaming = false,
  duration,
  label,
  labels,
  className,
  ...props
}: ReasoningProps) {
  const settled =
    duration === undefined
      ? (labels?.label ?? t(builtin.reasoning.label))
      : (labels?.thoughtFor?.replace('{count}', String(duration)) ??
        t(builtin.reasoning.thoughtFor, { count: duration }))

  return (
    <details
      // Open while streaming and closed when it ends; between those edges the reader's own
      // toggling is left alone, because React only re-applies `open` when the prop changes.
      open={streaming || undefined}
      data-streaming={streaming ? '' : undefined}
      className={cn(styles['reasoning'], className as string | undefined)}
      {...props}
    >
      <summary className={styles['trigger']}>
        <span className={styles['glyph']} aria-hidden="true">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M8 1c.6 3.9 3.1 6.4 7 7-3.9.6-6.4 3.1-7 7-.6-3.9-3.1-6.4-7-7 3.9-.6 6.4-3.1 7-7Z" />
          </svg>
        </span>
        <span className={styles['label']}>
          {label ??
            (streaming ? (
              <ShimmerText>{labels?.thinking ?? t(builtin.reasoning.thinking)}</ShimmerText>
            ) : (
              settled
            ))}
        </span>
        <span className={styles['indicator']} aria-hidden="true" />
      </summary>
      <div className={styles['content']} aria-busy={streaming || undefined}>
        {children}
      </div>
    </details>
  )
}
