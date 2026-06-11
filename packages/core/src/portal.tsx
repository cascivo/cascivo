'use client'
import { useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useSignal, useSignalEffect, useSignals } from './signals.ts'

export interface PortalProps {
  children: ReactNode
  container?: Element | DocumentFragment
}

export function Portal({ children, container }: PortalProps) {
  useSignals()
  const mounted = useSignal(false)
  const containerRef = useRef<Element | DocumentFragment | null>(null)

  useSignalEffect(() => {
    if (typeof document === 'undefined') return
    containerRef.current = container ?? document.body
    mounted.value = true
    return () => {
      mounted.value = false
    }
  })

  if (!mounted.value || containerRef.current === null) return null
  return createPortal(children, containerRef.current)
}
