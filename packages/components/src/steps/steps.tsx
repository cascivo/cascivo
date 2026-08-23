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
  /**
   * Stable identity for the step, used as its React key.
   *
   * Every other config-item type in the catalog (`TimelineItem`, `SideNavItem`,
   * `DataListItem`, `BreadcrumbItem`) carries one; `Step` was missed because the sweep that
   * added them looked for a `label` **and an `href`** (2026-08-22 report item 10). Without it
   * the index is the key, so reordering or inserting a step re-uses the wrong DOM node.
   */
  id?: string
  /**
   * Step status. `StepState` is the canonical enum; `ProgressInput` additionally accepts
   * Timeline's `current` / `upcoming` aliases so one status value drives both components.
   */
  state?: StepState | ProgressInput
}

/** Props shared by both spellings of the collection. */
interface StepsBaseProps {
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
  /**
   * Alias of `ariaLabel` — same invisible accessible name, the other spelling. Not rendered.
   *
   * `ariaLabel` is the catalog convention and stays preferred, but `label` is the guess an
   * adopter makes when they have not read the convention, and an unaccepted guess costs a
   * compile cycle for nothing (2026-08-21 report item 1). Pass either.
   */
  label?: string
}

/**
 * The collection, under either spelling — exactly one is required.
 *
 * `steps` is the domain word and stays canonical. `items` is accepted because the catalog's
 * published data-prop vocabulary says a config-driven collection is `items`, and an adopter
 * who followed that rule hit a type error on the one component the rule named wrongly
 * (2026-08-22 report item 10). The XOR keeps "pass neither" and "pass both" compile errors
 * rather than silent no-ops, the same shape `Menubar` uses for its name props.
 */
type StepsCollection = { steps: Step[]; items?: never } | { items: Step[]; steps?: never }

export type StepsProps = StepsBaseProps & StepsCollection

export function Steps({
  steps,
  items,
  activeStep: controlledActiveStep,
  orientation = 'horizontal',
  className,
  ariaLabel,
  label,
}: StepsProps) {
  useSignals()
  const resolvedSteps = items ?? steps ?? []
  const active = useSignal(controlledActiveStep ?? 0)
  active.value = controlledActiveStep ?? active.value
  const resolvedAriaLabel = ariaLabel ?? label ?? t(builtin.steps.label)

  return (
    <ol
      className={[styles.steps, className].filter(Boolean).join(' ')}
      data-orientation={orientation}
      aria-label={resolvedAriaLabel}
    >
      {resolvedSteps.map((step, i) => {
        const state: StepState = step.state
          ? normalizeProgress(step.state)
          : i < active.value
            ? 'complete'
            : i === active.value
              ? 'active'
              : 'pending'
        return (
          <li
            key={step.id ?? i}
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
