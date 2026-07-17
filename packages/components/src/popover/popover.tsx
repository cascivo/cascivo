'use client'

import { createContext } from 'react'
import type { ReactNode } from 'react'
import { useSignals } from '@cascivo/core'
import { usePopover } from './use-popover'
import type { UsePopoverOptions, UsePopoverReturn } from './use-popover'
import styles from './popover.module.css'

const PopoverContext = createContext<UsePopoverReturn | null>(null)

export interface PopoverProps extends UsePopoverOptions {
  children: ReactNode
}

export function Popover({ children, ...options }: PopoverProps) {
  const popover = usePopover(options)
  return <PopoverContext.Provider value={popover}>{children}</PopoverContext.Provider>
}

export interface PopoverTriggerProps {
  children: ReactNode
  asChild?: boolean
}

export function PopoverTrigger({ children }: PopoverTriggerProps) {
  useSignals()
  return (
    <PopoverContext.Consumer>
      {(ctx) => {
        if (!ctx) throw new Error('PopoverTrigger must be used inside <Popover>')
        const { triggerRef, toggle, anchorName, isOpen } = ctx
        return (
          <button
            ref={triggerRef as React.RefObject<HTMLButtonElement>}
            type="button"
            aria-expanded={isOpen.value}
            aria-haspopup="dialog"
            style={{ anchorName }}
            onClick={toggle}
            className={styles.trigger}
          >
            {children}
          </button>
        )
      }}
    </PopoverContext.Consumer>
  )
}

export interface PopoverContentProps {
  children: ReactNode
  className?: string
}

export function PopoverContent({ children, className }: PopoverContentProps) {
  useSignals()
  return (
    <PopoverContext.Consumer>
      {(ctx) => {
        if (!ctx) throw new Error('PopoverContent must be used inside <Popover>')
        const { popoverRef, anchorName, isOpen } = ctx
        return (
          <div
            ref={popoverRef as React.RefObject<HTMLDivElement>}
            // @ts-ignore — popover is a valid HTML attribute not yet in React types
            popover="auto"
            role="dialog"
            data-state={isOpen.value ? 'open' : 'closed'}
            style={{ positionAnchor: anchorName }}
            className={[styles.content, className].filter(Boolean).join(' ')}
          >
            {children}
          </div>
        )
      }}
    </PopoverContext.Consumer>
  )
}
