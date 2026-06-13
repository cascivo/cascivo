'use client'
import { useSignal, useSignalEffect, useSignals } from '@cascade-ui/core'
import { useId, useRef, type ReactNode } from 'react'
import { useChartSize } from './use-chart'
import styles from './chart-frame.module.css'
import { defaultFormat, type TooltipModel } from './data-point'
import { ChartTooltip } from './chart-tooltip'
import { nearest } from './nearest'

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
  tooltip?: TooltipModel | undefined
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
  tooltip,
}: ChartFrameProps) {
  useSignals()
  const id = useId()
  const descId = `${id}-desc`
  const ariaLiveId = `${id}-live`
  const { ref, width, height } = useChartSize(fixedWidth ?? 400, fixedHeight)

  // Must be called unconditionally (rules of hooks)
  const focusedIndex = useSignal<number | null>(null)
  const ariaLiveRef = useRef<HTMLSpanElement>(null)

  useSignalEffect(() => {
    const idx = focusedIndex.value
    if (!tooltip || !ariaLiveRef.current) return
    const pt = idx !== null ? tooltip.points[idx] : undefined
    ariaLiveRef.current.textContent = pt ? (tooltip.format ?? defaultFormat)(pt) : ''
  })

  const w = fixedWidth ?? width.value
  const h = fixedHeight ?? height.value

  const focusableLayerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    cursor: 'crosshair',
    background: 'transparent',
  }

  const containerStyle: React.CSSProperties | undefined =
    tooltip !== undefined ? { position: 'relative' } : undefined

  return (
    <div
      ref={ref}
      className={[styles['frame'], className].filter(Boolean).join(' ')}
      style={containerStyle}
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
      {tooltip !== undefined && (
        <>
          {/* Visually-hidden aria-live region for screen-reader announcements */}
          <span
            id={ariaLiveId}
            ref={ariaLiveRef}
            aria-live="polite"
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: 0,
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0,0,0,0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          />
          {/* Tooltip overlay — shown when a point is focused */}
          {focusedIndex.value !== null && tooltip.points[focusedIndex.value] !== undefined && (
            <ChartTooltip point={tooltip.points[focusedIndex.value]!} model={tooltip} />
          )}
          {/* Focusable layer covering the SVG for keyboard navigation */}
          <div
            role="application"
            aria-label="Chart data — use arrow keys to navigate points"
            tabIndex={0}
            style={focusableLayerStyle}
            onPointerMove={(e) => {
              if (!tooltip.points.length) return
              const rect = e.currentTarget.getBoundingClientRect()
              const relX = e.clientX - rect.left
              const relY = e.clientY - rect.top
              focusedIndex.value = nearest(tooltip.points, relX, relY, 'xy')
            }}
            onPointerLeave={() => {
              focusedIndex.value = null
            }}
            onKeyDown={(e) => {
              if (!tooltip.points.length) return
              const current = focusedIndex.value
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault()
                focusedIndex.value =
                  current === null ? 0 : Math.min(current + 1, tooltip.points.length - 1)
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault()
                focusedIndex.value =
                  current === null ? tooltip.points.length - 1 : Math.max(current - 1, 0)
              } else if (e.key === 'Escape') {
                focusedIndex.value = null
              }
            }}
            onFocus={() => {
              if (tooltip.points.length > 0 && focusedIndex.value === null) {
                focusedIndex.value = 0
              }
            }}
            onBlur={() => {
              focusedIndex.value = null
            }}
          />
        </>
      )}
    </div>
  )
}
