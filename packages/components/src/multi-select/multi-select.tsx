'use client'
import { useSignal, useComputed, useSignalEffect, useSignals, cn } from '@cascivo/core'
import { useRef } from 'react'
import type { HTMLAttributes } from 'react'
import { t, builtin } from '@cascivo/i18n'
import { usePopover } from '../popover/use-popover'
import styles from './multi-select.module.css'

export interface MultiSelectOption {
  label: string
  value: string
  disabled?: boolean
}

export interface MultiSelectLabels {
  placeholder?: string
  selected?: (count: number) => string
  search?: string
  noResults?: string
}

export interface MultiSelectProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: MultiSelectOption[]
  value: string[]
  onValueChange: (v: string[]) => void
  placeholder?: string
  disabled?: boolean
  labels?: MultiSelectLabels
}

export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder,
  disabled = false,
  labels,
  className,
  ...props
}: MultiSelectProps) {
  useSignals()
  const popover = usePopover({ placement: 'bottom' })
  const searchQuery = useSignal('')
  const activeIndex = useSignal(-1)
  const listboxRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const filteredOptions = useComputed(() => {
    const q = searchQuery.value.toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  })

  // Focus search input when popover opens
  useSignalEffect(() => {
    if (popover.isOpen.value) {
      activeIndex.value = -1
      setTimeout(() => searchRef.current?.focus(), 0)
    } else {
      searchQuery.value = ''
    }
  })

  // Keyboard navigation
  useSignalEffect(() => {
    const listbox = listboxRef.current
    if (!listbox || !popover.isOpen.value) return

    const handler = (e: KeyboardEvent) => {
      const opts = filteredOptions.value
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        activeIndex.value = Math.min(activeIndex.value + 1, opts.length - 1)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        activeIndex.value = Math.max(activeIndex.value - 1, -1)
      } else if (e.key === ' ' || e.key === 'Enter') {
        const opt = opts[activeIndex.value]
        if (opt && !opt.disabled) {
          e.preventDefault()
          toggleOption(opt.value)
        }
      } else if (e.key === 'Escape') {
        popover.close()
      }
    }
    listbox.addEventListener('keydown', handler)
    return () => listbox.removeEventListener('keydown', handler)
  })

  function toggleOption(optValue: string) {
    if (value.includes(optValue)) {
      onValueChange(value.filter((v) => v !== optValue))
    } else {
      onValueChange([...value, optValue])
    }
  }

  const triggerLabel =
    value.length === 0
      ? (placeholder ?? labels?.placeholder ?? t(builtin.multiSelect.placeholder))
      : labels?.selected
        ? labels.selected(value.length)
        : t(builtin.multiSelect.selected, { count: String(value.length) })

  const searchPlaceholder = labels?.search ?? t(builtin.multiSelect.search)
  const noResultsText = labels?.noResults ?? t(builtin.multiSelect.noResults)

  return (
    <div className={cn(styles['wrapper'], className)} {...props}>
      <button
        ref={popover.triggerRef as React.RefObject<HTMLButtonElement>}
        type="button"
        className={styles['trigger']}
        aria-haspopup="listbox"
        aria-expanded={popover.isOpen.value}
        disabled={disabled}
        style={{ anchorName: popover.anchorName } as React.CSSProperties}
        onClick={() => popover.toggle()}
      >
        <span className={styles['trigger-label']}>{triggerLabel}</span>
        <span className={styles['chevron']} aria-hidden="true" />
      </button>

      <div
        ref={popover.popoverRef as React.RefObject<HTMLDivElement>}
        popover="auto"
        role="listbox"
        aria-multiselectable="true"
        className={styles['panel']}
        style={
          {
            positionAnchor: popover.anchorName,
          } as React.CSSProperties
        }
        tabIndex={-1}
      >
        <div className={styles['search-row']}>
          <input
            ref={searchRef}
            type="search"
            className={styles['search']}
            placeholder={searchPlaceholder}
            value={searchQuery.value}
            onChange={(e) => {
              searchQuery.value = e.currentTarget.value
              activeIndex.value = -1
            }}
          />
        </div>

        <div ref={listboxRef} className={styles['options']}>
          {filteredOptions.value.length === 0 ? (
            <div className={styles['no-results']}>{noResultsText}</div>
          ) : (
            filteredOptions.value.map((opt, i) => (
              <div
                key={opt.value}
                role="option"
                aria-selected={value.includes(opt.value)}
                aria-disabled={opt.disabled}
                data-active={i === activeIndex.value ? '' : undefined}
                data-selected={value.includes(opt.value) ? '' : undefined}
                data-disabled={opt.disabled ? '' : undefined}
                className={styles['option']}
                onMouseDown={(e) => {
                  e.preventDefault()
                  if (!opt.disabled) toggleOption(opt.value)
                }}
                onMouseEnter={() => {
                  activeIndex.value = i
                }}
              >
                <span className={styles['checkbox']} aria-hidden="true" />
                {opt.label}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
