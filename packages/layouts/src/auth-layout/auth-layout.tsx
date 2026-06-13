'use client'
import { cn } from '@cascivo/core'
import type { ReactNode } from 'react'
import styles from './auth-layout.module.css'

export interface AuthLayoutProps {
  children: ReactNode
  logo?: ReactNode
  className?: string
}

export function AuthLayout({ children, logo, className }: AuthLayoutProps) {
  return (
    <div className={cn(styles['layout'], className)}>
      <div className={styles['card']}>
        {logo && <div className={styles['logo']}>{logo}</div>}
        {children}
      </div>
    </div>
  )
}
