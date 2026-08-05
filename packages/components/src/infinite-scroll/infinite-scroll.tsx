'use client'

import { cn, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useRef } from 'react'
import { Spinner } from '../spinner/spinner'
import styles from './infinite-scroll.module.css'

export interface InfiniteScrollProps {
  /** Called when the sentinel comes into view, or the button is activated. */
  onLoadMore: () => Promise<unknown> | unknown
  /**
   * When true, stops observing and renders nothing — there are no more pages.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  disabled?: boolean
  /**
   * How far ahead of the end to start loading, as an IntersectionObserver root margin.
   *
   * @defaultValue `'200px'`
   * @see the component manifest
   */
  rootMargin?: string
  labels?: { loadMore?: string; loading?: string }
  className?: string
}

/**
 * Loads the next page when the end of a list comes into view.
 *
 * Place it as the last child of the scrolling region, after the list. It renders a real
 * "Load more" button and auto-activates it via an `IntersectionObserver` — so the next
 * page is reachable by keyboard and by screen reader, not only by scrolling, which is the
 * standing accessibility complaint against scroll-only infinite lists. Re-entry is
 * guarded, so a sentinel that stays visible after a short page cannot loop.
 */
export function InfiniteScroll({
  onLoadMore,
  disabled = false,
  rootMargin = '200px',
  labels,
  className,
}: InfiniteScrollProps) {
  useSignals()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loading = useSignal(false)

  // Read at callback time, not to drive effect re-runs: the observer callback fires
  // outside the tracking scope, so a signal here would be redundant and a tick stale.
  const onLoadMoreRef = useRef(onLoadMore)
  onLoadMoreRef.current = onLoadMore
  const disabledRef = useRef(disabled)
  disabledRef.current = disabled

  const load = (): void => {
    if (loading.value || disabledRef.current) return
    loading.value = true
    Promise.resolve(onLoadMoreRef.current()).then(
      () => {
        loading.value = false
      },
      () => {
        loading.value = false
      },
    )
  }
  const loadRef = useRef(load)
  loadRef.current = load

  useSignalEffect(() => {
    const el = sentinelRef.current
    if (!el || disabled || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadRef.current()
      },
      { rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  })

  if (disabled) return null

  return (
    <div ref={sentinelRef} className={cn(styles['root'], className)}>
      {loading.value ? (
        <span className={styles['status']} role="status">
          {/* The Spinner carries its own role="status"; nesting it live would announce
              twice, so here it is decorative and this region owns the announcement. */}
          <Spinner size="sm" aria-hidden="true" />
          {labels?.loading ?? t(builtin.infiniteScroll.loading)}
        </span>
      ) : (
        <button type="button" className={styles['button']} onClick={load}>
          {labels?.loadMore ?? t(builtin.infiniteScroll.loadMore)}
        </button>
      )}
    </div>
  )
}
