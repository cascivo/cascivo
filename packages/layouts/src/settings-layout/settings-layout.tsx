'use client'
import { cn } from '@cascade-ui/core'
import type { ReactNode } from 'react'
import styles from './settings-layout.module.css'

export interface SettingsLayoutProps {
  menu: ReactNode
  children: ReactNode
  className?: string
}

export function SettingsLayout({ menu, children, className }: SettingsLayoutProps) {
  return (
    <div className={cn(styles['layout'], className)}>
      <div className={styles['menu']}>{menu}</div>
      <div className={styles['content']}>{children}</div>
    </div>
  )
}
