'use client'

import { createContext, useRef } from 'react'
import type { ReactNode } from 'react'
import { useSignalEffect, useSignals } from '@cascivo/core'
import { usePopover } from '../popover/use-popover'
import type { UsePopoverReturn } from '../popover/use-popover'
import styles from './hover-card.module.css'

const HoverCardContext = createContext<UsePopoverReturn | null>(null)

export interface HoverCardProps {
  children: ReactNode
  openDelay?: number
  closeDelay?: number
}

export function HoverCard({ children, openDelay = 300, closeDelay = 100 }: HoverCardProps) {
  const popover = usePopover()
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const openDelayRef = useRef(openDelay)
  openDelayRef.current = openDelay
  const closeDelayRef = useRef(closeDelay)
  closeDelayRef.current = closeDelay

  const contextValue = {
    ...popover,
    open: () => {
      clearTimeout(closeTimer.current)
      openTimer.current = setTimeout(() => {
        popover.isOpen.value = true
      }, openDelayRef.current)
    },
    close: () => {
      clearTimeout(openTimer.current)
      closeTimer.current = setTimeout(() => {
        popover.isOpen.value = false
      }, closeDelayRef.current)
    },
  }

  // Cleanup timers on unmount
  useSignalEffect(() => {
    return () => {
      clearTimeout(openTimer.current)
      clearTimeout(closeTimer.current)
    }
  })

  return <HoverCardContext.Provider value={contextValue}>{children}</HoverCardContext.Provider>
}

export interface HoverCardTriggerProps {
  children: ReactNode
}

function HoverCardTriggerInner({ ctx, children }: { ctx: UsePopoverReturn; children: ReactNode }) {
  useSignals()
  const { triggerRef, anchorName, open, close } = ctx
  return (
    <span
      ref={triggerRef as React.RefObject<HTMLSpanElement>}
      style={{ anchorName } as React.CSSProperties}
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={close}
      className={styles.trigger}
    >
      {children}
    </span>
  )
}

export function HoverCardTrigger({ children }: HoverCardTriggerProps) {
  return (
    <HoverCardContext.Consumer>
      {(ctx) => {
        if (!ctx) throw new Error('HoverCardTrigger must be inside <HoverCard>')
        return <HoverCardTriggerInner ctx={ctx}>{children}</HoverCardTriggerInner>
      }}
    </HoverCardContext.Consumer>
  )
}

export interface HoverCardContentProps {
  children: ReactNode
  className?: string
}

function HoverCardContentInner({
  ctx,
  children,
  className,
}: {
  ctx: UsePopoverReturn
  children: ReactNode
  className?: string
}) {
  useSignals()
  const { popoverRef, anchorName, isOpen, open, close } = ctx
  return (
    <div
      ref={popoverRef as React.RefObject<HTMLDivElement>}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — popover is a valid HTML attribute not yet in React types
      popover="auto"
      role="complementary"
      data-state={isOpen.value ? 'open' : 'closed'}
      style={{ positionAnchor: anchorName } as React.CSSProperties}
      onMouseEnter={open}
      onMouseLeave={close}
      className={[styles.content, className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  )
}

export function HoverCardContent({ children, className }: HoverCardContentProps) {
  return (
    <HoverCardContext.Consumer>
      {(ctx) => {
        if (!ctx) throw new Error('HoverCardContent must be inside <HoverCard>')
        return (
          <HoverCardContentInner ctx={ctx} {...(className !== undefined && { className })}>
            {children}
          </HoverCardContentInner>
        )
      }}
    </HoverCardContext.Consumer>
  )
}
