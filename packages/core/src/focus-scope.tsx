'use client'
import { useRef, type ReactNode } from 'react'
import { useSignalEffect, useSignals } from './signals.ts'

const FOCUSABLE =
  'a[href],area[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),[tabindex]:not([tabindex="-1"])'

export interface FocusScopeProps {
  children: ReactNode
  trapped?: boolean
  restoreFocus?: boolean
  autoFocus?: boolean
}

export function FocusScope({ children, trapped, restoreFocus, autoFocus }: FocusScopeProps) {
  useSignals()
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<Element | null>(null)

  useSignalEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (restoreFocus) previousFocusRef.current = document.activeElement
    if (autoFocus) {
      const first = container.querySelector<HTMLElement>(FOCUSABLE)
      first?.focus()
    }
    if (!trapped) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const focusable = Array.from(container!.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusable.length === 0) return
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (restoreFocus && previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus()
      }
    }
  })

  return <div ref={containerRef}>{children}</div>
}
