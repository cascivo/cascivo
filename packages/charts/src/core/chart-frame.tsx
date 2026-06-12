'use client'
import { useSignals } from '@cascade-ui/core'
import { useId, type ReactNode } from 'react'
import { useChartSize } from './use-chart'
import styles from './chart-frame.module.css'

export interface ChartFrameProps {
  title: string
  description?: string | undefined
  width?: number | undefined
  height?: number | undefined
  fallback?: ReactNode
  children: (size: { width: number; height: number }) => ReactNode
  className?: string | undefined
  'data-state'?: string | undefined
  plain?: boolean | undefined
}

export function ChartFrame({
  title,
  description,
  width: fixedWidth,
  height: fixedHeight = 300,
  fallback,
  children,
  className,
  'data-state': dataState,
  plain,
}: ChartFrameProps) {
  useSignals()
  const id = useId()
  const descId = `${id}-desc`
  const { ref, width, height } = useChartSize(fixedWidth ?? 400, fixedHeight)

  const w = fixedWidth ?? width.value
  const h = fixedHeight ?? height.value

  return (
    <div
      ref={ref}
      className={[styles['frame'], className].filter(Boolean).join(' ')}
      {...(dataState !== undefined && { 'data-state': dataState })}
      {...(plain === true && { 'data-plain': '' })}
    >
      <svg
        role="img"
        aria-label={title}
        aria-describedby={description ? descId : undefined}
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
      >
        {description && <desc id={descId}>{description}</desc>}
        {children({ width: w, height: h })}
      </svg>
      {fallback && <div className={styles['fallback']}>{fallback}</div>}
    </div>
  )
}
