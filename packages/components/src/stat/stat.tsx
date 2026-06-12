'use client'
import { cn } from '@cascade-ui/core'
import type { HTMLAttributes } from 'react'
import styles from './stat.module.css'

export interface StatProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  delta?: string
  trend?: 'up' | 'down' | 'flat'
  helpText?: string
}

export function Stat({
  label,
  value,
  delta,
  trend = 'flat',
  helpText,
  className,
  ...props
}: StatProps) {
  return (
    <div className={cn(styles['stat'], className)} {...props}>
      <span className={styles['label']}>{label}</span>
      <span className={styles['value']}>{value}</span>
      {delta && (
        <span data-trend={trend} className={styles['delta']}>
          <span aria-hidden="true" className={styles['arrow']}>
            {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '–'}
          </span>
          {delta}
        </span>
      )}
      {helpText && <span className={styles['help']}>{helpText}</span>}
    </div>
  )
}
