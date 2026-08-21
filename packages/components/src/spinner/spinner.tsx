'use client'
import { cn, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import type { HTMLAttributes } from 'react'
import styles from './spinner.module.css'

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg'
  /**
   * Accessible label announced by screen readers
   *
   * @defaultValue `Loading`
   * @see the component manifest
   */
  label?: string
  /**
   * Alias of `label` — the same invisible accessible name under the catalog's own spelling.
   *
   * `ariaLabel` is what the catalog calls a name nothing paints, so it is the guess an agent
   * makes after reading one other component (2026-08-21 report item 1). This component
   * predates the convention and shipped `label`; both work and neither is deprecated.
   */
  ariaLabel?: string
}

export function Spinner({ size = 'md', label, ariaLabel, className, ...props }: SpinnerProps) {
  useSignals()
  const resolvedLabel = ariaLabel ?? label ?? t(builtin.spinner.label)
  return (
    <span
      role="status"
      aria-label={resolvedLabel}
      data-size={size}
      className={cn(styles['spinner'], className as string | undefined)}
      {...props}
    />
  )
}
