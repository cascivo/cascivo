/**
 * @deprecated Use `Menu` instead — `cascivo add menu` on the copy-paste path, or
 * `import { Menu } from '@cascivo/react'` on the prebuilt path. Deprecated since 0.17.0;
 * keeps working for the whole 1.x line and is removed in 2.0.0.
 */
'use client'
import { cn, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import type { ReactNode } from 'react'
import { Dropdown } from '../dropdown/dropdown'
import type { DropdownItem } from '../dropdown/dropdown'
import styles from './overflow-menu.module.css'

export interface OverflowMenuItem {
  label: string
  /**
   * Item identity — what `onSelect` receives. `value` is the catalog convention for the
   * identity of an item in a collection (see the accessible-name/item-identity table in
   * `docs/AI-RULES.md`); `id` is accepted as an alias because `CommandMenu`-shaped `id`
   * is the common wrong guess and cost an adopter a compile round-trip. Pass either.
   */
  value?: string
  /** Alias of {@link OverflowMenuItem.value}. Exactly one of the two is required. */
  id?: string
  icon?: ReactNode
  /**
   * When true, disables the control and removes it from the tab order.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  disabled?: boolean
  destructive?: boolean
}

/** The item's identity, from whichever of the two accepted spellings was supplied. */
function identityOf(item: OverflowMenuItem): string {
  const value = item.value ?? item.id
  if (value === undefined) {
    throw new Error(
      `OverflowMenu: item "${item.label}" has neither \`value\` nor \`id\`. One of them is required — ` +
        'it is what `onSelect` receives.',
    )
  }
  return value
}

export interface OverflowMenuProps {
  items: OverflowMenuItem[]
  onSelect?: (value: string) => void
  /**
   * Which trigger edge the menu aligns to. `bottom-end` hangs it from the trigger's end edge
   * (right in LTR), `bottom-start` from its start edge.
   *
   * @defaultValue `bottom-end`
   * @see the component manifest
   */
  placement?: 'bottom-start' | 'bottom-end'
  /**
   * Accessible label for the component.
   *
   * @defaultValue `More actions`
   * @see the component manifest
   */
  ariaLabel?: string
  /**
   * Alias of `ariaLabel` — same invisible accessible name, the other spelling. Not rendered.
   *
   * `ariaLabel` is the catalog convention and stays preferred, but `label` is the guess an
   * adopter makes when they have not read the convention, and an unaccepted guess costs a
   * compile cycle for nothing (2026-08-21 report item 1). Pass either.
   */
  label?: string
  size?: 'sm' | 'md'
  disabled?: boolean
  /**
   * Tab-order position of the trigger. A composite widget that manages its own focus (a
   * `DataTable` in grid keyboard mode) passes `-1` so the menu stays reachable by Enter on
   * its cell without becoming an extra Tab stop.
   */
  tabIndex?: number
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
  label,
  size = 'md',
  disabled = false,
  tabIndex,
  className,
}: OverflowMenuProps) {
  useSignals()
  const resolvedAriaLabel = ariaLabel ?? label ?? t(builtin.overflowMenu.trigger)
  // Map to Dropdown's item shape. Destructive items carry a hidden marker span
  // inside the icon slot so CSS can target them via :has().
  const dropdownItems: DropdownItem[] = items.map((item) => {
    const mapped: DropdownItem = { label: item.label, value: identityOf(item) }
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
            tabIndex={tabIndex}
            aria-label={resolvedAriaLabel}
          >
            <KebabIcon />
          </button>
        }
      />
    </div>
  )
}
