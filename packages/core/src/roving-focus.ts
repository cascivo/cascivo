'use client'
import { useRef } from 'react'
import { useSignal, type ReadonlySignal } from './signals.ts'

export type RovingOrientation = 'horizontal' | 'vertical' | 'both'

export interface UseRovingFocusOptions {
  orientation?: RovingOrientation
  /** Wrap focus from last→first and first→last. Default false. */
  loop?: boolean
  /** Initial active index. Default 0. */
  defaultIndex?: number
}

export interface RovingItemProps {
  tabIndex: number
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void
  onFocus: () => void
  ref: (el: HTMLElement | null) => void
}

export interface UseRovingFocusReturn {
  activeIndex: ReadonlySignal<number>
  getItemProps: (index: number) => RovingItemProps
  setActiveIndex: (index: number) => void
}

/**
 * Roving tabindex without context. The parent calls `useRovingFocus(...)` and spreads
 * `getItemProps(i)` onto each item. Only the active item is tabbable (`tabIndex={0}`); arrow keys
 * move focus (Home/End jump; `loop` wraps). State lives in a signal — the consuming component reads
 * it during render, so React apps must call `useSignals()` (per the project rule).
 */
export function useRovingFocus(options: UseRovingFocusOptions = {}): UseRovingFocusReturn {
  const { orientation = 'horizontal', loop = false, defaultIndex = 0 } = options
  const activeIndex = useSignal(defaultIndex)
  const itemsRef = useRef<(HTMLElement | null)[]>([])

  const focusIndex = (index: number): void => {
    activeIndex.value = index
    itemsRef.current[index]?.focus()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>, index: number): void => {
    const count = itemsRef.current.length
    if (count === 0) return
    const horizontal = orientation !== 'vertical'
    const vertical = orientation !== 'horizontal'
    let next = index
    if ((horizontal && event.key === 'ArrowRight') || (vertical && event.key === 'ArrowDown')) {
      next = index + 1
    } else if ((horizontal && event.key === 'ArrowLeft') || (vertical && event.key === 'ArrowUp')) {
      next = index - 1
    } else if (event.key === 'Home') {
      next = 0
    } else if (event.key === 'End') {
      next = count - 1
    } else {
      return
    }
    event.preventDefault()
    if (next < 0) next = loop ? count - 1 : 0
    if (next >= count) next = loop ? 0 : count - 1
    focusIndex(next)
  }

  const getItemProps = (index: number): RovingItemProps => ({
    tabIndex: activeIndex.value === index ? 0 : -1,
    onKeyDown: (event) => handleKeyDown(event, index),
    onFocus: () => {
      activeIndex.value = index
    },
    ref: (el) => {
      itemsRef.current[index] = el
    },
  })

  return {
    activeIndex,
    getItemProps,
    setActiveIndex: (index: number) => {
      activeIndex.value = index
    },
  }
}
