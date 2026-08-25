'use client'

import { createContext } from 'react'
import type { ReactNode } from 'react'
import { Slot, useSignals } from '@cascivo/core'
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
  /**
   * Render the single child element as the trigger instead of wrapping it in
   * `PopoverTrigger`'s own `<button>` — the Slot pattern. Use this whenever the child is
   * already an interactive element (`Button`, `IconButton`, a router link): nesting a
   * `<button>` inside a `<button>` is invalid HTML, and it orphans the inner element's
   * `aria-label` on a node the accessibility tree does not expect there.
   *
   * ```tsx
   * <PopoverTrigger asChild>
   *   <IconButton label="Theme" icon={<Palette />} />
   * </PopoverTrigger>
   * ```
   */
  asChild?: boolean
}

export function PopoverTrigger({ children, asChild = false }: PopoverTriggerProps) {
  useSignals()
  // Matches `icon-button.tsx` — including `type` only on the real <button>, since a
  // slotted <a> or router link must not receive it.
  const Comp = asChild ? Slot : 'button'
  return (
    <PopoverContext.Consumer>
      {(ctx) => {
        if (!ctx) throw new Error('PopoverTrigger must be used inside <Popover>')
        const { triggerRef, toggle, anchorName, isOpen } = ctx
        return (
          <Comp
            ref={triggerRef as React.RefObject<HTMLButtonElement>}
            type={asChild ? undefined : 'button'}
            aria-expanded={isOpen.value}
            aria-haspopup="dialog"
            style={{ anchorName } as React.CSSProperties}
            onClick={toggle}
            className={styles.trigger}
          >
            {children}
          </Comp>
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
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            popover="auto"
            role="dialog"
            data-state={isOpen.value ? 'open' : 'closed'}
            style={{ positionAnchor: anchorName } as React.CSSProperties}
            className={[styles.content, className].filter(Boolean).join(' ')}
          >
            {children}
          </div>
        )
      }}
    </PopoverContext.Consumer>
  )
}
