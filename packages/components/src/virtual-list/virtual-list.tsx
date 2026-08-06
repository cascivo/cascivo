'use client'

import { cn, useSignal, useSignals } from '@cascivo/core'
import type { CSSProperties, ReactNode, UIEvent } from 'react'
import styles from './virtual-list.module.css'

export interface VirtualListProps<Item> {
  items: Item[]
  /** Fixed row height in px. Rows must all be this tall for positions to be correct. */
  itemHeight: number
  /**
   * Height of the scrolling viewport, in px.
   *
   * Deliberately not a CSS length: the visible row count is computed from this number, and
   * a relative length like `100%` cannot be resolved without measuring. Wrap the list and
   * pass a measured px value if the height has to be fluid.
   */
  height: number
  renderItem: (item: Item, index: number) => ReactNode
  /**
   * Extra rows rendered above and below the visible window, to cover fast scrolling.
   *
   * @defaultValue `3`
   * @see the component manifest
   */
  overscan?: number
  /** Accessible label for the list; defaults to none, so label it when standalone. */
  ariaLabel?: string
  className?: string
}

/**
 * Renders only the rows inside the scrolled viewport, so a list of any length costs a
 * constant number of DOM nodes.
 *
 * Row height is fixed: positions are arithmetic rather than measured, which keeps scrolling
 * on the compositor and avoids a layout pass per frame. Each rendered row carries
 * `aria-setsize` and `aria-posinset` for the **full** collection, so assistive technology
 * reports "3 of 10000" rather than the size of the rendered window.
 */
export function VirtualList<Item>({
  items,
  itemHeight,
  height,
  renderItem,
  overscan = 3,
  ariaLabel,
  className,
}: VirtualListProps<Item>) {
  useSignals()
  const scrollTop = useSignal(0)

  const visibleCount = Math.ceil(height / itemHeight)
  // Anchor the range on the first visible row, not on `first`: deriving `last` from a
  // clamped `first` widens the window by the whole overscan at the top of the list.
  const firstVisible = Math.floor(scrollTop.value / itemHeight)
  const first = Math.max(0, firstVisible - overscan)
  const last = Math.min(items.length, firstVisible + visibleCount + overscan)
  const visible = items.slice(first, last)

  const onScroll = (event: UIEvent<HTMLDivElement>): void => {
    scrollTop.value = event.currentTarget.scrollTop
  }

  const viewportStyle = { blockSize: `${height}px` } as CSSProperties

  return (
    <div
      className={cn(styles['viewport'], className)}
      style={viewportStyle}
      onScroll={onScroll}
      role="list"
      aria-label={ariaLabel}
      // Rows carry no focusable content of their own, so without this the scroll
      // container is unreachable by keyboard (axe scrollable-region-focusable).
      // Focused, it takes the browser's native arrow/PageUp/PageDown scrolling.
      tabIndex={0}
    >
      {/* Sized to the full collection so the scrollbar reflects real length. */}
      <div className={styles['canvas']} style={{ blockSize: `${items.length * itemHeight}px` }}>
        {visible.map((item, offset) => {
          const index = first + offset
          return (
            <div
              key={index}
              role="listitem"
              aria-setsize={items.length}
              aria-posinset={index + 1}
              className={styles['row']}
              style={{
                blockSize: `${itemHeight}px`,
                transform: `translateY(${index * itemHeight}px)`,
              }}
            >
              {renderItem(item, index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
