'use client'
import { cn } from '@cascivo/core'
import type { HTMLAttributes, ReactNode } from 'react'
import styles from './data-list.module.css'

export interface DataListItem {
  id?: string
  label: ReactNode
  value: ReactNode
}

export interface DataListProps extends HTMLAttributes<HTMLDListElement> {
  items: DataListItem[]
  orientation?: 'horizontal' | 'vertical'
  dividers?: boolean
  size?: 'sm' | 'md'
}

export function DataList({
  items,
  orientation = 'horizontal',
  dividers = false,
  size = 'md',
  className,
  ...props
}: DataListProps) {
  return (
    <dl
      data-orientation={orientation}
      data-size={size}
      data-dividers={dividers ? '' : undefined}
      className={cn(styles['list'], className as string | undefined)}
      {...props}
    >
      {items.map((item, i) => (
        <div key={item.id ?? i} className={styles['row']}>
          <dt className={styles['term']}>{item.label}</dt>
          <dd className={styles['detail']}>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
