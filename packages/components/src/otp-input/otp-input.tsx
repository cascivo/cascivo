'use client'
import { useSignal, useSignals, cn } from '@cascivo/core'
import { useRef } from 'react'
import type { HTMLAttributes } from 'react'
import { t, builtin } from '@cascivo/i18n'
import styles from './otp-input.module.css'

export interface OtpInputProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  length?: number
  value: string
  onValueChange: (v: string) => void
  disabled?: boolean
  type?: 'numeric' | 'alphanumeric'
}

export function OtpInput({
  length = 6,
  value,
  onValueChange,
  disabled = false,
  type = 'numeric',
  className,
  ...props
}: OtpInputProps) {
  useSignals()
  const slots = useSignal<string[]>(Array.from({ length }, (_, i) => value[i] ?? ''))
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  // Sync controlled value into slots during render
  const newSlots = Array.from({ length }, (_, i) => value[i] ?? '')
  if (JSON.stringify(slots.value) !== JSON.stringify(newSlots)) {
    slots.value = newSlots
  }

  function notifyChange(updatedSlots: string[]) {
    onValueChange(updatedSlots.join(''))
    slots.value = updatedSlots
  }

  function focusSlot(index: number) {
    const clamped = Math.max(0, Math.min(length - 1, index))
    inputRefs.current[clamped]?.focus()
  }

  function handleInput(index: number, char: string) {
    const pattern = type === 'numeric' ? /^\d$/ : /^[a-zA-Z0-9]$/
    if (!pattern.test(char)) return
    const updated = [...slots.value]
    updated[index] = char
    notifyChange(updated)
    if (index < length - 1) focusSlot(index + 1)
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const updated = [...slots.value]
      if (updated[index]) {
        updated[index] = ''
        notifyChange(updated)
      } else if (index > 0) {
        updated[index - 1] = ''
        notifyChange(updated)
        focusSlot(index - 1)
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusSlot(index - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusSlot(index + 1)
    }
  }

  function handlePaste(index: number, e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\s/g, '')
      .slice(0, length - index)
    const pattern = type === 'numeric' ? /^\d+$/ : /^[a-zA-Z0-9]+$/
    if (!pattern.test(pasted)) return
    const updated = [...slots.value]
    for (let i = 0; i < pasted.length; i++) {
      if (index + i < length) updated[index + i] = pasted[i] ?? ''
    }
    notifyChange(updated)
    focusSlot(Math.min(index + pasted.length, length - 1))
  }

  const ariaLabel = t(builtin.otpInput.label)

  return (
    <div
      className={cn(styles['wrapper'], className)}
      role="group"
      aria-label={ariaLabel}
      {...props}
    >
      {slots.value.map((slot, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el
          }}
          type={type === 'numeric' ? 'tel' : 'text'}
          inputMode={type === 'numeric' ? 'numeric' : 'text'}
          className={styles['slot']}
          value={slot}
          maxLength={1}
          aria-label={t(builtin.otpInput.digit, { n: String(i + 1) })}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          disabled={disabled}
          data-filled={slot ? '' : undefined}
          onChange={(e) => {
            const val = e.currentTarget.value.slice(-1)
            if (val) handleInput(i, val)
          }}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.currentTarget.select()}
        />
      ))}
    </div>
  )
}
