'use client'
import { useSignal, useSignals, cn } from '@cascivo/core'
import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { t, builtin } from '@cascivo/i18n'
import styles from './password-input.module.css'

export interface PasswordInputLabels {
  reveal?: string
  hide?: string
  strengthLabel?: (level: string) => string
}

export interface PasswordInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> {
  /**
   * When true, shows a password-strength meter.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  showStrengthMeter?: boolean
  size?: 'sm' | 'md' | 'lg'
  labels?: PasswordInputLabels
}

function getStrengthLevel(value: string): {
  score: number
  label: 'weak' | 'fair' | 'good' | 'strong'
} {
  if (!value) return { score: 0, label: 'weak' }
  let score = 0
  if (/[a-z]/.test(value)) score++
  if (/[A-Z]/.test(value)) score++
  if (/[0-9]/.test(value)) score++
  if (/[^a-zA-Z0-9]/.test(value)) score++
  if (value.length >= 12) score = Math.min(4, score + 1)
  score = Math.min(4, score)
  const levels = ['weak', 'weak', 'fair', 'good', 'strong'] as const
  return { score, label: levels[score]! }
}

/**
 * `forwardRef` so `ref` reaches the underlying `<input>` — and so it is TYPED. See
 * `textarea.tsx` for the full rationale (2026-07-28 report C10). Enforced by
 * `ref-parity.test.ts`, which found this component: the plan's own list of 16 was itself
 * incomplete, which is why the rule is a guard and not a checklist.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      showStrengthMeter = false,
      size = 'md',
      labels,
      className,
      id,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref,
  ) {
    useSignals()
    const isRevealed = useSignal(false)
    const inputValue = useSignal(
      typeof value === 'string' ? value : typeof defaultValue === 'string' ? defaultValue : '',
    )

    // Sync controlled value during render
    if (typeof value === 'string') {
      inputValue.value = value
    }

    const generatedId = useId()
    const inputId = id ?? `cascade-password-${generatedId}`

    const strength = showStrengthMeter ? getStrengthLevel(inputValue.value) : null

    const revealLabel = isRevealed.value
      ? (labels?.hide ?? t(builtin.passwordInput.hide))
      : (labels?.reveal ?? t(builtin.passwordInput.reveal))

    const strengthLabelStr = strength
      ? labels?.strengthLabel
        ? labels.strengthLabel(strength.label)
        : t(builtin.passwordInput.strengthLabel, { level: strength.label })
      : undefined

    return (
      <div
        className={cn(styles['wrapper'], className)}
        data-size={size}
        data-revealed={isRevealed.value ? '' : undefined}
      >
        <div className={styles['input-row']}>
          <input
            ref={ref as never}
            {...props}
            id={inputId}
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
          >
            <span className={styles['reveal-icon']} aria-hidden="true" />
          </button>
        </div>
        {showStrengthMeter && strength && (
          <div
            className={styles['strength-meter']}
            role="meter"
            aria-label={strengthLabelStr}
            aria-valuenow={strength.score}
            aria-valuemin={0}
            aria-valuemax={4}
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
  },
)
