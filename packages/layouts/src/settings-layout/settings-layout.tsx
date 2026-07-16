'use client'
import { cn } from '@cascivo/core'
import type { ReactNode } from 'react'
import styles from './settings-layout.module.css'

export interface SettingsLayoutProps {
  menu: ReactNode
  children: ReactNode
  className?: string
}

export function SettingsLayout({ menu, children, className }: SettingsLayoutProps) {
  // Outer element establishes the query container; the inner `.layout` grid hosts the
  // `@container` collapse rule, which can only resolve against an ancestor container.
  return (
    <div className={cn(styles['layout-container'], className)}>
      <div className={styles['layout']}>
        <div className={styles['menu']}>{menu}</div>
        <div className={styles['content']}>{children}</div>
      </div>
    </div>
  )
}
