import { cn } from '@cascivo/core/pure'
import { builtin, t } from '@cascivo/i18n'
import type { HTMLAttributes } from 'react'
import styles from './typing-indicator.module.css'

export interface TypingIndicatorProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Accessible name announced by the status region.
   *
   * @defaultValue `Assistant is typing`
   * @see the component manifest
   */
  ariaLabel?: string
  label?: string
}

export function TypingIndicator({ ariaLabel, label, className, ...props }: TypingIndicatorProps) {
  return (
    <span
      role="status"
      aria-label={ariaLabel ?? label ?? t(builtin.typingIndicator.label)}
      className={cn(styles['typing-indicator'], className as string | undefined)}
      {...props}
    >
      <span className={styles['dot']} aria-hidden="true" />
      <span className={styles['dot']} aria-hidden="true" />
      <span className={styles['dot']} aria-hidden="true" />
    </span>
  )
}
