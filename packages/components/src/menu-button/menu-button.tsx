'use client'

import {
  cn,
  DismissableLayer,
  useAnchorPosition,
  useSignal,
  useSignalEffect,
  useSignals,
} from '@cascivo/core'
import { useId, useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import styles from './menu-button.module.css'

export interface MenuButtonItem {
  id: string
  label: ReactNode
  onSelect?: () => void
  disabled?: boolean
}

export interface MenuButtonProps {
  label: ReactNode
  items: MenuButtonItem[]
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  align?: 'start' | 'end'
  labels?: { open?: string }
  className?: string
}

function focusItem(list: HTMLElement | null, index: number): void {
  if (!list) return
  const items = list.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')
  const target = items[index < 0 ? items.length - 1 : index % items.length]
  target?.focus()
}

export function MenuButton({
  label,
  items,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  align = 'start',
  labels,
  className,
}: MenuButtonProps) {
  useSignals()
  const open = useSignal(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const { anchorStyle, floatingStyle } = useAnchorPosition({
    anchorRef: triggerRef,
    floatingRef: menuRef,
    placement: align === 'end' ? 'bottom-end' : 'bottom-start',
    enabled: open,
  })

  // Focus the first enabled item when the menu opens.
  useSignalEffect(() => {
    if (open.value) focusItem(menuRef.current, 0)
  })

  function openMenu(focusIndex: number): void {
    if (disabled) return
    open.value = true
    queueMicrotask(() => focusItem(menuRef.current, focusIndex))
  }

  function close(restoreFocus: boolean): void {
    open.value = false
    if (restoreFocus) triggerRef.current?.focus()
  }

  function handleTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>): void {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openMenu(0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      openMenu(-1)
    }
  }

  function handleItemKeyDown(e: KeyboardEvent<HTMLDivElement>): void {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = e.currentTarget.nextElementSibling as HTMLElement | null
      if (next) next.focus()
      else focusItem(menuRef.current, 0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = e.currentTarget.previousElementSibling as HTMLElement | null
      if (prev) prev.focus()
      else focusItem(menuRef.current, -1)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close(true)
    } else if (e.key === 'Tab') {
      close(false)
    }
  }

  function select(item: MenuButtonItem): void {
    if (item.disabled) return
    item.onSelect?.()
    close(true)
  }

  return (
    <div className={cn(styles['root'], className)}>
      <button
        ref={triggerRef}
        type="button"
        className={styles['trigger']}
        data-variant={variant}
        data-size={size}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open.value}
        aria-controls={menuId}
        {...(labels?.open !== undefined && { 'aria-label': labels.open })}
        style={anchorStyle}
        onClick={() => {
          if (open.value) close(false)
          else openMenu(0)
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        {label}
      </button>

      {open.value ? (
        <DismissableLayer onDismiss={() => close(true)}>
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            data-state="open"
            data-align={align}
            className={styles['menu']}
            style={floatingStyle}
          >
            {items.map((item) => (
              <div
                key={item.id}
                role="menuitem"
                tabIndex={-1}
                aria-disabled={item.disabled}
                className={styles['item']}
                onClick={() => select(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    select(item)
                  } else {
                    handleItemKeyDown(e)
                  }
                }}
              >
                {item.label}
              </div>
            ))}
          </div>
        </DismissableLayer>
      ) : null}
    </div>
  )
}
