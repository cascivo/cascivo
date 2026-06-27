'use client'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useId, useRef, type ReactNode } from 'react'
import { useChartSize } from './use-chart'
import styles from './chart-frame.module.css'
import { defaultFormat, type ChartPoint, type TooltipModel } from './data-point'
import { ChartTooltip } from './chart-tooltip'
import { nearest } from './nearest'
import { voronoiFind } from '../engine/voronoi'

export interface ChartFrameProps {
  title: string
  description?: string | undefined
  width?: number | undefined
  height?: number | undefined
  fallback?: ReactNode
  children: (size: { width: number; height: number }) => ReactNode
  className?: string | undefined
  'data-state'?: string | undefined
  /** Visible placeholder text shown when data-state is "empty". Defaults to the i18n built-in. */
  emptyLabel?: string | undefined
  plain?: boolean | undefined
  /**
   * Tooltip model. Pass a TooltipModel directly, or a factory function that
   * receives the resolved chart size so cx/cy can be computed from scales.
   */
  tooltip?:
    | TooltipModel
    | ((size: { width: number; height: number }) => TooltipModel | undefined)
    | undefined
  /** Fired when the focused/hovered point is clicked or activated (Enter/Space). */
  onSelect?: ((point: ChartPoint) => void) | undefined
  /** Hover hit-test strategy: `rect` (default, nearest by x/y) or `voronoi` (precise cell membership). */
  hover?: 'rect' | 'voronoi' | undefined
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
  emptyLabel,
  plain,
  tooltip,
  onSelect,
  hover = 'rect',
}: ChartFrameProps) {
  useSignals()
  const id = useId()
  const descId = `${id}-desc`
  const ariaLiveId = `${id}-live`
  const { ref, width, height } = useChartSize(fixedWidth ?? 400, fixedHeight)

  // Must be called unconditionally (rules of hooks)
  const focusedIndex = useSignal<number | null>(null)
  const ariaLiveRef = useRef<HTMLSpanElement>(null)

  const w = fixedWidth ?? width.value
  const h = fixedHeight ?? height.value

  // Resolve tooltip: function form receives resolved size, value form is used as-is
  const resolvedTooltip: TooltipModel | undefined =
    typeof tooltip === 'function' ? tooltip({ width: w, height: h }) : tooltip

  useSignalEffect(() => {
    const idx = focusedIndex.value
    if (!resolvedTooltip || !ariaLiveRef.current) return
    const pt = idx !== null ? resolvedTooltip.points[idx] : undefined
    ariaLiveRef.current.textContent = pt ? (resolvedTooltip.format ?? defaultFormat)(pt) : ''
  })

  const focusableLayerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    cursor: onSelect ? 'pointer' : 'crosshair',
    background: 'transparent',
  }

  const containerStyle: React.CSSProperties | undefined =
    resolvedTooltip !== undefined ? { position: 'relative' } : undefined

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
        {dataState === 'empty' && (
          <text
            x={w / 2}
            y={h / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--cascivo-color-foreground-muted)"
            fontSize="0.875rem"
            data-empty=""
          >
            {emptyLabel ?? t(builtin.charts.noData)}
          </text>
        )}
      </svg>
      {fallback && <div className={styles['fallback']}>{fallback}</div>}
      {resolvedTooltip !== undefined && (
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
          {/* Focus ring indicator — shown at the focused data point */}
          {focusedIndex.value !== null &&
            resolvedTooltip.points[focusedIndex.value] !== undefined &&
            (() => {
              const fp = resolvedTooltip.points[focusedIndex.value!]!
              return (
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: fp.cx - 4,
                    top: fp.cy - 4,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    border: '2px solid var(--cascivo-focus-ring, var(--cascivo-color-accent))',
                    background: 'var(--cascivo-color-background, white)',
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                />
              )
            })()}
          {/* Tooltip overlay — shown when a point is focused */}
          {focusedIndex.value !== null &&
            resolvedTooltip.points[focusedIndex.value] !== undefined && (
              <ChartTooltip
                point={resolvedTooltip.points[focusedIndex.value]!}
                model={resolvedTooltip}
              />
            )}
          {/* Focusable layer covering the SVG for keyboard navigation */}
          <div
            role="application"
            aria-label="Chart data — use arrow keys to navigate points"
            tabIndex={0}
            style={focusableLayerStyle}
            onPointerMove={(e) => {
              if (!resolvedTooltip.points.length) return
              const rect = e.currentTarget.getBoundingClientRect()
              const relX = e.clientX - rect.left
              const relY = e.clientY - rect.top
              focusedIndex.value =
                hover === 'voronoi'
                  ? voronoiFind(
                      resolvedTooltip.points.map((p) => [p.cx, p.cy] as const),
                      relX,
                      relY,
                    )
                  : nearest(resolvedTooltip.points, relX, relY, 'xy')
            }}
            onPointerLeave={() => {
              focusedIndex.value = null
            }}
            onKeyDown={(e) => {
              if (!resolvedTooltip.points.length) return
              const current = focusedIndex.value
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault()
                focusedIndex.value =
                  current === null ? 0 : Math.min(current + 1, resolvedTooltip.points.length - 1)
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault()
                focusedIndex.value =
                  current === null ? resolvedTooltip.points.length - 1 : Math.max(current - 1, 0)
              } else if (e.key === 'Home') {
                e.preventDefault()
                focusedIndex.value = 0
              } else if (e.key === 'End') {
                e.preventDefault()
                focusedIndex.value = resolvedTooltip.points.length - 1
              } else if (e.key === 'Escape') {
                focusedIndex.value = null
              } else if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                const idx = focusedIndex.value
                const pt = idx !== null ? resolvedTooltip.points[idx] : undefined
                if (pt) onSelect(pt)
              }
            }}
            onClick={() => {
              const idx = focusedIndex.value
              const pt = idx !== null ? resolvedTooltip.points[idx] : undefined
              if (onSelect && pt) onSelect(pt)
            }}
            onFocus={() => {
              if (resolvedTooltip.points.length > 0 && focusedIndex.value === null) {
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
