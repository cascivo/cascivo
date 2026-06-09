'use client'
import { createMachine, useMachine, cn } from '@cascade-ui/core'
import type { ButtonHTMLAttributes } from 'react'
import styles from './button.module.css'

const machine = createMachine({
  initial: 'idle' as const,
  states: {
    idle: { on: { LOAD: 'loading' } },
    loading: { on: { DONE: 'idle', ERROR: 'idle' } },
  },
})

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const [state] = useMachine(machine)
  const isLoading = loading || state.value === 'loading'

  return (
    <button
      data-variant={variant}
      data-size={size}
      data-state={isLoading ? 'loading' : 'idle'}
      className={cn(styles['button'], className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading && <span className={styles['spinner']} aria-hidden="true" />}
      <span>{children}</span>
    </button>
  )
}
