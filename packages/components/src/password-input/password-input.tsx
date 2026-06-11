'use client'
import { useSignal, cn } from '@cascade-ui/core'
import { useRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { t, builtin } from '@cascade-ui/i18n'
import styles from './password-input.module.css'

export interface PasswordInputLabels {
  reveal?: string
  hide?: string
  strengthLabel?: (level: string) => string
}

export interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  showStrengthMeter?: boolean
  size?: 'sm' | 'md' | 'lg'
  labels?: PasswordInputLabels
}

function getStrengthLevel(value: string): { score: number; label: string } {
  if (!value) return { score: 0, label: 'weak' }
  let score = 0
  if (/[a-z]/.test(value)) score++
  if (/[A-Z]/.test(value)) score++
  if (/[0-9]/.test(value)) score++
  if (/[^a-zA-Z0-9]/.test(value)) score++
  if (value.length >= 12) score = Math.min(4, score + 1)
  score = Math.min(4, score)
  const labels = ['weak', 'weak', 'fair', 'good', 'strong'] as const
  return { score, label: labels[score] }
}

export function PasswordInput({
  showStrengthMeter = false,
  size = 'md',
  labels,
  className,
  id,
  value,
  defaultValue,
  onChange,
  ...props
}: PasswordInputProps) {
  const isRevealed = useSignal(false)
  const inputValue = useSignal(
    typeof value === 'string' ? value : typeof defaultValue === 'string' ? defaultValue : '',
  )

  // Sync controlled value
  if (typeof value === 'string') {
    inputValue.value = value
  }

  const inputId =
    id ?? `cascade-password-${Math.random().toString(36).slice(2, 8)}`
  const idRef = useRef(inputId)

  const strength = showStrengthMeter ? getStrengthLevel(inputValue.value) : null

  const revealLabel = isRevealed.value
    ? (labels?.hide ?? t(builtin.passwordInput.hide))
    : (labels?.reveal ?? t(builtin.passwordInput.reveal))

  const strengthLabelStr = strength
    ? (labels?.strengthLabel
        ? labels.strengthLabel(strength.label)
        : t(builtin.passwordInput.strengthLabel, { level: strength.label }))
    : undefined

  return (
    <div
      className={cn(styles['wrapper'], className)}
      data-size={size}
      data-revealed={isRevealed.value ? '' : undefined}
    >
      <div className={styles['input-row']}>
        <input
          {...props}
          id={idRef.current}
          type={isRevealed.value ? 'text' : 'password'}
          className={styles['input']}
          value={value}
          defaultValue={defaultValue}
          onChange={(e) => {
            if (typeof value !== 'string') {
              inputValue.value = e.currentTarget.value
            }
            onChange?.(e)
          }}
        />
        <button
          type="button"
          className={styles['reveal-btn']}
          aria-label={revealLabel}
          onClick={() => {
            isRevealed.value = !isRevealed.value
          }}
          tabIndex={0}
        >
          <span className={styles['reveal-icon']} aria-hidden="true" />
        </button>
      </div>
      {showStrengthMeter && strength && (
        <div
          className={styles['strength-meter']}
          aria-label={strengthLabelStr}
          data-strength={strength.label}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={styles['strength-segment']}
              data-filled={i < strength.score ? '' : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
