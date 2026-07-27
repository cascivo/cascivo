'use client'
import { cn, normalizeTone, type ToneInput } from '@cascivo/core'
import type { HTMLAttributes } from 'react'
import styles from './badge.module.css'

/** Badge-only looks that aren't a severity tone. */
type BadgeShape = 'secondary' | 'outline' | 'primary'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Severity tone or badge-specific look. Accepts the catalog-wide `Tone` vocabulary
   * (`neutral | info | success | warning | danger`) as well as Badge's historical spellings
   * (`default`, `destructive`, `error`) — they are aliases of the same tones, so one domain
   * enum can drive `Badge`, `Tag`, `Status` and `Notification` with no lookup table.
   */
  variant?: ToneInput | BadgeShape
  size?: 'sm' | 'md'
}

/** Canonical tone → the value Badge's stylesheet keys on. */
const TONE_CLASS: Record<string, string> = {
  neutral: 'default',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'destructive',
}

export function Badge({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      data-variant={TONE_CLASS[normalizeTone(variant)] ?? variant}
      data-size={size}
      className={cn(styles['badge'], className)}
      {...props}
    >
      {children}
    </span>
  )
}
