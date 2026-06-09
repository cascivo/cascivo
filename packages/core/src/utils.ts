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
