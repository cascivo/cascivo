'use client'

import { cn, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import styles from './reorder-list.module.css'

export interface ReorderItem {
  id: string
  label: ReactNode
  /** Plain-text name used in announcements when `label` is not a string. */
  name?: string
}

/** Placeholder set every announcement string — built-in or overridden — is filled with. */
interface Announcement {
  name: string
  position: number
  total: number
}

export interface ReorderListProps {
  value: ReorderItem[]
  onValueChange: (value: ReorderItem[]) => void
  /**
   * When true, disables the control and removes it from the tab order.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  disabled?: boolean
  labels?: {
    handle?: string
    grabbed?: string
    moved?: string
    dropped?: string
    cancelled?: string
  }
  className?: string
}

/** Announcement text needs a plain string; fall back to the id for non-string labels. */
function nameOf(item: ReorderItem): string {
  return item.name ?? (typeof item.label === 'string' ? item.label : item.id)
}

function move(items: ReorderItem[], from: number, to: number): ReorderItem[] {
  const next = items.slice()
  const [moved] = next.splice(from, 1)
  if (moved) next.splice(to, 0, moved)
  return next
}

/**
 * A list whose rows can be reordered by pointer drag or entirely by keyboard.
 *
 * Each row carries a drag handle. Space or Enter picks the row up, Arrow keys move it,
 * Space or Enter drops it, and Escape restores the order it had before the pick-up — the
 * keyboard path Ionic's pointer-only `ion-reorder` has no equivalent for. Every transition
 * is announced through a polite live region.
 */
export function ReorderList({
  value,
  onValueChange,
  disabled = false,
  labels,
  className,
}: ReorderListProps) {
  useSignals()
  const listRef = useRef<HTMLUListElement>(null)
  /** Index of the row currently held, by keyboard or by pointer. */
  const activeIndex = useSignal<number | null>(null)
  const announcement = useSignal('')

  // Read at callback time (pointer/keyboard handlers), never to drive effect re-runs.
  const valueRef = useRef(value)
  valueRef.current = value
  const onValueChangeRef = useRef(onValueChange)
  onValueChangeRef.current = onValueChange
  const disabledRef = useRef(disabled)
  disabledRef.current = disabled
  /** Order captured at pick-up, so Escape can restore it. */
  const orderBeforeGrab = useRef<ReorderItem[] | null>(null)

  /**
   * Announce an override if the caller supplied one, else the already-resolved catalog
   * string. Overrides are interpolated here against the same placeholder set, so a custom
   * label supports `{name}`, `{position}` and `{total}` exactly as the built-in does.
   */
  const announce = (override: string | undefined, resolved: string, params: Announcement): void => {
    announcement.value = override
      ? override
          .replace('{name}', params.name)
          .replace('{position}', String(params.position))
          .replace('{total}', String(params.total))
      : resolved
  }

  const reorder = (from: number, to: number): void => {
    const items = valueRef.current
    const clamped = Math.max(0, Math.min(items.length - 1, to))
    if (clamped === from) return
    const item = items[from]
    if (!item) return
    onValueChangeRef.current(move(items, from, clamped))
    activeIndex.value = clamped
    const params = { name: nameOf(item), position: clamped + 1, total: items.length }
    announce(labels?.moved, t(builtin.reorderList.moved, params), params)
  }

  const grab = (index: number): void => {
    const items = valueRef.current
    const item = items[index]
    if (!item) return
    orderBeforeGrab.current = items
    activeIndex.value = index
    const params = { name: nameOf(item), position: index + 1, total: items.length }
    announce(labels?.grabbed, t(builtin.reorderList.grabbed, params), params)
  }

  const drop = (): void => {
    const index = activeIndex.value
    if (index === null) return
    const items = valueRef.current
    const item = items[index]
    orderBeforeGrab.current = null
    activeIndex.value = null
    if (!item) return
    const params = { name: nameOf(item), position: index + 1, total: items.length }
    announce(labels?.dropped, t(builtin.reorderList.dropped, params), params)
  }

  const cancel = (): void => {
    const original = orderBeforeGrab.current
    const index = activeIndex.value
    orderBeforeGrab.current = null
    activeIndex.value = null
    if (!original) return
    onValueChangeRef.current(original)
    const item = index === null ? undefined : original[index]
    const params = {
      name: item ? nameOf(item) : '',
      position: (index ?? 0) + 1,
      total: original.length,
    }
    announce(labels?.cancelled, t(builtin.reorderList.cancelled, params), params)
  }

  const onHandleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    if (disabled) return
    const held = activeIndex.value
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      if (held === index) drop()
      else grab(index)
      return
    }
    if (event.key === 'Escape' && held !== null) {
      event.preventDefault()
      cancel()
      return
    }
    if (held !== index) return
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      reorder(index, index - 1)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      reorder(index, index + 1)
    }
  }

  // Pointer drag: rows reflow live as the pointer crosses their midpoints, so there is
  // no ghost element to keep in sync with the list.
  useSignalEffect(() => {
    const list = listRef.current
    if (!list || typeof window === 'undefined') return

    const onMove = (event: PointerEvent): void => {
      const from = activeIndex.value
      if (from === null || disabledRef.current) return
      const rows = [...list.querySelectorAll<HTMLElement>('[data-reorder-row]')]
      const target = rows.findIndex((row) => {
        const rect = row.getBoundingClientRect()
        return event.clientY >= rect.top && event.clientY <= rect.bottom
      })
      if (target !== -1 && target !== from) reorder(from, target)
    }
    const onUp = (): void => {
      if (activeIndex.value !== null && orderBeforeGrab.current) drop()
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  })

  return (
    <div className={cn(styles['root'], className)}>
      <ul ref={listRef} className={styles['list']}>
        {value.map((item, index) => (
          <li
            key={item.id}
            data-reorder-row=""
            data-active={activeIndex.value === index ? '' : undefined}
            className={styles['row']}
          >
            <button
              type="button"
              disabled={disabled}
              aria-label={
                labels?.handle
                  ? labels.handle.replace('{name}', nameOf(item))
                  : t(builtin.reorderList.handle, { name: nameOf(item) })
              }
              aria-pressed={activeIndex.value === index}
              className={styles['handle']}
              onKeyDown={(event) => onHandleKeyDown(event, index)}
              onPointerDown={() => {
                if (!disabled) grab(index)
              }}
            >
              <svg aria-hidden="true" viewBox="0 0 16 16" className={styles['grip']}>
                <path
                  d="M6 4h.01M10 4h.01M6 8h.01M10 8h.01M6 12h.01M10 12h.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <span className={styles['label']}>{item.label}</span>
          </li>
        ))}
      </ul>
      <span role="status" aria-live="polite" className={styles['srOnly']}>
        {announcement.value}
      </span>
    </div>
  )
}
