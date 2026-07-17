'use client'
import { cn } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { Children } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
import { Avatar } from '../avatar/avatar'
import styles from './avatar-group.module.css'

export interface AvatarGroupLabels {
  /** Accessible label for the +N overflow chip. */
  more?: (count: number) => string
}

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Cap the number of visible avatars; the rest collapse into a +N chip. */
  max?: number
  /** Override the total count used for the +N chip (when more exist than rendered). */
  total?: number
  /** Overlap amount. */
  spacing?: 'sm' | 'md' | 'lg'
  /** Wrap into a grid instead of an overlapping row. */
  isGrid?: boolean
  labels?: AvatarGroupLabels
  /** The <Avatar> children. */
  children?: ReactNode
}

/** Overlapping stack of avatars with a `max` cap and an i18n-labelled +N overflow chip. */
export function AvatarGroup({
  max,
  total,
  spacing = 'md',
  isGrid = false,
  labels,
  className,
  children,
  ...rest
}: AvatarGroupProps) {
  const items = Children.toArray(children)
  const visible = max != null ? items.slice(0, max) : items
  const count = total ?? items.length
  const overflow = count - visible.length
  const moreLabel = labels?.more?.(overflow) ?? t(builtin.avatarGroup.more, { count: overflow })

  return (
    <div
      role="group"
      data-spacing={spacing}
      data-grid={isGrid || undefined}
      className={cn(styles['group'], className)}
      {...rest}
    >
      {visible}
      {overflow > 0 && (
        <Avatar className={styles['overflow']} fallback={`+${overflow}`} aria-label={moreLabel} />
      )}
    </div>
  )
}
