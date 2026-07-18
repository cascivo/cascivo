'use client'
import { cn, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useRef } from 'react'
import type { CSSProperties } from 'react'
import styles from './toc.module.css'

export interface TocItem {
  /** id of the heading/section this entry links to (without the leading `#`) */
  id: string
  label: string
  /** heading level (2 = h2, 3 = h3 …); drives indentation. Defaults to 2. */
  level?: number
}

export interface TocProps {
  items: TocItem[]
  /**
   * Controlled active item id. When set, the component reflects this value and
   * does not run its own scroll-spy. Leave undefined for built-in scroll-spy.
   */
  activeId?: string
  onActiveChange?: (id: string) => void
  /** Override the built-in nav landmark label. */
  labels?: { nav?: string }
  className?: string
}

export function Toc({ items, activeId, onActiveChange, labels, className }: TocProps) {
  useSignals()
  const controlled = activeId !== undefined
  const active = useSignal(activeId ?? items[0]?.id ?? '')
  // Sync a controlled prop into the signal during render (no-op if unchanged).
  if (controlled) active.value = activeId

  // Keep the callback current without re-subscribing the observer.
  const onActiveChangeRef = useRef(onActiveChange)
  onActiveChangeRef.current = onActiveChange

  // Scroll-spy: track the topmost visible heading. Only when uncontrolled.
  useSignalEffect(() => {
    if (controlled) return
    if (typeof document === 'undefined' || typeof IntersectionObserver === 'undefined') return
    const targets = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => el !== null)
    if (targets.length === 0) return

    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        // items are in document order, so the first visible one is the topmost.
        const topmost = items.find((it) => visible.has(it.id))
        if (topmost && topmost.id !== active.value) {
          active.value = topmost.id
          onActiveChangeRef.current?.(topmost.id)
        }
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0 },
    )
    for (const el of targets) observer.observe(el)
    return () => observer.disconnect()
  })

  const navLabel = labels?.nav ?? t(builtin.toc.nav)

  return (
    <nav aria-label={navLabel} className={cn(styles['toc'], className)}>
      <ol>
        {items.map((item) => (
          <li key={item.id} style={{ '--toc-level': item.level ?? 2 } as CSSProperties}>
            <a
              href={`#${item.id}`}
              aria-current={item.id === active.value ? 'location' : undefined}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
