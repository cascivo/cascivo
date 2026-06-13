'use client'
import { cn } from '@cascivo/core'
import type { ReactNode } from 'react'
import styles from './dashboard-layout.module.css'

export interface DashboardLayoutProps {
  stats?: ReactNode
  main: ReactNode
  aside?: ReactNode
  className?: string | undefined
}

export function DashboardLayout({ stats, main, aside, className }: DashboardLayoutProps) {
  return (
    <div className={cn(styles['layout'], className)}>
      {stats && <div className={styles['stats']}>{stats}</div>}
      <div className={styles['body']}>
        <div className={styles['main']}>{main}</div>
        {aside && <div className={styles['aside']}>{aside}</div>}
      </div>
    </div>
  )
}
