'use client'
import { useId as useReactId } from 'react'

/**
 * SSR-safe stable id for aria wiring (Label/Field). Wraps React's `useId` and strips the
 * non-selector-safe colons React emits, prefixing for readability (default `cascivo`).
 */
export function useId(prefix = 'cascivo'): string {
  const id = useReactId()
  return `${prefix}-${id.replace(/:/g, '')}`
}
