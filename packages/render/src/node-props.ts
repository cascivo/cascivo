import { translateKey } from '@cascivo/i18n'
import type { PropValue, TranslationRef } from './types'

/**
 * Unwrap a DOM event into the value a `$state.set` handler should store. A
 * checkbox/radio contributes its `checked`; any other input its `value`; a plain
 * value (a component that already emits the value) passes through untouched.
 */
export function coerceEventValue(arg: unknown): unknown {
  if (arg && typeof arg === 'object' && 'target' in arg) {
    const target = (arg as { target: unknown }).target
    if (target && typeof target === 'object') {
      const t = target as { type?: string; checked?: boolean; value?: unknown }
      if (t.type === 'checkbox' || t.type === 'radio') return t.checked
      if ('value' in t) return t.value
    }
  }
  return arg
}

export function isTranslationRef(v: unknown): v is TranslationRef {
  return (
    typeof v === 'object' && v !== null && '$t' in v && typeof (v as TranslationRef).$t === 'string'
  )
}

/** Resolve a dot-path like "users.active" against a data object. */
export function getPath(data: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = data
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

export function resolvePropValue(value: PropValue): unknown {
  if (isTranslationRef(value)) {
    return translateKey(value.$t, value.params)
  }
  if (Array.isArray(value)) {
    return value.map((v) => resolvePropValue(v))
  }
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, resolvePropValue(v as PropValue)]),
    )
  }
  return value
}
