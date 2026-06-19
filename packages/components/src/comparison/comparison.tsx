'use client'
import { cn, useControllableSignal, useSignal, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import type { HTMLAttributes, KeyboardEvent, PointerEvent, ReactNode } from 'react'
import { useRef } from 'react'
import styles from './comparison.module.css'

export interface ComparisonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** The base layer, fully visible underneath. */
  after: ReactNode
  /** The top layer, revealed from the start edge up to `position`. */
  before: ReactNode
  /** Divider position as a percentage 0–100. Controlled when provided. */
  position?: number
  /** Initial divider position for uncontrolled use. Default 50. */
  defaultPosition?: number
  onPositionChange?: (position: number) => void
  orientation?: 'horizontal' | 'vertical'
  /** Percentage the Arrow keys move the divider. Default 5. */
  keyboardStep?: number
  /** Accessible label for the divider slider. */
  label?: string
}

const clamp = (n: number): number => Math.min(100, Math.max(0, n))

export function Comparison({
  after,
  before,
  position,
  defaultPosition = 50,
  onPositionChange,
  orientation = 'horizontal',
  keyboardStep = 5,
  label,
  className,
  ...props
}: ComparisonProps) {
  useSignals()
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useSignal(false)
  const [pos, setPos] = useControllableSignal<number>({
    value: position,
    defaultValue: defaultPosition,
    onChange: onPositionChange,
  })
  const value = Math.round(clamp(pos.value))

  const updateFromPointer = (event: PointerEvent<HTMLDivElement>): void => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct =
      orientation === 'vertical'
        ? ((event.clientY - rect.top) / rect.height) * 100
        : ((event.clientX - rect.left) / rect.width) * 100
    setPos(clamp(pct))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const decrease = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft'
    const increase = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight'
    let next: number | null = null
    if (event.key === decrease || event.key === 'ArrowLeft' || event.key === 'ArrowUp')
      next = value - keyboardStep
    else if (event.key === increase || event.key === 'ArrowRight' || event.key === 'ArrowDown')
      next = value + keyboardStep
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = 100
    else if (event.key === 'PageUp') next = value + keyboardStep * 2
    else if (event.key === 'PageDown') next = value - keyboardStep * 2
    if (next === null) return
    event.preventDefault()
    setPos(clamp(next))
  }

  return (
    <div
      ref={containerRef}
      data-orientation={orientation}
      data-dragging={dragging.value || undefined}
      className={cn(styles['comparison'], className)}
      style={{ '--position': `${value}%` } as Record<string, string>}
      onPointerDown={(event) => {
        dragging.value = true
        event.currentTarget.setPointerCapture?.(event.pointerId)
        updateFromPointer(event)
      }}
      onPointerMove={(event) => {
        if (dragging.value) updateFromPointer(event)
      }}
      onPointerUp={(event) => {
        dragging.value = false
        event.currentTarget.releasePointerCapture?.(event.pointerId)
      }}
      {...props}
    >
      <div className={styles['item']}>{after}</div>
      <div className={styles['before']} aria-hidden="true">
        {before}
      </div>
      <div className={styles['divider']}>
        <div
          role="slider"
          tabIndex={0}
          aria-label={label ?? t(builtin.comparison.label)}
          aria-orientation={orientation}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          className={styles['handle']}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  )
}
