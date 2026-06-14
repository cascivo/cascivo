'use client'
import { type CSSProperties, type RefObject } from 'react'
import { useSignal, useSignalEffect, useSignals, type Signal } from './signals.ts'
import { useId } from './use-id.ts'

export type AnchorSide = 'top' | 'bottom' | 'left' | 'right'
export type AnchorAlign = 'start' | 'center' | 'end'
export type AnchorPlacement = AnchorSide | `${AnchorSide}-${'start' | 'end'}`

export interface UseAnchorPositionOptions {
  anchorRef: RefObject<HTMLElement | null>
  floatingRef: RefObject<HTMLElement | null>
  placement?: AnchorPlacement
  /** Gate positioning (e.g. only while open). Default true. */
  enabled?: boolean | Signal<boolean>
}

export interface UseAnchorPositionReturn {
  /** Spread onto the anchor element (CSS-anchor path sets `anchor-name`). */
  anchorStyle: CSSProperties
  /** Spread onto the floating element. */
  floatingStyle: CSSProperties
  /** Whether the CSS anchor-positioning primary path is active. */
  cssAnchorSupported: boolean
}

function supportsCssAnchor(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('anchor-name: --x')
  )
}

function parsePlacement(placement: AnchorPlacement): { side: AnchorSide; align: AnchorAlign } {
  const [side, end] = placement.split('-') as [AnchorSide, 'start' | 'end' | undefined]
  return { side, align: end ?? 'center' }
}

/** JS fallback math — position `floating` relative to `anchor` for the given placement. */
export function computePosition(
  anchor: {
    top: number
    left: number
    right: number
    bottom: number
    width: number
    height: number
  },
  floating: { width: number; height: number },
  placement: AnchorPlacement,
): { top: number; left: number } {
  const { side, align } = parsePlacement(placement)
  let top = 0
  let left = 0
  if (side === 'top' || side === 'bottom') {
    top = side === 'bottom' ? anchor.bottom : anchor.top - floating.height
    left =
      align === 'start'
        ? anchor.left
        : align === 'end'
          ? anchor.right - floating.width
          : anchor.left + (anchor.width - floating.width) / 2
  } else {
    left = side === 'right' ? anchor.right : anchor.left - floating.width
    top =
      align === 'start'
        ? anchor.top
        : align === 'end'
          ? anchor.bottom - floating.height
          : anchor.top + (anchor.height - floating.height) / 2
  }
  return { top, left }
}

function cssAnchorInsets(side: AnchorSide, align: AnchorAlign): CSSProperties {
  const style: CSSProperties = {
    position: 'fixed',
    insetBlockStart: 'auto',
    insetInlineStart: 'auto',
  }
  if (side === 'bottom') style.top = 'anchor(bottom)'
  if (side === 'top') style.bottom = 'anchor(top)'
  if (side === 'right') style.left = 'anchor(right)'
  if (side === 'left') style.right = 'anchor(left)'
  if (side === 'top' || side === 'bottom') {
    style.left = align === 'end' ? undefined : align === 'start' ? 'anchor(left)' : 'anchor(center)'
    if (align === 'end') style.right = 'anchor(right)'
  } else {
    style.top = align === 'end' ? undefined : align === 'start' ? 'anchor(top)' : 'anchor(center)'
    if (align === 'end') style.bottom = 'anchor(bottom)'
  }
  return style
}

/**
 * Positions a floating element relative to an anchor. Primary path: CSS anchor positioning
 * (Chrome-leading) — emits `anchor-name`/`position-anchor` + `anchor()` insets. Fallback (behind
 * `CSS.supports`): JS `getBoundingClientRect` placement recomputed on scroll/resize inside
 * `useSignalEffect`. Small by design — not a collision/flip engine (deferred).
 */
export function useAnchorPosition(options: UseAnchorPositionOptions): UseAnchorPositionReturn {
  const { anchorRef, floatingRef, placement = 'bottom', enabled = true } = options
  useSignals()
  const supported = supportsCssAnchor()
  const name = useId('anchor')
  const pos = useSignal<{ top: number; left: number } | null>(null)

  useSignalEffect(() => {
    const isEnabled = typeof enabled === 'boolean' ? enabled : enabled.value
    if (supported || !isEnabled || typeof window === 'undefined') return

    const update = (): void => {
      const a = anchorRef.current
      const f = floatingRef.current
      if (!a || !f) return
      pos.value = computePosition(a.getBoundingClientRect(), f.getBoundingClientRect(), placement)
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  })

  if (supported) {
    const { side, align } = parsePlacement(placement)
    return {
      anchorStyle: { anchorName: `--${name}` } as CSSProperties,
      floatingStyle: {
        positionAnchor: `--${name}`,
        ...cssAnchorInsets(side, align),
      } as CSSProperties,
      cssAnchorSupported: true,
    }
  }

  const p = pos.value
  return {
    anchorStyle: {},
    floatingStyle: p
      ? { position: 'fixed', top: p.top, left: p.left }
      : { position: 'fixed', visibility: 'hidden' },
    cssAnchorSupported: false,
  }
}
