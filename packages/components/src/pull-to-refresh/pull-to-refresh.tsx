'use client'

import { cn, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useRef, type CSSProperties, type ReactNode } from 'react'
import { Spinner } from '../spinner/spinner'
import styles from './pull-to-refresh.module.css'

/** Finger travel is damped by this factor so the pull feels rubber-banded. */
const RESISTANCE = 0.5

export interface PullToRefreshProps {
  /** Invoked when the pull passes the threshold; the spinner shows until it settles. */
  onRefresh: () => Promise<unknown> | unknown
  children: ReactNode
  /** Pull distance (px) required to trigger a refresh. Default 64. */
  threshold?: number
  disabled?: boolean
  labels?: { pull?: string; release?: string; refreshing?: string }
  className?: string
}

/**
 * Wraps a vertically scrollable region and triggers `onRefresh` when the user pulls
 * down past a threshold while scrolled to the top. The gesture is damped (rubber-band),
 * shows a spinner while the returned promise settles, then springs back. Pointer logic
 * runs in `useSignalEffect`; CSS translate only, no animation library. Pull is only armed
 * at scrollTop 0, so normal scrolling is untouched.
 */
export function PullToRefresh({
  onRefresh,
  children,
  threshold = 64,
  disabled = false,
  labels,
  className,
}: PullToRefreshProps) {
  useSignals()
  const viewportRef = useRef<HTMLDivElement>(null)
  const pull = useSignal(0)
  const refreshing = useSignal(false)
  const dragging = useSignal(false)

  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh
  const thresholdRef = useRef(threshold)
  thresholdRef.current = threshold
  const disabledRef = useRef(disabled)
  disabledRef.current = disabled

  useSignalEffect(() => {
    const el = viewportRef.current
    if (!el || typeof window === 'undefined') return

    let startY = 0
    let active = false

    const onDown = (event: PointerEvent): void => {
      if (disabledRef.current || refreshing.value || el.scrollTop > 0) return
      startY = event.clientY
      active = true
    }
    const onMove = (event: PointerEvent): void => {
      if (!active || refreshing.value) return
      const dy = event.clientY - startY
      // Cancel if the user scrolls up, or the list isn't at the top anymore.
      if (dy <= 0 || el.scrollTop > 0) {
        pull.value = 0
        dragging.value = false
        return
      }
      // Suppress native overscroll while we own the gesture.
      event.preventDefault()
      dragging.value = true
      pull.value = Math.min(dy * RESISTANCE, thresholdRef.current * 1.5)
    }
    const onUp = (): void => {
      if (!active) return
      active = false
      dragging.value = false
      if (refreshing.value) return
      if (pull.value >= thresholdRef.current) {
        refreshing.value = true
        pull.value = thresholdRef.current
        Promise.resolve(onRefreshRef.current()).then(
          () => {
            refreshing.value = false
            pull.value = 0
          },
          () => {
            refreshing.value = false
            pull.value = 0
          },
        )
      } else {
        pull.value = 0
      }
    }

    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  })

  const distance = refreshing.value ? threshold : pull.value
  const progress = Math.min(distance / threshold, 1)
  const ready = progress >= 1

  const status = refreshing.value
    ? (labels?.refreshing ?? t(builtin.pullToRefresh.refreshing))
    : ready
      ? (labels?.release ?? t(builtin.pullToRefresh.release))
      : distance > 0
        ? (labels?.pull ?? t(builtin.pullToRefresh.pull))
        : ''

  const rootStyle = { '--_pull': `${distance}px` } as CSSProperties

  return (
    <div className={cn(styles['root'], className)} style={rootStyle}>
      <div className={styles['indicator']} data-dragging={dragging.value ? '' : undefined}>
        {refreshing.value ? (
          <Spinner size="sm" />
        ) : (
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className={styles['arrow']}
            data-ready={ready ? '' : undefined}
            style={{ opacity: progress }}
          >
            <path
              d="M8 13V3M4 7l4-4 4 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <span role="status" aria-live="polite" className={styles['srOnly']}>
        {status}
      </span>
      <div
        ref={viewportRef}
        className={styles['viewport']}
        data-dragging={dragging.value ? '' : undefined}
      >
        {children}
      </div>
    </div>
  )
}
