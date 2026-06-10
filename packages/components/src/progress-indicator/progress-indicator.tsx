'use client'
import { cn } from '@cascade-ui/core'
import styles from './progress-indicator.module.css'

export interface ProgressStep {
  label: string
  description?: string
}

export interface ProgressIndicatorProps {
  steps: ProgressStep[]
  currentIndex: number
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
            key={index}
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
