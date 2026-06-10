'use client'
import { cn } from '@cascade-ui/core'
import type { ReactNode } from 'react'
import styles from './page-header.module.css'

export interface PageHeaderProps {
  title: string
  description?: string
  breadcrumb?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, breadcrumb, actions, className }: PageHeaderProps) {
  return (
    <header className={cn(styles['header'], className)}>
      {breadcrumb && <div className={styles['breadcrumb']}>{breadcrumb}</div>}
      <div className={styles['row']}>
        <h1 className={styles['title']}>{title}</h1>
        {actions && <div className={styles['actions']}>{actions}</div>}
      </div>
      {description && <p className={styles['description']}>{description}</p>}
    </header>
  )
}
