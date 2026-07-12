'use client'
import { useSignal, useSignalEffect, useSignals, type Signal } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useId, useRef, type CSSProperties, type ReactNode } from 'react'
import { useChartSize } from './use-chart'
import styles from './chart-frame.module.css'
import { defaultFormat, type ChartPoint, type TooltipModel } from './data-point'
import { ChartTooltip } from './chart-tooltip'
import { nearest } from './nearest'
import { voronoiFind } from '../engine/voronoi'
import { CanvasLayer, type CanvasPaint } from './canvas-layer'
import { isZoomed, panWindow, zoomWindow } from './zoom'
import { Toolbox, type ToolboxOptions } from '../chrome/toolbox'
import { download, serializeSvg, svgToPngBlob } from './export'

/**
 * Visually-hidden but screen-reader-available. Mirrors the `.fallback` rule in
 * chart-frame.module.css inline so the accessible data-table fallback stays
 * hidden even when a consumer forgets to import `@cascivo/charts/styles.css` —
 * without this, that stylesheet is the only thing hiding it and the raw x/y
 * table renders visibly under every chart (the dashboard-adopter footgun).
 */
const SR_ONLY: CSSProperties = {
  position: 'absolute',
  insetInlineStart: '-9999px',
  inlineSize: '1px',
  blockSize: '1px',
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
}

