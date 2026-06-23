'use client'
import { cn, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import type { HTMLAttributes } from 'react'
import styles from './flow-controls.module.css'

export type FlowChromePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface FlowControlsLabels {
  zoomIn?: string
  zoomOut?: string
  fitView?: string
}

export interface FlowControlsProps extends HTMLAttributes<HTMLDivElement> {
  position?: FlowChromePosition
  showZoom?: boolean
  showFitView?: boolean
  onZoomIn?: () => void
  onZoomOut?: () => void
  onFitView?: () => void
  labels?: FlowControlsLabels
  className?: string
}

const ICON = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  'aria-hidden': true,
} as const

/**
 * Zoom in / out / fit-view controls for a flow canvas — real buttons with
 * i18n-defaulted aria-labels. Calls the viewport actions passed in.
 * `useSignals()` first (reads the locale signal via `t`).
 */
export function FlowControls({
  position = 'bottom-left',
  showZoom = true,
  showFitView = true,
  onZoomIn,
  onZoomOut,
  onFitView,
  labels,
  className,
  ...rest
}: FlowControlsProps) {
  useSignals()
  return (
    <div data-position={position} className={cn(styles['controls'], className)} {...rest}>
      {showZoom && (
        <>
          <button
            type="button"
            className={styles['button']}
            aria-label={labels?.zoomIn ?? t(builtin.flow.zoomIn)}
            onClick={onZoomIn}
          >
            <svg {...ICON}>
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className={styles['button']}
            aria-label={labels?.zoomOut ?? t(builtin.flow.zoomOut)}
            onClick={onZoomOut}
          >
            <svg {...ICON}>
              <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </>
      )}
      {showFitView && (
        <button
          type="button"
          className={styles['button']}
          aria-label={labels?.fitView ?? t(builtin.flow.fitView)}
          onClick={onFitView}
        >
          <svg {...ICON}>
            <path
              d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
