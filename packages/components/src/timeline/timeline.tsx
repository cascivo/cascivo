'use client'
import { cn } from '@cascivo/core'
import type { HTMLAttributes, ReactNode } from 'react'
import styles from './timeline.module.css'

export interface TimelineItem {
  id: string
  title: ReactNode
  description?: ReactNode
  time?: string
  icon?: ReactNode
  status?: 'complete' | 'current' | 'upcoming'
}

export interface TimelineProps extends HTMLAttributes<HTMLOListElement> {
  items: TimelineItem[]
  orientation?: 'vertical' | 'horizontal'
}

export function Timeline({ items, orientation = 'vertical', className, ...props }: TimelineProps) {
  return (
    <ol data-orientation={orientation} className={cn(styles['list'], className)} {...props}>
      {items.map((item) => (
        <li
          key={item.id}
          data-status={item.status ?? 'upcoming'}
          aria-current={item.status === 'current' ? 'step' : undefined}
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
