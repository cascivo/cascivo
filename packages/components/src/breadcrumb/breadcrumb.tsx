'use client'
import { cn } from '@cascade-ui/core'
import styles from './breadcrumb.module.css'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  maxVisible?: number
  className?: string
  /** Accessible label for the nav landmark */
  ariaLabel?: string
}

export function Breadcrumb({
  items,
  maxVisible,
  className,
  ariaLabel = 'Breadcrumb',
}: BreadcrumbProps) {
  let visible = items
  const first = items[0]
  if (first !== undefined && maxVisible !== undefined && items.length > maxVisible) {
    visible = [first, { label: '…' }, ...items.slice(items.length - (maxVisible - 2))]
  }

  return (
    <nav aria-label={ariaLabel} className={cn(styles['breadcrumb'], className)}>
      <ol>
        {visible.map((item, index) => {
          const isLast = index === visible.length - 1
          return (
            <li key={`${index}-${item.label}`}>
              {isLast ? (
                <span aria-current="page">{item.label}</span>
              ) : item.href !== undefined ? (
                <a href={item.href}>{item.label}</a>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