/** In-plot zoom-pan config: a shared index window + the total item count. */
export interface ZoomConfig {
  window: Signal<[number, number]>
  count: number
}

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
  /** When `'canvas'` and `paint` is given, dense marks paint to a `<canvas>` under the SVG chrome. */
  renderer?: 'svg' | 'canvas' | undefined
  /** Canvas paint callback (marks only) — used when `renderer === 'canvas'`. */
  paint?: CanvasPaint | undefined
  /** Enable in-plot wheel/drag zoom-pan + keyboard (`+`/`-`/`0`) bound to an index window. */
  zoom?: ZoomConfig | undefined
  /** Render a toolbox (PNG/SVG export, data-view toggle, restore). `true` enables all tools. */
  toolbox?: boolean | ToolboxOptions | undefined
  /** Extra reset run by the toolbox's Restore (e.g. clearing a visualMap filter). */
  onRestore?: (() => void) | undefined
  /**
   * Tune the (reduced-motion-gated) enter/update transitions. `false` disables them;
   * an object sets `duration` (ms), `easing`, and the transitioned `properties`. Unset
   * keeps the defaults. Always fully suppressed under `prefers-reduced-motion`.
   */
  transition?: boolean | { duration?: number; easing?: string; properties?: string[] } | undefined
  /** Render custom SVG behind the marks (a watermark, a region) — a lightweight extension seam. */
  onBeforeDraw?: ((ctx: { width: number; height: number }) => ReactNode) | undefined
  /** Render custom SVG over the marks (an overlay, an extra series) — a lightweight extension seam. */
  onAfterDraw?: ((ctx: { width: number; height: number }) => ReactNode) | undefined
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
  renderer = 'svg',
  paint,
  zoom,
  toolbox,
  onRestore,
  transition,
  onBeforeDraw,
  onAfterDraw,
}: ChartFrameProps) {
  useSignals()
  const id = useId()
  const descId = `${id}-desc`
  const ariaLiveId = `${id}-live`
  const { ref, width, height } = useChartSize(fixedWidth ?? 400, fixedHeight)

  // Must be called unconditionally (rules of hooks)
  const focusedIndex = useSignal<number | null>(null)
  const showData = useSignal(false)
  const ariaLiveRef = useRef<HTMLSpanElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  // Pan gesture state (drag start clientX + the window at grab time).
  const panStart = useRef<{ x: number; win: [number, number] } | null>(null)
  const layerRef = useRef<HTMLDivElement>(null)

  // Wheel zoom toward the cursor — attached natively so it can be non-passive
  // (a React onWheel handler can't reliably preventDefault the page scroll).
  useSignalEffect(() => {
    const el = layerRef.current
    if (!el || !zoom) return
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault()
      const rect = el.getBoundingClientRect()
      const frac = rect.width ? (ev.clientX - rect.left) / rect.width : 0.5
      const factor = ev.deltaY > 0 ? 1.25 : 1 / 1.25
      zoom.window.value = zoomWindow(zoom.window.value, zoom.count, factor, frac)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  })

  const resetZoom = () => {
    if (zoom) zoom.window.value = [0, Math.max(0, zoom.count - 1)]
  }

  const w = fixedWidth ?? width.value
  const h = fixedHeight ?? height.value

  const toolboxOptions: ToolboxOptions | null = toolbox === true ? {} : toolbox ? toolbox : null
  const exportSvgString = (): string | null =>
    svgRef.current ? serializeSvg(svgRef.current) : null
  const onExportSvg = () => {
    const s = exportSvgString()
    if (s) download(s, `${title || 'chart'}.svg`)
  }
  const onExportPng = () => {
    const s = exportSvgString()
    if (!s) return
    void svgToPngBlob(s, { width: w, height: h, dpr: 2 }).then((blob) => {
      if (blob) download(blob, `${title || 'chart'}.png`)
    })
  }
  const onRestoreAll = () => {
    resetZoom()
    onRestore?.()
  }

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
    cursor: zoom ? 'grab' : onSelect ? 'pointer' : 'crosshair',
    background: 'transparent',
    touchAction: zoom ? 'none' : undefined,
  }

  const useCanvas = renderer === 'canvas' && paint !== undefined
  const interactive = resolvedTooltip !== undefined || zoom !== undefined

  // Animation tuning → CSS custom properties consumed by chart-frame.module.css.
  const animVars: React.CSSProperties = {}
  if (transition && typeof transition === 'object') {
    const v = animVars as Record<string, string>
    if (transition.duration !== undefined)
      v['--cascivo-chart-anim-dur'] = `${transition.duration}ms`
    if (transition.easing) v['--cascivo-chart-anim-ease'] = transition.easing
    if (transition.properties) v['--cascivo-chart-anim-props'] = transition.properties.join(', ')
  }

  const containerStyle: React.CSSProperties | undefined =
    interactive || useCanvas || toolboxOptions || Object.keys(animVars).length > 0
      ? {
          ...animVars,
          ...(interactive || useCanvas || toolboxOptions ? { position: 'relative' } : {}),
        }
      : undefined

  return (
    <div
      ref={ref}
      className={[styles['frame'], className].filter(Boolean).join(' ')}
      style={containerStyle}
      {...(dataState !== undefined && { 'data-state': dataState })}
      {...(plain === true && { 'data-plain': '' })}
      {...(transition === false && { 'data-no-anim': '' })}
    >
      {toolboxOptions && (
        <div style={{ position: 'absolute', top: 4, right: 4, zIndex: 12 }}>
          <Toolbox
            options={toolboxOptions}
            onPng={onExportPng}
            onSvg={onExportSvg}
            onToggleData={() => {
              showData.value = !showData.value
            }}
            onRestore={onRestoreAll}
            showData={showData.value}
          />
        </div>
      )}
      {useCanvas && (
        <CanvasLayer
          size={() => ({ width: fixedWidth ?? width.value, height: fixedHeight ?? height.value })}
          paint={paint!}
        />
      )}
      <svg
        ref={svgRef}
        role="img"
        aria-label={title}
        aria-describedby={description ? descId : undefined}
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
      >
        {description && <desc id={descId}>{description}</desc>}
        {onBeforeDraw?.({ width: w, height: h })}
        {children({ width: w, height: h })}
        {onAfterDraw?.({ width: w, height: h })}
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
      {fallback && (
        <div className={styles['fallback']} style={SR_ONLY}>
          {fallback}
        </div>
      )}
      {toolboxOptions && showData.value && fallback && (
        <div data-data-view="" style={{ overflowX: 'auto' }}>
          {fallback}
        </div>
      )}
      {interactive && (
        <>
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
              {/* Axis crosshair — a vertical rule at the hovered x (axis-trigger mode) */}
              {resolvedTooltip.mode === 'axis' &&
                focusedIndex.value !== null &&
                resolvedTooltip.points[focusedIndex.value] !== undefined && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: resolvedTooltip.points[focusedIndex.value]!.cx,
                      top: 0,
                      width: 1,
                      height: h,
                      background: 'var(--cascivo-chart-grid, currentColor)',
                      pointerEvents: 'none',
                      zIndex: 9,
                    }}
                  />
                )}
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
            </>
          )}
          {/* Reset-zoom control — only while a zoom window is active (toolbox subsumes it) */}
          {zoom && !toolboxOptions && isZoomed(zoom.window.value, zoom.count) && (
            <button
              type="button"
              onClick={resetZoom}
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                zIndex: 11,
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                lineHeight: 1.2,
                borderRadius: '0.375rem',
                border: '1px solid var(--cascivo-chart-grid, currentColor)',
                background: 'var(--cascivo-color-background, white)',
                color: 'var(--cascivo-color-foreground, inherit)',
                cursor: 'pointer',
              }}
            >
              {t(builtin.charts.resetZoom)}
            </button>
          )}
          {/* Focusable layer covering the SVG for keyboard nav + zoom-pan gestures */}
          <div
            ref={layerRef}
            role="application"
            aria-label={
              zoom
                ? 'Chart — arrow keys navigate points; + and - zoom, 0 resets, drag to pan'
                : 'Chart data — use arrow keys to navigate points'
            }
            tabIndex={0}
            style={focusableLayerStyle}
            onPointerDown={(e) => {
              if (!zoom) return
              panStart.current = { x: e.clientX, win: [...zoom.window.value] }
              e.currentTarget.setPointerCapture(e.pointerId)
            }}
            onPointerMove={(e) => {
              // Drag-pan takes precedence while zooming.
              if (zoom && panStart.current && e.buttons === 1) {
                const rect = e.currentTarget.getBoundingClientRect()
                const span = panStart.current.win[1] - panStart.current.win[0] + 1
                const deltaPx = e.clientX - panStart.current.x
                const deltaIdx = rect.width ? -(deltaPx / rect.width) * span : 0
                zoom.window.value = panWindow(panStart.current.win, zoom.count, deltaIdx)
                return
              }
              if (!resolvedTooltip || !resolvedTooltip.points.length) return
              const rect = e.currentTarget.getBoundingClientRect()
              const relX = e.clientX - rect.left
              const relY = e.clientY - rect.top
              focusedIndex.value =
                resolvedTooltip.mode === 'axis'
                  ? nearest(resolvedTooltip.points, relX, relY, 'x')
                  : hover === 'voronoi'
                    ? voronoiFind(
                        resolvedTooltip.points.map((p) => [p.cx, p.cy] as const),
                        relX,
                        relY,
                      )
                    : nearest(resolvedTooltip.points, relX, relY, 'xy')
            }}
            onPointerUp={() => {
              panStart.current = null
            }}
            onPointerLeave={() => {
              panStart.current = null
              if (resolvedTooltip) focusedIndex.value = null
            }}
            onKeyDown={(e) => {
              if (zoom) {
                if (e.key === '+' || e.key === '=') {
                  e.preventDefault()
                  zoom.window.value = zoomWindow(zoom.window.value, zoom.count, 1 / 1.25, 0.5)
                  return
                }
                if (e.key === '-' || e.key === '_') {
                  e.preventDefault()
                  zoom.window.value = zoomWindow(zoom.window.value, zoom.count, 1.25, 0.5)
                  return
                }
                if (e.key === '0') {
                  e.preventDefault()
                  resetZoom()
                  return
                }
              }
              if (!resolvedTooltip || !resolvedTooltip.points.length) return
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
              if (!resolvedTooltip) return
              const idx = focusedIndex.value
              const pt = idx !== null ? resolvedTooltip.points[idx] : undefined
              if (onSelect && pt) onSelect(pt)
            }}
            onFocus={() => {
              if (
                resolvedTooltip &&
                resolvedTooltip.points.length > 0 &&
                focusedIndex.value === null
              ) {
                focusedIndex.value = 0
              }
            }}
            onBlur={() => {
              if (resolvedTooltip) focusedIndex.value = null
            }}
          />
        </>
      )}
    </div>
  )
}
