'use client'

import { createContext, useContext, type KeyboardEvent, type ReactNode } from 'react'
import { useSignalEffect, useSignals } from '@cascade-ui/core'
import { usePopover, type UsePopoverReturn } from '../popover/use-popover'
import styles from './menu.module.css'

const MenuContext = createContext<UsePopoverReturn | null>(null)

function useMenuContext() {
  const ctx = useContext(MenuContext)
  if (!ctx) throw new Error('Menu compound components must be inside <Menu>')
  return ctx
}

export interface MenuProps {
  children: ReactNode
}

function MenuPanel({ children }: { children: ReactNode }) {
  const { popoverRef, anchorName, isOpen } = useMenuContext()

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
}

export function MenuTrigger({ children }: MenuTriggerProps) {
  useSignals()
  const { triggerRef, toggle, anchorName, isOpen } = useMenuContext()
  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      type="button"
      aria-haspopup="menu"
      aria-expanded={isOpen.value}
      style={{ anchorName } as React.CSSProperties}
      onClick={toggle}
      className={styles.trigger}
    >
      {children}
    </button>
  )
}

export interface MenuItemProps {
  children: ReactNode
  onSelect: () => void
  disabled?: boolean
}

export function MenuItem({ children, onSelect, disabled }: MenuItemProps) {
  const { close } = useMenuContext()
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
      const prev = (e.currentTarget as HTMLElement).previousElementSibling as HTMLElement | null
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
}

export function MenuSeparator() {
  return <div role="separator" className={styles.separator} />
}
