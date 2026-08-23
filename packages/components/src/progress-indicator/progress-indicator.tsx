import { cn } from '@cascivo/core/pure'
import styles from './progress-indicator.module.css'

export interface ProgressStep {
  /**
   * Stable identity, used as the React key. Without it the array index (or a repeatable
   * `label`) is the key, so inserting or reordering entries re-uses the wrong DOM node — the
   * defect `link-item-id-parity` exists to prevent, extended past link-shaped items on
   * 2026-08-22.
   */
  id?: string
  label: string
  description?: string
}

export interface ProgressIndicatorProps {
  steps: ProgressStep[]
  currentIndex: number
  /**
   * When true, lays the steps out vertically.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  vertical?: boolean
  className?: string
}

type StepStatus = 'complete' | 'current' | 'incomplete'

export function ProgressIndicator({
  steps,
  currentIndex,
  vertical = false,
  className,
}: ProgressIndicatorProps) {
  return (
    <ol
      className={cn(styles['indicator'], className)}
      data-orientation={vertical ? 'vertical' : 'horizontal'}
    >
      {steps.map((step, index) => {
        const status: StepStatus =
          index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'incomplete'
        return (
          <li
            key={step.id ?? index}
            className={styles['step']}
            data-status={status}
            aria-current={status === 'current' ? 'step' : undefined}
          >
            <span className={styles['marker']} aria-hidden="true">
              {status === 'complete' ? '✓' : index + 1}
            </span>
            <span className={styles['text']}>
              <span className={styles['label']}>{step.label}</span>
              {step.description && (
                <span className={styles['description']}>{step.description}</span>
              )}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
