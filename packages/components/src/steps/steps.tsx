'use client'
import { normalizeProgress, useSignal, useSignals } from '@cascivo/core'
import type { ProgressInput } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import styles from './steps.module.css'

/**
 * The catalog-wide progress vocabulary. `Timeline`'s `current` / `upcoming` are accepted as
 * aliases of `active` / `pending`, so one status enum drives both components — writing
 * `state: 'upcoming'` here used to be a type error with no hint that `pending` was the word.
 */
export type StepState = 'pending' | 'active' | 'complete' | 'error'

export interface Step {
  label: string
  /** Accepts `StepState` plus Timeline's `current` / `upcoming` aliases. */
  state?: ProgressInput
}

export interface StepsProps {
  steps: Step[]
  /**
   * Index of the currently active step (0-based)
   *
   * @defaultValue `0`
   * @see the component manifest
   */
  activeStep?: number
  orientation?: 'horizontal' | 'vertical'
  className?: string
  /** Accessible label for the steps list */
  ariaLabel?: string
}

export function Steps({
  steps,
  activeStep: controlledActiveStep,
  orientation = 'horizontal',
  className,
  ariaLabel,
}: StepsProps) {
  useSignals()
  const active = useSignal(controlledActiveStep ?? 0)
  active.value = controlledActiveStep ?? active.value
  const resolvedAriaLabel = ariaLabel ?? t(builtin.steps.label)

  return (
    <ol
      className={[styles.steps, className].filter(Boolean).join(' ')}
      data-orientation={orientation}
      aria-label={resolvedAriaLabel}
    >
      {steps.map((step, i) => {
        const state: StepState = step.state
          ? normalizeProgress(step.state)
          : i < active.value
            ? 'complete'
            : i === active.value
              ? 'active'
              : 'pending'
        return (
          <li
            key={i}
            className={styles.step}
            data-state={state}
            aria-current={state === 'active' ? 'step' : undefined}
          >
            <div className={styles.circle}>
              {state === 'complete' ? '✓' : state === 'error' ? '✕' : i + 1}
            </div>
            <span className={styles.label}>{step.label}</span>
          </li>
        )
      })}
    </ol>
  )
}
