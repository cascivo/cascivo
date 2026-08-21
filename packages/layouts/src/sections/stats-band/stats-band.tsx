import { cn } from '@cascivo/core/pure'
import { Sparkline } from '@cascivo/charts'
import type { HTMLAttributes } from 'react'
import { AutoGrid } from '../../auto-grid/auto-grid'
import styles from './stats-band.module.css'

export interface StatItem {
  label: string
  value: string
  delta?: string
  trend?: number[]
}

export interface StatsBandProps extends HTMLAttributes<HTMLElement> {
  stats: StatItem[]
  /** Accessible label for the stats region when no visible heading is shown. */
  /**
   * Invisible accessible name. The catalog convention (see the item-identity table in
   * `docs/AI-RULES.md`); `aria-label` is accepted as an alias for the DOM spelling.
   */
  ariaLabel?: string
  /**
   * Alias of `ariaLabel` — same invisible accessible name, the other spelling. Not rendered.
   *
   * `ariaLabel` is the catalog convention and stays preferred, but `label` is the guess an
   * adopter makes when they have not read the convention, and an unaccepted guess costs a
   * compile cycle for nothing (2026-08-21 report item 1). Pass either.
   */
  label?: string
  'aria-label'?: string
  className?: string | undefined
}

export function StatsBand({ stats, className, ...props }: StatsBandProps) {
  return (
    <section
      className={cn(styles['stats-band'], className)}
      aria-label={props.ariaLabel ?? props['aria-label'] ?? props.label ?? 'Key metrics'}
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
