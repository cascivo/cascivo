'use client'
import { cn } from '@cascade-ui/core'
import { Sparkline } from '@cascade-ui/charts'
import type { HTMLAttributes } from 'react'
import { AutoGrid } from '../../auto-grid/auto-grid'
import styles from './stats-band.module.css'

export interface StatItem {
  label: string
  value: string
  delta?: string
  trend?: readonly number[]
}

export interface StatsBandProps extends HTMLAttributes<HTMLElement> {
  stats: StatItem[]
  /** Accessible label for the stats region when no visible heading is shown. */
  'aria-label'?: string
}

export function StatsBand({ stats, className, ...props }: StatsBandProps) {
  return (
    <section
      className={cn(styles['stats-band'], className)}
      aria-label={props['aria-label'] ?? 'Key metrics'}
      {...props}
    >
      <div className={styles['inner']}>
        <AutoGrid min="12rem" gap={4}>
          {stats.map((stat, i) => (
            <div key={i} className={styles['stat']}>
              <div className={styles['stat-main']}>
                <span className={styles['value']}>{stat.value}</span>
                {stat.trend && (
                  <Sparkline
                    data={stat.trend}
                    label={`${stat.label} trend`}
                    width={80}
                    height={28}
                  />
                )}
              </div>
              {stat.delta && <span className={styles['delta']}>{stat.delta}</span>}
              <span className={styles['label']}>{stat.label}</span>
            </div>
          ))}
        </AutoGrid>
      </div>
    </section>
  )
}
