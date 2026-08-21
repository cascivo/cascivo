'use client'

import { cn, useEffectPropSignal, useId, useSignalEffect } from '@cascivo/core'
import { useRef } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import styles from './wheel-picker.module.css'

export interface WheelPickerOption {
  value: string
  label: string
}

export interface WheelPickerProps {
  options: WheelPickerOption[]
  value: string
  onValueChange: (value: string) => void
  /**
   * How many rows are visible. Odd numbers keep the selection centred.
   *
   * @defaultValue `5`
   * @see the component manifest
   */
  visibleCount?: number
  /**
   * Row height in px.
   *
   * @defaultValue `36`
   * @see the component manifest
   */
  itemHeight?: number
  ariaLabel?: string
  /**
   * Alias of `ariaLabel` — same invisible accessible name, the other spelling. Not rendered.
   *
   * `ariaLabel` is the catalog convention and stays preferred, but `label` is the guess an
   * adopter makes when they have not read the convention, and an unaccepted guess costs a
   * compile cycle for nothing (2026-08-21 report item 1). Pass either.
   */
  label?: string
  className?: string
}

/** Settle time after the last scroll event before the centred row is committed. */
const SETTLE_MS = 120

/**
 * iOS-style drum picker: a column of options that scrolls and snaps to a centred selection.
 *
 * The wheel is CSS scroll-snap, not a JavaScript gesture engine — momentum, rubber-banding
 * and snapping are the platform's, so the whole gesture runs on the compositor and behaves
 * natively on every device. JavaScript only reads which row settled and moves the column
 * when the value changes from outside.
 *
 * Semantically a single-select listbox whose selection follows focus: Arrow keys, Home and
 * End move the selection and scroll to match, so there is nothing to confirm.
 */
export function WheelPicker({
  options,
  value,
  onValueChange,
  visibleCount = 5,
  itemHeight = 36,
  ariaLabel,
  label,
  className,
}: WheelPickerProps) {
  const columnRef = useRef<HTMLDivElement>(null)
  const baseId = useId()

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )

  // Read at callback time only — the scroll handler runs outside the tracking scope.
  const optionsRef = useRef(options)
  optionsRef.current = options
  const onValueChangeRef = useRef(onValueChange)
  onValueChangeRef.current = onValueChange
  const itemHeightRef = useRef(itemHeight)
  itemHeightRef.current = itemHeight
  const valueRef = useRef(value)
  valueRef.current = value

  const scrollToIndex = (index: number, smooth: boolean): void => {
    const column = columnRef.current
    if (!column) return
    // 'instant', not 'auto': 'auto' defers to the CSS `scroll-behavior: smooth` below, which
    // would animate the initial placement — the wheel visibly spins up on every mount.
    column.scrollTo({
      top: index * itemHeightRef.current,
      behavior: smooth ? 'smooth' : 'instant',
    })
  }

  // Deferred mirror: this is read only inside the effect below, never during render, so a
  // synchronous mirror would run scrollTo mid-render.
  const targetValue = useEffectPropSignal(value)
  useSignalEffect(() => {
    const target = targetValue.value
    const index = optionsRef.current.findIndex((option) => option.value === target)
    if (index >= 0) scrollToIndex(index, false)
  })

  // Commit the centred row once scrolling has settled. Scroll-snap animates to the snap
  // point, so events keep arriving until it lands; a settle window covers both that and a
  // programmatic scroll.
  useSignalEffect(() => {
    const column = columnRef.current
    if (!column) return
    let timer: ReturnType<typeof setTimeout> | undefined

    const onScroll = (): void => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const index = Math.round(column.scrollTop / itemHeightRef.current)
        const option = optionsRef.current[index]
        if (option && option.value !== valueRef.current) onValueChangeRef.current(option.value)
      }, SETTLE_MS)
    }

    column.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(timer)
      column.removeEventListener('scroll', onScroll)
    }
  })

  const select = (index: number): void => {
    const clamped = Math.max(0, Math.min(options.length - 1, index))
    const option = options[clamped]
    if (!option || option.value === value) return
    onValueChange(option.value)
    scrollToIndex(clamped, true)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const keys: Record<string, number> = {
      ArrowDown: selectedIndex + 1,
      ArrowUp: selectedIndex - 1,
      Home: 0,
      End: options.length - 1,
      PageDown: selectedIndex + visibleCount,
      PageUp: selectedIndex - visibleCount,
    }
    const next = keys[event.key]
    if (next === undefined) return
    event.preventDefault()
    select(next)
  }

  // The column is taller than one row, so half a column of padding above and below lets the
  // first and last options reach the centre.
  const pad = ((visibleCount - 1) / 2) * itemHeight
  const rootStyle = {
    '--_item-height': `${itemHeight}px`,
    '--_pad': `${pad}px`,
    '--_column-height': `${visibleCount * itemHeight}px`,
  } as CSSProperties

  return (
    <div className={cn(styles['root'], className)} style={rootStyle}>
      <div
        ref={columnRef}
        role="listbox"
        tabIndex={0}
        aria-label={ariaLabel ?? label}
        aria-activedescendant={`${baseId}-${selectedIndex}`}
        className={styles['column']}
        onKeyDown={onKeyDown}
      >
        {options.map((option, index) => (
          <div
            key={option.value}
            id={`${baseId}-${index}`}
            role="option"
            aria-selected={index === selectedIndex}
            className={styles['option']}
          >
            {option.label}
          </div>
        ))}
      </div>
      {/* Decorative: the band marks where the selection sits. */}
      <div aria-hidden="true" className={styles['band']} />
    </div>
  )
}
