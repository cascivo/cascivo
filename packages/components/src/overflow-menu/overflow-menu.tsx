/**
 * @deprecated OverflowMenu is deprecated. Use Menu from @cascade-ui/components/menu instead.
 * OverflowMenu is kept for registry compatibility and will be removed in v4.
 */
'use client'
import { cn, useSignals } from '@cascade-ui/core'
import { builtin, t } from '@cascade-ui/i18n'
import type { ReactNode } from 'react'
import { Dropdown, type DropdownItem } from '../dropdown/dropdown'
import styles from './overflow-menu.module.css'

export interface OverflowMenuItem {
  label: string
  value: string
  icon?: ReactNode
  disabled?: boolean
  destructive?: boolean
}

export interface OverflowMenuProps {
  items: OverflowMenuItem[]
  onSelect?: (value: string) => void
  placement?: 'bottom-start' | 'bottom-end'
  ariaLabel?: string
  size?: 'sm' | 'md'
  disabled?: boolean
  className?: string
}

function KebabIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
      <circle cx="8" cy="3" r="1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="8" cy="13" r="1.5" />
    </svg>
  )
}

export function OverflowMenu({
  items,
  onSelect,
  placement = 'bottom-end',
  ariaLabel,
  size = 'md',
  disabled = false,
  className,
}: OverflowMenuProps) {
  useSignals()
  const resolvedAriaLabel = ariaLabel ?? t(builtin.overflowMenu.trigger)
  // Map to Dropdown's item shape. Destructive items carry a hidden marker span
  // inside the icon slot so CSS can target them via :has().
  const dropdownItems: DropdownItem[] = items.map((item) => {
    const mapped: DropdownItem = { label: item.label, value: item.value }
    if (item.disabled !== undefined) mapped.disabled = item.disabled
    if (item.destructive) {
      mapped.icon = (
        <>
          {item.icon}
          <span className={styles['destructive-flag']} aria-hidden="true" />
        </>
      )
    } else if (item.icon !== undefined) {
      mapped.icon = item.icon
    }
    return mapped
  })

  return (
    <div className={cn(styles['root'], className)}>
      <Dropdown
        items={dropdownItems}
        onSelect={(value) => onSelect?.(value)}
        placement={placement}
        trigger={
          <button
            type="button"
            className={styles['trigger']}
            data-size={size}
            disabled={disabled}
            aria-label={resolvedAriaLabel}
          >
            <KebabIcon />
          </button>
        }
      />
    </div>
  )
}
