'use client'
import { useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useSignal, useSignalEffect } from './signals.ts'

export interface PortalProps {
  children: ReactNode
  container?: Element | DocumentFragment
}

export function Portal({ children, container }: PortalProps) {
  const mounted = useSignal(false)
  const containerRef = useRef<Element | null>(null)

  useSignalEffect(() => {
    if (typeof document === 'undefined') return
    containerRef.current = container ?? document.body
    mounted.value = true
    return () => { mounted.value = false }
  })

  if (!mounted.value || containerRef.current === null) return null
  return createPortal(children, containerRef.current)
}
