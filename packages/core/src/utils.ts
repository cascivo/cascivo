import type { Ref, RefCallback, MutableRefObject } from 'react'

export function cn(...classes: (string | undefined | null | false | 0)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function composeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (!ref) return
      if (typeof ref === 'function') {
        ref(value)
      } else {
        ;(ref as MutableRefObject<T | null>).current = value
      }
    })
  }
}

/**
 * Focus whatever a ref actually ended up pointing at. Returns whether it worked.
 *
 * `ref.current` is not always a DOM node. When a component clones a **consumer-supplied**
 * element and attaches a ref to it — `Dropdown`'s `trigger`, `Tooltip`'s `trigger` — the
 * element is usually a function component (`<Button>`). React 19 forwards `ref` to it as an
 * ordinary prop, the component spreads it onto its host element, and `.current` is the DOM
 * node. Under `preact/compat` the same ref resolves to the **component instance** instead,
 * so `ref.current.focus` is undefined and `ref.current?.focus()` throws
 * `TypeError: u.current?.focus is not a function` — on every dropdown interaction, which is
 * what any developer evaluating cascivo with devtools open sees first (2026-07-28 report
 * C9).
 *
 * One helper so there is one place to teach about the next runtime difference, rather than
 * sixteen call sites each deciding. Preact exposes the rendered node as `base`; the guard
 * is duck-typed rather than `instanceof HTMLElement` so it also works across realms (an
 * iframe or a jsdom window whose `HTMLElement` is a different constructor).
 */
export function focusElement(target: unknown, options?: FocusOptions): boolean {
  const candidates = [
    target,
    (target as { base?: unknown } | null | undefined)?.base,
    (target as { _dom?: unknown } | null | undefined)?._dom,
  ]
  for (const candidate of candidates) {
    const focus = (candidate as { focus?: unknown } | null | undefined)?.focus
    if (typeof focus === 'function') {
      ;(focus as (o?: FocusOptions) => void).call(candidate, options)
      return true
    }
  }
  return false
}

type EventHandler = (...args: unknown[]) => unknown

export function mergeProps<T extends Record<string, unknown>>(...propsList: Partial<T>[]): T {
  const result: Record<string, unknown> = {}
  for (const props of propsList) {
    for (const [key, val] of Object.entries(props)) {
      if (key.startsWith('on') && typeof val === 'function' && typeof result[key] === 'function') {
        const existing = result[key] as EventHandler
        result[key] = (...args: unknown[]) => {
          existing(...args)
          ;(val as EventHandler)(...args)
        }
      } else {
        result[key] = val
      }
    }
  }
  return result as T
}
