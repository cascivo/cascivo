'use client'
import { cn, createMachine, useMachine, useSignal, useSignals } from '@cascade-ui/core'
import type { InputHTMLAttributes, KeyboardEvent } from 'react'
import styles from './number-input.module.css'

const machine = createMachine({
  initial: 'idle' as const,
  states: {
    idle: { on: { FOCUS: 'focused' } },
    focused: { on: { BLUR: 'idle' } },
  },
})

export interface NumberInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'type' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'step'
> {
  value?: number | null
  defaultValue?: number
  onChange?: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  precision?: number
  formatOptions?: Intl.NumberFormatOptions
  label?: string
  hint?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  incrementLabel?: string
  decrementLabel?: string
}

function clamp(value: number, min?: number, max?: number): number {
  let result = value
  if (min !== undefined) result = Math.max(result, min)
  if (max !== undefined) result = Math.min(result, max)
  return result
}

function decimalsOf(value: number): number {
  const text = String(value)
  const dot = text.indexOf('.')
  return dot === -1 ? 0 : text.length - dot - 1
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function parseText(text: string): number | null {
  const trimmed = text.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export function NumberInput({
  value,
  defaultValue,
  onChange,
  min,
  max,
  step = 1,
  precision,
  formatOptions,
  label,
  hint,
  error,
  size = 'md',
  disabled,
  incrementLabel = 'Increment',
  decrementLabel = 'Decrement',
  className,
  id,
  onFocus,
  onBlur,
  onKeyDown,
  ...props
}: NumberInputProps) {
  useSignals()
  const [state, send] = useMachine(machine)
  const isControlled = value !== undefined
  const committed = useSignal<number | null>(defaultValue ?? null)
  const text = useSignal('')

  const current = isControlled ? value : committed.value
  const inputId =
    id ?? (label ? `cascade-number-input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

  const setValue = (next: number | null) => {
    if (!isControlled) committed.value = next
    text.value = next == null ? '' : String(next)
    if (next !== current) onChange?.(next)
  }

  const commitText = () => {
    let next = parseText(text.value)
    if (next != null) {
      next = clamp(next, min, max)
      if (precision !== undefined) next = roundTo(next, precision)
    }
    setValue(next)
  }

  const stepBy = (direction: 1 | -1) => {
    const base = (state.value === 'focused' ? parseText(text.value) : current) ?? 0
    const decimals = precision ?? Math.max(decimalsOf(step), decimalsOf(base))
    setValue(clamp(roundTo(base + direction * step, decimals), min, max))
  }

  const format = (next: number | null): string => {
    if (next == null) return ''
    return formatOptions
      ? new Intl.NumberFormat(undefined, formatOptions).format(next)
      : String(next)
  }

  const display = state.value === 'focused' ? text.value : format(current)
  const atMax = current != null && max !== undefined && current >= max
  const atMin = current != null && min !== undefined && current <= min

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      stepBy(1)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      stepBy(-1)
    } else if (event.key === 'Enter') {
      commitText()
    }
    onKeyDown?.(event)
  }

  return (
    <div
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
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          role="spinbutton"
          className={styles['input']}
          value={display}
          disabled={disabled}
          aria-valuenow={current ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          onChange={(e) => {
            text.value = e.target.value
          }}
          onFocus={(e) => {
            text.value = current == null ? '' : String(current)
            send('FOCUS')
            onFocus?.(e)
          }}
          onBlur={(e) => {
            commitText()
            send('BLUR')
            onBlur?.(e)
          }}
          onKeyDown={handleKeyDown}
          {...props}
        />
        <div className={styles['steppers']}>
          <button
            type="button"
            className={styles['stepper']}
            aria-label={incrementLabel}
            tabIndex={-1}
            disabled={disabled || atMax}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => stepBy(1)}
          >
            <svg viewBox="0 0 10 10" aria-hidden="true" focusable="false">
              <path
                d="M2 6.5 5 3.5 8 6.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className={styles['stepper']}
            aria-label={decrementLabel}
            tabIndex={-1}
            disabled={disabled || atMin}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => stepBy(-1)}
          >
            <svg viewBox="0 0 10 10" aria-hidden="true" focusable="false">
              <path
                d="M2 3.5 5 6.5 8 3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
      {error && (
        <span id={`${inputId}-error`} className={styles['error']} role="alert">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${inputId}-hint`} className={styles['hint']}>
          {hint}
        </span>
      )}
    </div>
  )
}
