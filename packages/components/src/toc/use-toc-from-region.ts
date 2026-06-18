'use client'
import { useSignal, useSignalEffect, type Signal } from '@cascivo/core'
import type { RefObject } from 'react'
import type { TocItem } from './toc'

export interface UseTocFromRegionOptions {
  /** CSS selector for the headings to collect. Defaults to `h2, h3, h4`. */
  selector?: string
}

/**
 * Opt-in convenience: derive a `TocItem[]` signal from the headings inside a
 * container. Headings must have an `id`. Feed the result to `<Toc items={…} />`.
 * The controlled `items` API on `Toc` remains the primary, testable surface;
 * this helper only builds the list.
 */
export function useTocFromRegion(
  ref: RefObject<HTMLElement | null>,
  options: UseTocFromRegionOptions = {},
): Signal<TocItem[]> {
  const selector = options.selector ?? 'h2, h3, h4'
  const items = useSignal<TocItem[]>([])

  useSignalEffect(() => {
    const root = ref.current
    if (!root) return
    const headings = Array.from(root.querySelectorAll<HTMLElement>(selector))
    items.value = headings
      .filter((h) => h.id !== '')
      .map((h) => ({
        id: h.id,
        label: h.textContent?.trim() ?? '',
        level: Number(h.tagName.slice(1)) || 2,
      }))
  })

  return items
}
