import { cn } from '@cascivo/core/pure'
import { builtin, t } from '@cascivo/i18n'
import type { ReactNode } from 'react'
import { Toggletip } from '../toggletip/toggletip'
import { VisuallyHidden } from '../visually-hidden/visually-hidden'
import styles from './ai-badge.module.css'

export interface AiBadgeProps {
  children?: ReactNode
  labels?: {
    text?: string
    explain?: string
    description?: string
  }
  className?: string
}

export function AiBadge({ children, labels, className }: AiBadgeProps) {
  const text = labels?.text ?? t(builtin.aiBadge.text)
  const explain = labels?.explain ?? t(builtin.aiBadge.explain)

  if (children === undefined || children === null) {
    return (
      <span className={cn(styles['badge'], className)}>
        <span aria-hidden="true">{text}</span>
        <VisuallyHidden>{labels?.description ?? t(builtin.aiBadge.description)}</VisuallyHidden>
      </span>
    )
  }

  return (
    <Toggletip
      className={cn(styles['root'], className)}
      trigger={<span className={styles['badge']}>{text}</span>}
      // The accessible name starts with the visible text (WCAG 2.5.3 Label in Name).
      labels={{ label: `${text} ${explain}` }}
    >
      {children}
    </Toggletip>
  )
}
