'use client'
import { cn, normalizeProgress, type ProgressInput } from '@cascivo/core'
import type { HTMLAttributes, ReactNode } from 'react'
import styles from './timeline.module.css'

/** Canonical progress → the value Timeline's stylesheet keys on. */
const STATUS_CLASS: Record<string, string> = {
  pending: 'upcoming',
  active: 'current',
  complete: 'complete',
  error: 'current',
}

export interface TimelineItem {
  id: string
  title: ReactNode
  description?: ReactNode
  time?: string
  icon?: ReactNode
  /**
   * Where this entry sits in the sequence. Accepts the catalog-wide `Progress` vocabulary
   * (`pending | active | complete | error`) as well as Timeline's own `current` / `upcoming`
   * — they are aliases of `active` / `pending`, so one status enum drives both `Timeline`
   * and `Steps` with no translation.
   */
  status?: ProgressInput
}

export interface TimelineProps extends HTMLAttributes<HTMLOListElement> {
  items: TimelineItem[]
  /**
   * Layout orientation of the component.
   *
   * @defaultValue `vertical`
   * @see the component manifest
   */
  orientation?: 'vertical' | 'horizontal'
}

export function Timeline({ items, orientation = 'vertical', className, ...props }: TimelineProps) {
  return (
    <ol
      data-orientation={orientation}
      className={cn(styles['list'], className as string | undefined)}
      {...props}
    >
      {items.map((item) => (
        <li
          key={item.id}
          data-status={STATUS_CLASS[normalizeProgress(item.status ?? 'pending')] ?? 'upcoming'}
          aria-current={
            normalizeProgress(item.status ?? 'pending') === 'active' ? 'step' : undefined
          }
          className={styles['item']}
        >
          <span className={styles['marker']} aria-hidden="true">
            {item.icon}
          </span>
          <div className={styles['content']}>
            <div className={styles['title']}>{item.title}</div>
            {item.time ? <time className={styles['time']}>{item.time}</time> : null}
            {item.description ? (
              <div className={styles['description']}>{item.description}</div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
