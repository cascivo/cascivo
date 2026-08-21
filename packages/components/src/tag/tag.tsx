'use client'
import { cn, normalizeTone, useSignals } from '@cascivo/core'
import type { ToneInput } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import type { HTMLAttributes } from 'react'
import styles from './tag.module.css'

/** Canonical tone → the value Tag's stylesheet keys on. */
const TONE_CLASS: Record<string, string> = {
  neutral: 'default',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'error',
}

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Severity tone. Accepts the catalog-wide `Tone` vocabulary (`neutral | info | success |
   * warning | danger`) plus Tag's historical spellings (`default` → neutral,
   * `error`/`destructive` → danger).
   *
   * @defaultValue `default`
   * @see the component manifest
   */
  variant?: ToneInput
  size?: 'sm' | 'md'
  onDismiss?: () => void
  /**
   * Accessible label for the dismiss button.
   *
   * @defaultValue `Remove`
   * @see the component manifest
   */
  dismissLabel?: string
}

export function Tag({
  variant = 'default',
  size = 'md',
  onDismiss,
  dismissLabel,
  className,
  children,
  ...props
}: TagProps) {
  useSignals()
  const resolvedDismissLabel = dismissLabel ?? t(builtin.tag.dismiss)
  return (
    <span
      data-variant={TONE_CLASS[normalizeTone(variant)] ?? variant}
      data-size={size}
      className={cn(styles['tag'], className)}
      {...props}
    >
      {children}
      {onDismiss && (
        <button
          type="button"
          className={styles['dismiss']}
          aria-label={resolvedDismissLabel}
          onClick={onDismiss}
        >
          ✕
        </button>
      )}
    </span>
  )
}
