'use client'
import { useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import styles from './ai-label.module.css'
import type { HTMLAttributes } from 'react'

export type AiLabelVariant = 'generating' | 'done' | 'error'

/** @deprecated Use `AiStatus`'s `AiStatusValue` (`'generating' | 'complete' | 'error'`, plus `'thinking'` and `'stopped'`). Since 1.7.0; removed in 2.0.0. */
export interface AiLabelProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: AiLabelVariant
}

/**
 * @deprecated Use `AiStatus` from `@cascivo/react` (or `cascivo add ai-status`). It covers
 * the same generating / done / error states, adds `thinking` and `stopped` and an optional
 * Stop button, and is announced the same way. Map `variant="done"` to `status="complete"`.
 * Since 1.7.0; removed in 2.0.0.
 */
export function AiLabel({ variant = 'generating', className, ...props }: AiLabelProps) {
  useSignals()
  const label =
    variant === 'generating'
      ? t(builtin.ai.generating)
      : variant === 'done'
        ? t(builtin.ai.done)
        : t(builtin.ai.error)

  return (
    <span
      role="status"
      aria-label={label}
      data-variant={variant}
      className={[styles.root, className].filter(Boolean).join(' ')}
      {...props}
    >
      {label}
    </span>
  )
}
