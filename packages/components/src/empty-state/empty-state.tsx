'use client'
import { cn } from '@cascade-ui/core'
import type { HTMLAttributes, ReactNode } from 'react'
import styles from './empty-state.module.css'

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  size?: 'md' | 'lg'
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div data-size={size} className={cn(styles['empty-state'], className)} {...props}>
      {icon && (
        <span className={styles['icon']} aria-hidden="true">
          {icon}
        </span>
      )}
      <h3 className={styles['title']}>{title}</h3>
      {description && <p className={styles['description']}>{description}</p>}
      {action && <div className={styles['action']}>{action}</div>}
    </div>
  )
}
