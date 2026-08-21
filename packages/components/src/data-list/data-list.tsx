import { cn } from '@cascivo/core/pure'
import type { HTMLAttributes, ReactNode } from 'react'
import styles from './data-list.module.css'

export interface DataListItem {
  id?: string
  label: ReactNode
  value: ReactNode
}

export interface DataListProps extends HTMLAttributes<HTMLDListElement> {
  items: DataListItem[]
  /**
   * Where each **value** sits relative to its own label — not the axis of the list.
   *
   * `'horizontal'` puts the value beside its label; `'vertical'` puts it underneath. Items
   * are stacked vertically either way, which is the part the name does not say: an adopter
   * read `orientation="vertical"` as "lay the items out vertically" and got a very tall
   * block from six rows (2026-08-21 report item 9). In a summary card, prefer
   * `'horizontal'`.
   *
   * @defaultValue `horizontal`
   * @see the component manifest
   */
  orientation?: 'horizontal' | 'vertical'
  /**
   * When true, shows dividers between items.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
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
