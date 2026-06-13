'use client'

import { useRef, type ReactNode, type MouseEvent as ReactMouseEvent } from 'react'
import { useSignal, useSignalEffect, useSignals } from '@cascade-ui/core'
import styles from './context-menu.module.css'

export interface ContextMenuProps {
  children: ReactNode
}

export function ContextMenu({ children }: ContextMenuProps) {
  useSignals()
  const menuRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isOpen = useSignal(false)

  useSignalEffect(() => {
    const el = menuRef.current
    if (!el) return
    if (isOpen.value) {
      try {
        el.showPopover()
      } catch {
        /* noop */
      }
    } else {
      try {
        el.hidePopover()
      } catch {
        /* noop */
      }
    }
  })

  // Sync light-dismiss close back to signal
  useSignalEffect(() => {
    const el = menuRef.current
    if (!el) return
    const handler = (e: Event) => {
      const toggleEvent = e as ToggleEvent
      if (toggleEvent.newState === 'closed') {
        isOpen.value = false
      }
    }
    el.addEventListener('toggle', handler)
    return () => el.removeEventListener('toggle', handler)
  })

  function handleContextMenu(e: ReactMouseEvent) {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return
    container.style.setProperty('--cascivo-context-x', `${e.clientX}px`)
    container.style.setProperty('--cascivo-context-y', `${e.clientY}px`)
    isOpen.value = true
  }

  const childArray = Array.isArray(children) ? children : [children]
  const [trigger, ...menuItems] = childArray

  return (
    <div ref={containerRef} onContextMenu={handleContextMenu} className={styles.wrapper}>
      {trigger}
      <div
        ref={menuRef}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore — popover is a valid HTML attribute not yet in React types
        popover="auto"
        role="menu"
        data-state={isOpen.value ? 'open' : 'closed'}
        className={styles.menu}
      >
        {menuItems}
      </div>
    </div>
  )
}

export interface ContextMenuItemProps {
  children: ReactNode
  onSelect: () => void
  disabled?: boolean
}

export function ContextMenuItem({ children, onSelect, disabled }: ContextMenuItemProps) {
  return (
    <div
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) onSelect()
      }}
      className={styles.item}
    >
      {children}
    </div>
  )
}
