'use client'
import { useSignals } from '@cascade-ui/core'
import { builtin, t } from '@cascade-ui/i18n'
import styles from './ai-label.module.css'
import type { HTMLAttributes } from 'react'

export type AiLabelVariant = 'generating' | 'done' | 'error'

export interface AiLabelProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: AiLabelVariant
}

export function AiLabel({ variant = 'generating', className, ...props }: AiLabelProps) {
  useSignals()
  const label = variant === 'generating' ? t(builtin.ai.generating)
    : variant === 'done' ? t(builtin.ai.done)
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
