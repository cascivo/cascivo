'use client'
import { cn, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import type { KeyboardEvent, ReactNode } from 'react'
import { useRef } from 'react'
import styles from './split-view.module.css'

export interface SplitViewProps {
  start: ReactNode
  end: ReactNode
  defaultRatio?: number
  min?: number
  max?: number
  'aria-label'?: string
  className?: string
}

export function SplitView({
  start,
  end,
  defaultRatio = 0.3,
  min = 0.2,
  max = 0.8,
  'aria-label': ariaLabel = 'Split view',
  className,
}: SplitViewProps) {
  useSignals()
  const rootRef = useRef<HTMLDivElement>(null)
  const ratio = useSignal(defaultRatio)
  const dragging = useSignal(false)

  useSignalEffect(() => {
    if (!rootRef.current) return
    rootRef.current.style.setProperty('--_split-ratio', String(ratio.value))
  })

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.value = true
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.value || !rootRef.current) return
    const rect = rootRef.current.getBoundingClientRect()
    const raw = (e.clientX - rect.left) / rect.width
    ratio.value = Math.min(max, Math.max(min, raw))
  }

  const handlePointerUp = () => {
    dragging.value = false
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      ratio.value = Math.max(min, ratio.value - 0.02)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      ratio.value = Math.min(max, ratio.value + 0.02)
    }
  }

  return (
    <div ref={rootRef} className={cn(styles['split'], className)}>
      <div className={styles['pane-start']}>{start}</div>
      <div
        role="separator"
        aria-label={ariaLabel}
        aria-orientation="vertical"
        aria-valuenow={Math.round(ratio.value * 100)}
        aria-valuemin={Math.round(min * 100)}
        aria-valuemax={Math.round(max * 100)}
        tabIndex={0}
        className={styles['divider']}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={handleKeyDown}
      />
      <div className={styles['pane-end']}>{end}</div>
    </div>
  )
}
