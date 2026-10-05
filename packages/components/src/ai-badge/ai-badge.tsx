import { cn } from '@cascivo/core/pure'
import { builtin, t } from '@cascivo/i18n'
import type { ReactNode } from 'react'
import { IconButton } from '../icon-button/icon-button'
import { Toggletip } from '../toggletip/toggletip'
import { VisuallyHidden } from '../visually-hidden/visually-hidden'
import styles from './ai-badge.module.css'

export interface AiBadgeProps {
  children?: ReactNode
  /**
   * The person has changed the AI’s output. The AI mark gives way to a revert button when
   * `onRevert` is set, and to nothing otherwise — edited content is no longer AI-generated.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  edited?: boolean
  onRevert?: () => void
  labels?: {
    text?: string
    explain?: string
    description?: string
    revert?: string
  }
  className?: string
}

export function AiBadge({ children, edited = false, onRevert, labels, className }: AiBadgeProps) {
  const text = labels?.text ?? t(builtin.aiBadge.text)
  const explain = labels?.explain ?? t(builtin.aiBadge.explain)

  // Once a person has edited the AI's output it is theirs, so the AI mark gives way to a way
  // back to the AI version (Carbon's revert state) — or to nothing, if there is no way back.
  if (edited) {
    if (!onRevert) return null
    return (
      <IconButton
        size="sm"
        className={cn(styles['revert'], className)}
        ariaLabel={labels?.revert ?? t(builtin.aiBadge.revert)}
        icon={
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
            <path
              d="M5 6.5h5.5a3 3 0 0 1 0 6H8M7.5 4 5 6.5 7.5 9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
        onClick={onRevert}
      />
    )
  }

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
