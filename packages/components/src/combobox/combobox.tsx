'use client'
import {
  cn,
  createMachine,
  focusElement,
  useControllableSignal,
  useMachine,
  useSignal,
  useSignalEffect,
  useSignals,
} from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useId, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import styles from './combobox.module.css'

const machine = createMachine({
  initial: 'closed' as const,
  states: {
    closed: { on: { OPEN: 'open' } },
    open: { on: { CLOSE: 'closed' } },
  },
})

export interface ComboboxOption {
  value: string
  label: string
  /**
   * When true, disables the control and removes it from the tab order.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  disabled?: boolean
}

export interface ComboboxLabels {
  placeholder?: string
  empty?: string
  clear?: string
  search?: string
}

/** Join own + inherited `aria-describedby` ids; `undefined` when there are none. */
function mergeDescribedBy(...ids: (string | undefined)[]): string | undefined {
  return ids.filter(Boolean).join(' ') || undefined
}

export interface ComboboxProps {
  /**
   * Wired automatically by a wrapping `Field` — its label id. Forwarded to the focusable
   * control so the Field's label names it.
   */
  'aria-labelledby'?: string
  /**
   * Wired automatically by a wrapping `Field` — the ids of its hint/error text. **Merged**
   * with this component's own `hint`/`error` ids rather than replacing them, so both are
   * announced.
   */
  'aria-describedby'?: string
  /** Wired automatically by a wrapping `Field` when it is in an error state. */
  'aria-invalid'?: boolean
  options: ComboboxOption[]
  value?: string
  defaultValue?: string
  /** Called with the selected option value (or undefined when cleared). */
  onValueChange?: (value: string | undefined) => void
  /**
   * When true, shows a control to clear the selected value.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  clearable?: boolean
  /**
   * When true, shows a search/filter input.
   *
   * @defaultValue `true`
   * @see the component manifest
   */
  searchable?: boolean
  label?: string
  /**
   * Invisible accessible name, for when a visible element outside this component already
   * labels it and `label` would render that text a second time.
   *
   * `label` on this component is **visible**. `IconButton.label` and `Sparkline.label` are
   * invisible names, so an adopter arriving with that prior writes `label` here and gets the
   * text twice (2026-08-22 report item 13). Both props are listed side by side, each saying
   * which it is.
   */
  ariaLabel?: string
  hint?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  labels?: ComboboxLabels
  className?: string
  id?: string
}

export function Combobox({
  options,
  value,
  defaultValue,
  onValueChange,
  clearable = false,
  searchable = true,
  label,
  ariaLabel,
  hint,
  error,
  size = 'md',
  disabled = false,
  labels,
  className,
  id,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: ComboboxProps) {
  useSignals()
  const [state, send] = useMachine(machine)
  const baseId = useId()
  const inputId = id ?? (label ? `cascade-combobox-${baseId}` : `cascade-combobox-${baseId}`)
  const listboxId = `${baseId}-listbox`
  const inputRef = useRef<HTMLInputElement>(null)
  const resolvedPlaceholder = labels?.placeholder ?? t(builtin.combobox.placeholder)
  const resolvedEmpty = labels?.empty ?? t(builtin.combobox.empty)
  const resolvedClear = labels?.clear ?? t(builtin.combobox.clear)
  const resolvedSearch = labels?.search ?? t(builtin.combobox.search)

  // Controlled vs. uncontrolled selected value
  // Controlled mirror goes through the shared primitive: a bare `sig.value = prop` in render
  // notifies the previous render's subscriptions, which React 19 reports as a setState during
  // render (2026-08-08 report A). The primitive skips the write when the value is unchanged.
  const [selectedSignal] = useControllableSignal<string | undefined>({
    value,
    defaultValue,
  })

  const query = useSignal('')
  const activeIndex = useSignal(0)

  const isOpen = state.value === 'open'

  const filtered = options.filter((opt) => {
    if (!searchable || !query.value) return true
    return opt.label.toLowerCase().includes(query.value.toLowerCase())
  })

  const selectedOption = options.find((opt) => opt.value === selectedSignal.value)

  // Close on outside click
  useSignalEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      const root = document.getElementById(`${baseId}-root`)
      if (root && !root.contains(e.target as Node)) send('CLOSE')
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  })

