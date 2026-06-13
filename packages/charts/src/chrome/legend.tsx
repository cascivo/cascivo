'use client'
import { useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import type { Signal } from '@preact/signals-react'
import styles from './legend.module.css'

export interface LegendSeries {
  id: string
  label: string
  color: string
}

export interface LegendProps {
  series: readonly LegendSeries[]
  hidden: Signal<Set<string>>
}

export function Legend({ series, hidden }: LegendProps) {
  useSignals()
  return (
    <div className={styles['legend']} aria-label="Chart legend">
      {series.map((s, i) => {
        const isHidden = hidden.value.has(s.id)
        const toggle = () => {
          const next = new Set(hidden.value)
          if (isHidden) next.delete(s.id)
          else next.add(s.id)
          hidden.value = next
        }
        return (
          <button
            key={s.id}
            type="button"
            className={styles['item']}
            data-state={isHidden ? 'off' : 'on'}
            aria-pressed={!isHidden}
            aria-label={t(builtin.charts.legendToggle, { name: s.label })}
            onClick={toggle}
          >
            <span
              className={styles['swatch']}
              style={{ background: s.color || `var(--cascivo-chart-${i + 1})` }}
              aria-hidden="true"
            />
            {s.label}
          </button>
        )
      })}
    </div>
  )
}
