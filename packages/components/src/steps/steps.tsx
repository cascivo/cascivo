'use client'
import { useSignal, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import styles from './steps.module.css'

export type StepState = 'pending' | 'active' | 'complete' | 'error'

export interface Step {
  label: string
  state?: StepState
}

export interface StepsProps {
  steps: Step[]
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
        const state: StepState =
          step.state ?? (i < active.value ? 'complete' : i === active.value ? 'active' : 'pending')
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
