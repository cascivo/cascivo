'use client'
import { cn, createMachine, useMachine, useSignals } from '@cascade-ui/core'
import type { ButtonHTMLAttributes } from 'react'
import styles from './toggle.module.css'

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  label?: string
  size?: 'sm' | 'md'
}

export function Toggle({
  checked,
  defaultChecked = false,
  onChange,
  label,
  size = 'md',
  className,
  disabled,
  ...props
}: ToggleProps) {
  useSignals()
  const machine = createMachine({
    initial: defaultChecked ? ('on' as const) : ('off' as const),
    states: {
      off: { on: { TOGGLE: 'on' } },
      on: { on: { TOGGLE: 'off' } },
    },
  })
  const [state, send] = useMachine(machine)

  const isControlled = checked !== undefined
  const isOn = isControlled ? checked : state.value === 'on'

  const handleClick = () => {
    if (!isControlled) send('TOGGLE')
    onChange?.(!isOn)
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      data-state={isOn ? 'on' : 'off'}
      data-size={size}
      disabled={disabled}
      className={cn(styles['toggle'], className)}
      onClick={handleClick}
      {...props}
    >
      <span className={styles['track']} aria-hidden="true">
        <span className={styles['thumb']} />
      </span>
      {label && <span className={styles['label']}>{label}</span>}
    </button>
  )
}