  const open = () => {
    if (disabled) return
    query.value = ''
    activeIndex.value = 0
    send('OPEN')
    setTimeout(() => focusElement(inputRef.current), 0)
  }

  const close = () => {
    send('CLOSE')
    query.value = ''
  }

  const emitValue = onValueChange

  const select = (optValue: string) => {
    if (value === undefined) selectedSignal.value = optValue
    emitValue?.(optValue)
    close()
  }

  const clear = () => {
    if (value === undefined) selectedSignal.value = undefined
    emitValue?.(undefined)
  }

  const enabledIndexes = filtered.flatMap((opt, i) => (opt.disabled ? [] : [i]))

  const moveActive = (delta: number) => {
    if (enabledIndexes.length === 0) return
    const pos = enabledIndexes.indexOf(activeIndex.value)
    const next = enabledIndexes[(pos + delta + enabledIndexes.length) % enabledIndexes.length]
    if (next !== undefined) activeIndex.value = next
  }

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      open()
    }
  }

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        moveActive(1)
        break
      case 'ArrowUp':
        e.preventDefault()
        moveActive(-1)
        break
      case 'Enter': {
        e.preventDefault()
        const opt = filtered[activeIndex.value]
        if (opt && !opt.disabled) select(opt.value)
        break
      }
      case 'Escape':
        e.preventDefault()
        close()
        break
      case 'Tab':
        close()
        break
    }
  }

  const optionId = (i: number) => `${baseId}-option-${i}`

  return (
    <div
      id={`${baseId}-root`}
      className={cn(styles['wrapper'], className)}
      data-state={error ? 'error' : state.value}
      data-size={size}
    >
      {label && (
        <label className={styles['label']} htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={styles['field']}>
        <button
          id={inputId}
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          aria-labelledby={ariaLabelledBy}
          aria-label={ariaLabel}
          aria-activedescendant={
            isOpen && activeIndex.value >= 0 ? optionId(activeIndex.value) : undefined
          }
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={mergeDescribedBy(
            error ? `${baseId}-error` : hint ? `${baseId}-hint` : undefined,
            ariaDescribedBy,
          )}
          className={styles['trigger']}
          disabled={disabled}
          onKeyDown={handleTriggerKeyDown}
          onClick={isOpen ? close : open}
        >
          <span
            className={cn(styles['value'], !selectedOption ? styles['placeholder'] : undefined)}
          >
            {selectedOption?.label ?? resolvedPlaceholder}
          </span>
          <span className={styles['chevron']} aria-hidden="true" />
        </button>
        {clearable && selectedSignal.value !== undefined && (
          <button
            type="button"
            className={styles['clear']}
            aria-label={resolvedClear}
            onClick={(e) => {
              e.stopPropagation()
              clear()
            }}
          >
            ✕
          </button>
        )}
      </div>
      <div
        role="listbox"
        id={listboxId}
        className={styles['listbox']}
        data-state={isOpen ? 'open' : 'closed'}
        aria-label={label}
      >
        {searchable && isOpen && (
          <div className={styles['searchWrapper']}>
            <input
              ref={inputRef}
              type="text"
              className={styles['search']}
              value={query.value}
              onChange={(e) => {
                query.value = e.target.value
                activeIndex.value = 0
              }}
              onKeyDown={handleInputKeyDown}
              aria-label={resolvedSearch}
              autoComplete="off"
            />
          </div>
        )}
        {filtered.length === 0 ? (
          <div className={styles['empty']}>{resolvedEmpty}</div>
        ) : (
          filtered.map((opt, i) => (
            <div
              key={opt.value}
              id={optionId(i)}
              role="option"
              aria-selected={opt.value === selectedSignal.value}
              aria-disabled={opt.disabled || undefined}
              data-state={i === activeIndex.value ? 'active' : undefined}
              data-disabled={opt.disabled || undefined}
              className={styles['option']}
              onMouseEnter={() => {
                if (!opt.disabled) activeIndex.value = i
              }}
              onClick={() => {
                if (!opt.disabled) select(opt.value)
              }}
            >
              {opt.label}
            </div>
          ))
        )}
      </div>
      {error && (
        <span id={`${baseId}-error`} className={styles['error']} role="alert">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${baseId}-hint`} className={styles['hint']}>
          {hint}
        </span>
      )}
    </div>
  )
}
