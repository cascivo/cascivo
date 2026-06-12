'use client'

import { createContext, type KeyboardEvent, type ReactNode } from 'react'
import { useSignalEffect, useSignals } from '@cascade-ui/core'
import { usePopover, type UsePopoverReturn } from '../popover/use-popover'
import styles from './menu.module.css'

const MenuContext = createContext<UsePopoverReturn | null>(null)

export interface MenuProps {
  children: ReactNode
}

function MenuPanelInner({ ctx, children }: { ctx: UsePopoverReturn; children: ReactNode }) {
  useSignals()
  const { popoverRef, anchorName, isOpen } = ctx

  useSignalEffect(() => {
    if (!isOpen.value) return
    const panel = popoverRef.current
    if (!panel) return
    const first = panel.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')
    first?.focus()
  })

  return (
    <div
      ref={popoverRef as React.RefObject<HTMLDivElement>}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — popover is a valid HTML attribute not yet in React types
      popover="auto"
      role="menu"
      data-state={isOpen.value ? 'open' : 'closed'}
      style={{ positionAnchor: anchorName } as React.CSSProperties}
      className={styles.panel}
    >
      {children}
    </div>
  )
}

function MenuPanel({ children }: { children: ReactNode }) {
  return (
    <MenuContext.Consumer>
      {(ctx) => {
        if (!ctx) throw new Error('MenuPanel must be inside <Menu>')
        return <MenuPanelInner ctx={ctx}>{children}</MenuPanelInner>
      }}
    </MenuContext.Consumer>
  )
}

export function Menu({ children }: MenuProps) {
  const popover = usePopover()
  const childArray = Array.isArray(children) ? children : [children]
  const [trigger, ...items] = childArray
  return (
    <MenuContext.Provider value={popover}>
      {trigger}
      <MenuPanel>{items}</MenuPanel>
    </MenuContext.Provider>
  )
}

export interface MenuTriggerProps {
  children: ReactNode
  'aria-label'?: string
}

function MenuTriggerInner({
  ctx,
  children,
  'aria-label': ariaLabel,
}: {
  ctx: UsePopoverReturn
  children: ReactNode
  'aria-label'?: string
}) {
  useSignals()
  const { triggerRef, toggle, anchorName, isOpen } = ctx
  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      type="button"
      aria-haspopup="menu"
      aria-expanded={isOpen.value}
      aria-label={ariaLabel}
      style={{ anchorName } as React.CSSProperties}
      onClick={toggle}
      className={styles.trigger}
    >
      {children}
    </button>
  )
}

export function MenuTrigger({ children, 'aria-label': ariaLabel }: MenuTriggerProps) {
  return (
    <MenuContext.Consumer>
      {(ctx) => {
        if (!ctx) throw new Error('MenuTrigger must be inside <Menu>')
        return (
          <MenuTriggerInner ctx={ctx} {...(ariaLabel !== undefined && { 'aria-label': ariaLabel })}>
            {children}
          </MenuTriggerInner>
        )
      }}
    </MenuContext.Consumer>
  )
}

export interface MenuItemProps {
  children: ReactNode
  onSelect: () => void
  disabled?: boolean
}

export function MenuItem({ children, onSelect, disabled }: MenuItemProps) {
  return (
    <MenuContext.Consumer>
      {(ctx) => {
        if (!ctx) throw new Error('MenuItem must be inside <Menu>')
        const { close } = ctx
        function handleClick() {
          if (disabled) return
          onSelect()
          close()
        }
        function handleKeyDown(e: KeyboardEvent) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            const next = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement | null
            next?.focus()
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            const prev = (e.currentTarget as HTMLElement)
              .previousElementSibling as HTMLElement | null
            prev?.focus()
          }
        }
        return (
          <div
            role="menuitem"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className={styles.item}
          >
            {children}
          </div>
        )
      }}
    </MenuContext.Consumer>
  )
}

export function MenuSeparator() {
  return <div role="separator" className={styles.separator} />
}
