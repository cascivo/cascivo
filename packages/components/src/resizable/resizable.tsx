'use client'
import { cn, useControllableSignal, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { Children, useRef, type KeyboardEvent, type ReactNode } from 'react'
import styles from './resizable.module.css'

export interface ResizableProps {
  children: ReactNode
  orientation?: 'horizontal' | 'vertical'
  defaultRatio?: number
  ratio?: number
  minRatio?: number
  maxRatio?: number
  onRatioChange?: (ratio: number) => void
  className?: string
  label?: string
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function Resizable({
  children,
  orientation = 'horizontal',
  defaultRatio = 0.5,
  ratio,
  minRatio = 0.1,
  maxRatio = 0.9,
  onRatioChange,
  className,
  label,
}: ResizableProps) {
  useSignals()
  const panes = Children.toArray(children)
  const [first, second] = panes

  const [value, setValue] = useControllableSignal<number>({
    value: ratio,
    defaultValue: defaultRatio,
    onChange: onRatioChange,
  })

  const rootRef = useRef<HTMLDivElement>(null)
  const dragging = useSignal(false)

  const set = (next: number): void => {
    setValue(clamp(next, minRatio, maxRatio))
  }

  const ratioFromPointer = (clientX: number, clientY: number): number => {
    const el = rootRef.current
    if (!el) return value.value
    const rect = el.getBoundingClientRect()
    return orientation === 'horizontal'
      ? (clientX - rect.left) / rect.width
      : (clientY - rect.top) / rect.height
  }

  useSignalEffect(() => {
    if (!dragging.value) return
    const onMove = (e: PointerEvent): void => set(ratioFromPointer(e.clientX, e.clientY))
    const onUp = (): void => {
      dragging.value = false
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  })

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    const step = e.shiftKey ? 0.1 : 0.02
    const decKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp'
    const incKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown'
    if (e.key === decKey) set(value.value - step)
    else if (e.key === incKey) set(value.value + step)
    else if (e.key === 'Home') set(minRatio)
    else if (e.key === 'End') set(maxRatio)
    else return
    e.preventDefault()
  }

  const handleLabel = label ?? t(builtin.resizable.handle)
  const pct = Math.round(value.value * 100)

  return (
    <div
      ref={rootRef}
      className={cn(styles['resizable'], className)}
      data-orientation={orientation}
      style={{ '--cascivo-resizable-ratio': value.value } as Record<string, string | number>}
    >
      <div className={styles['pane']}>{first}</div>

      <div
        className={styles['handle']}
        role="separator"
        aria-orientation={orientation}
        aria-label={handleLabel}
        aria-valuenow={pct}
        aria-valuemin={Math.round(minRatio * 100)}
        aria-valuemax={Math.round(maxRatio * 100)}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          e.preventDefault()
          dragging.value = true
        }}
      >
        <span className={styles['grip']} aria-hidden="true" />
      </div>

      <div className={styles['pane']}>{second}</div>
    </div>
  )
}
