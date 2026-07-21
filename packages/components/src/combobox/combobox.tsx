'use client'
import {
  cn,
  createMachine,
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
  disabled?: boolean
}

export interface ComboboxLabels {
  placeholder?: string
  empty?: string
  clear?: string
  search?: string
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  defaultValue?: string
  /** Called with the selected option value (or undefined when cleared). */
  onValueChange?: (value: string | undefined) => void
  /** @deprecated Use `onValueChange` — it receives the same `string | undefined`. */
  onChange?: (value: string | undefined) => void
  clearable?: boolean
  searchable?: boolean
  label?: string
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
  onChange,
  clearable = false,
  searchable = true,
  label,
  hint,
  error,
  size = 'md',
  disabled = false,
  labels,
  className,
  id,
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
  const selectedSignal = useSignal<string | undefined>(value ?? defaultValue)
  if (value !== undefined) selectedSignal.value = value

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
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const close = () => {
    send('CLOSE')
    query.value = ''
  }

  const emitValue = onValueChange ?? onChange

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
          aria-activedescendant={
            isOpen && activeIndex.value >= 0 ? optionId(activeIndex.value) : undefined
          }
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${baseId}-error` : hint ? `${baseId}-hint` : undefined}
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
