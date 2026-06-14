'use client'
import { useRef } from 'react'
import { useSignal, useSignalEffect, type ReadonlySignal } from './signals.ts'

export interface UseClipboardOptions {
  /** How long `copied` stays true after a successful copy, in ms. */
  timeout?: number
}

export interface UseClipboardReturn {
  copied: ReadonlySignal<boolean>
  copy: (text: string) => Promise<void>
}

/**
 * Copy-to-clipboard helper that de-dupes the inline logic in `copy-button`.
 * `copy(text)` writes via `navigator.clipboard.writeText`; `copied` flips true then resets after
 * `timeout`. The reset timer is cleared on unmount via `useSignalEffect` (no `useEffect`).
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const { timeout = 2000 } = options
  const copied = useSignal(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useSignalEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  })

  const copy = async (text: string): Promise<void> => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    await navigator.clipboard.writeText(text)
    copied.value = true
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      copied.value = false
    }, timeout)
  }

  return { copied, copy }
}
