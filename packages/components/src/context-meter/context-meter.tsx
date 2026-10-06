import { cn } from '@cascivo/core/pure'
import { builtin, formatNumber, t } from '@cascivo/i18n'
import type { CSSProperties, HTMLAttributes } from 'react'
import styles from './context-meter.module.css'

export interface ContextMeterProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max: number
  /**
   * The meter’s name, shown above the bar.
   *
   * @defaultValue `Context`
   * @see the component manifest
   */
  label?: string
  labels?: {
    usage?: string
  }
}

/** Fraction at which the meter warns, and at which it reads as full. */
const HIGH = 0.8
const FULL = 0.95

export function ContextMeter({
  value,
  max,
  label,
  labels,
  className,
  style,
  ...props
}: ContextMeterProps) {
  const fraction = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0
  const level = fraction >= FULL ? 'full' : fraction >= HIGH ? 'high' : 'normal'
  const percent = formatNumber(fraction, { style: 'percent', maximumFractionDigits: 0 })
  const name = label ?? t(builtin.contextMeter.label)
  const params = { used: formatNumber(value), max: formatNumber(max), percent }
  const usage =
    labels?.usage?.replace(
      /\{(used|max|percent)\}/g,
      (_, key: keyof typeof params) => params[key],
    ) ?? t(builtin.contextMeter.usage, params)

  return (
    <div
      role="meter"
      aria-label={name}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuetext={usage}
      data-level={level}
      className={cn(styles['meter'], className as string | undefined)}
      style={{ ['--_fill' as string]: String(fraction), ...style } as CSSProperties}
      {...props}
    >
      {/* The visible line repeats the accessible name and value text, so it is hidden from
          assistive tech rather than read twice. */}
      <div className={styles['header']} aria-hidden="true">
        <span className={styles['label']}>{name}</span>
        <span className={styles['value']}>
          {formatNumber(value, { notation: 'compact' })} /{' '}
          {formatNumber(max, { notation: 'compact' })}
        </span>
      </div>
      <div className={styles['track']} aria-hidden="true">
        <div className={styles['fill']} />
      </div>
    </div>
  )
}
