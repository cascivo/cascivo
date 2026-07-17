'use client'

import {
  cn,
  DismissableLayer,
  Presence,
  useControllableSignal,
  useRovingFocus,
  useSignalEffect,
  useSignals,
} from '@cascivo/core'
import { useId, useRef } from 'react'
import type { ReactNode } from 'react'
import styles from './fab.module.css'

export interface FabAction {
  /** Stable React key. Provide when `label` may repeat across actions. */
  id?: string
  /** Accessible name and visible label for the speed-dial item. */
  label: string
  icon: ReactNode
  onSelect: () => void
  disabled?: boolean
}

export interface FabProps {
  /** The main button icon. */
  children: ReactNode
  /** Accessible name for the main button (it is icon-only). */
  label: string
  /** Called on press when there is no speed-dial. Ignored when `actions` is set. */
  onClick?: () => void
  /** Speed-dial actions revealed above the button when opened. */
  actions?: FabAction[]
  /** Screen corner to anchor to. */
  position?: 'bottom-end' | 'bottom-start'
  /** Controlled speed-dial open state. */
  open?: boolean
  /** Initial speed-dial open state for uncontrolled use. */
  defaultOpen?: boolean
  /** Called whenever the speed-dial open state should change. */
  onOpenChange?: (open: boolean) => void
  className?: string
}

/**
 * Floating action button anchored to a screen corner. On its own it is a single
 * fixed button; given `actions` it becomes a speed-dial whose main button toggles a
 * role="menu" of secondary actions (vertical roving focus, Escape / outside press to
 * collapse, focus returns to the button). Fixed position honours the safe-area insets;
 * CSS-only motion, no animation library.
 */
export function Fab({
  children,
  label,
  onClick,
  actions,
  position = 'bottom-end',
  open,
  defaultOpen,
  onOpenChange,
  className,
}: FabProps) {
  useSignals()
  const hasDial = actions != null && actions.length > 0
  const [isOpen, setOpen] = useControllableSignal<boolean>({
    value: open,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  })

  const roving = useRovingFocus({ orientation: 'vertical', loop: true })
  const fabRef = useRef<HTMLButtonElement>(null)
  const dialRef = useRef<HTMLElement>(null)
  const menuId = useId()

  // Move focus into the dial on open and back to the button on close.
  const wasOpenRef = useRef(false)
  useSignalEffect(() => {
    const next = hasDial && isOpen.value
    if (next && !wasOpenRef.current) {
      dialRef.current
        ?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')
        ?.focus()
    } else if (!next && wasOpenRef.current) {
      fabRef.current?.focus()
    }
    wasOpenRef.current = next
  })

  const selectAction = (action: FabAction): void => {
    if (action.disabled) return
    action.onSelect()
    setOpen(false)
  }

  const mainButton = (
    <button
      ref={fabRef}
      type="button"
      aria-label={label}
      className={styles['fab']}
      {...(hasDial
        ? {
            'aria-haspopup': 'menu' as const,
            'aria-expanded': isOpen.value,
            'aria-controls': menuId,
            'data-state': isOpen.value ? 'open' : 'closed',
            onClick: () => setOpen(!isOpen.value),
          }
        : { onClick })}
    >
      <span className={styles['icon']} aria-hidden="true">
        {children}
      </span>
    </button>
  )

  if (!hasDial) {
    return (
      <div className={cn(styles['root'], className)} data-position={position}>
        {mainButton}
      </div>
    )
  }

  return (
    <DismissableLayer
      onDismiss={() => setOpen(false)}
      escapeDismisses={isOpen.value}
      disableOutsidePointer={!isOpen.value}
    >
      <div className={cn(styles['root'], className)} data-position={position}>
        <Presence present={isOpen}>
          <menu ref={dialRef} id={menuId} role="menu" aria-label={label} className={styles['dial']}>
            {actions.map((action, index) => {
              const itemProps = roving.getItemProps(index)
              return (
                <li key={action.id ?? index} role="presentation" className={styles['dialItem']}>
                  <button
                    ref={itemProps.ref}
                    type="button"
                    role="menuitem"
                    tabIndex={itemProps.tabIndex}
                    aria-disabled={action.disabled || undefined}
                    className={styles['action']}
                    onKeyDown={itemProps.onKeyDown}
                    onFocus={itemProps.onFocus}
                    onClick={() => selectAction(action)}
                  >
                    <span className={styles['actionLabel']}>{action.label}</span>
                    <span className={styles['actionIcon']} aria-hidden="true">
                      {action.icon}
                    </span>
                  </button>
                </li>
              )
            })}
          </menu>
        </Presence>
        {mainButton}
      </div>
    </DismissableLayer>
  )
}
