'use client'
import { cn, Slot, useControllableSignal, useSignals } from '@cascivo/core'
import type { KeyboardEvent, ReactNode } from 'react'
import styles from './tile.module.css'

export interface TileProps {
  /** Identifies this tile within a group. */
  value: string
  /** Controlled selected state. */
  selected?: boolean
  /** Initial selected state for uncontrolled use. */
  defaultSelected?: boolean
  /** Called with this tile's value whenever it is toggled on (or off for multi). */
  onSelect?: (value: string) => void
  /** Single = radio semantics (toggle on); multi = checkbox semantics (toggle on/off). */
  selectable?: 'single' | 'multi'
  disabled?: boolean
  /** Optional leading icon/visual. */
  icon?: ReactNode
  /** Render as the child element instead of a div (Radix-style composition). */
  asChild?: boolean
  children?: ReactNode
  className?: string
}

/**
 * A selectable card. Renders with radio (single) or checkbox (multi) semantics and toggles via
 * click or Space/Enter. Selection is controllable; `data-selected` drives the visuals via CSS.
 */
export function Tile({
  value,
  selected,
  defaultSelected,
  onSelect,
  selectable = 'single',
  disabled,
  icon,
  asChild,
  children,
  className,
}: TileProps) {
  useSignals()
  const [isSelected, setSelected] = useControllableSignal<boolean>({
    value: selected,
    defaultValue: defaultSelected ?? false,
    onChange: () => onSelect?.(value),
  })

  const toggle = (): void => {
    if (disabled) return
    // Single behaves like a radio: selecting an already-selected tile keeps it selected.
    setSelected(selectable === 'multi' ? !isSelected.value : true)
  }

  const handleKeyDown = (e: KeyboardEvent<Element>): void => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      toggle()
    }
  }

  const Comp = asChild ? Slot : 'div'

  return (
    <Comp
      role={selectable === 'multi' ? 'checkbox' : 'radio'}
      aria-checked={isSelected.value}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      data-selected={isSelected.value || undefined}
      data-disabled={disabled || undefined}
      className={cn(styles['tile'], className)}
      onClick={toggle}
      onKeyDown={handleKeyDown}
    >
      {icon && (
        <span className={styles['icon']} aria-hidden="true">
          {icon}
        </span>
      )}
      <span className={styles['body']}>{children}</span>
    </Comp>
  )
}
