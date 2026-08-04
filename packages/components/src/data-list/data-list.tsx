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
   * Layout orientation of the component.
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
