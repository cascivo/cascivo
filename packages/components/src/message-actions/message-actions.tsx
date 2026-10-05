'use client'
import { announce, cn, useControllableSignal, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import type { HTMLAttributes } from 'react'
import { CopyButton } from '../copy-button/copy-button'
import { IconButton } from '../icon-button/icon-button'
import styles from './message-actions.module.css'

export type MessageFeedback = 'good' | 'bad'

export interface MessageActionsProps extends HTMLAttributes<HTMLDivElement> {
  copyValue?: string
  feedback?: MessageFeedback | null
  /**
   * Initial rating when uncontrolled.
   *
   * @defaultValue `null`
   * @see the component manifest
   */
  defaultFeedback?: MessageFeedback | null
  onFeedbackChange?: (feedback: MessageFeedback | null) => void
  onRegenerate?: () => void
  labels?: {
    group?: string
    good?: string
    bad?: string
    regenerate?: string
    recorded?: string
  }
}

function Thumb({ down }: { down?: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      className={down ? styles['down'] : undefined}
    >
      <path
        d="M5 7v6.5H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h2Zm0 0 2.6-4.6a1.2 1.2 0 0 1 2.2.8L9.4 6H13a1.3 1.3 0 0 1 1.3 1.5l-.8 4.8a1.5 1.5 0 0 1-1.5 1.2H5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function MessageActions({
  copyValue,
  feedback,
  defaultFeedback = null,
  onFeedbackChange,
  onRegenerate,
  labels,
  className,
  ...props
}: MessageActionsProps) {
  useSignals()
  const [current, setCurrent] = useControllableSignal<MessageFeedback | null>({
    ...(feedback !== undefined && { value: feedback }),
    defaultValue: defaultFeedback,
    ...(onFeedbackChange && { onChange: onFeedbackChange }),
  })
  const recorded = labels?.recorded ?? t(builtin.messageActions.recorded)

  // Pressing the active rating again clears it, like any toggle button.
  const rate = (value: MessageFeedback) => {
    const next = current.value === value ? null : value
    setCurrent(next)
    if (next) announce(recorded)
  }

  return (
    <div
      role="group"
      aria-label={labels?.group ?? t(builtin.messageActions.group)}
      className={cn(styles['actions'], className as string | undefined)}
      {...props}
    >
      {copyValue !== undefined && <CopyButton value={copyValue} size="sm" />}
      {onFeedbackChange !== undefined || feedback !== undefined ? (
        <>
          <IconButton
            size="sm"
            ariaLabel={labels?.good ?? t(builtin.messageActions.good)}
            aria-pressed={current.value === 'good'}
            data-active={current.value === 'good' || undefined}
            className={styles['rate']}
            icon={<Thumb />}
            onClick={() => rate('good')}
          />
          <IconButton
            size="sm"
            ariaLabel={labels?.bad ?? t(builtin.messageActions.bad)}
            aria-pressed={current.value === 'bad'}
            data-active={current.value === 'bad' || undefined}
            className={styles['rate']}
            icon={<Thumb down />}
            onClick={() => rate('bad')}
          />
        </>
      ) : null}
      {onRegenerate && (
        <IconButton
          size="sm"
          ariaLabel={labels?.regenerate ?? t(builtin.messageActions.regenerate)}
          icon={
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
              <path
                d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5v2.5h-2.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          onClick={onRegenerate}
        />
      )}
    </div>
  )
}
