'use client'
import { cn } from '@cascade-ui/core'
import {
  Children,
  cloneElement,
  isValidElement,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react'
import styles from './radio.module.css'

export interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  value: string
}

export function Radio({ label, className, id, disabled, value, ...props }: RadioProps) {
  const radioId = id ?? (label ? `cascade-radio-${value}` : undefined)

  return (
    <label className={cn(styles['wrapper'], className)} data-disabled={disabled || undefined}>
      <input
        id={radioId}
        type="radio"
        value={value}
        className={styles['input']}
        disabled={disabled}
        {...props}
      />
      <span className={styles['control']} aria-hidden="true" />
      {label && <span className={styles['label']}>{label}</span>}
    </label>
  )
}

export interface RadioGroupProps {
  name: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  orientation?: 'horizontal' | 'vertical'
  className?: string
  children: ReactNode
}

export function RadioGroup({
  name,
  value,
  defaultValue,
  onChange,
  orientation = 'vertical',
  className,
  children,
}: RadioGroupProps) {
  const isControlled = value !== undefined

  return (
    <div
      role="radiogroup"
      data-orientation={orientation}
      className={cn(styles['group'], className)}
    >
      {Children.map(children, (child) => {
        if (!isValidElement(child)) return child
        const radio = child as ReactElement<RadioProps>
        const childValue = radio.props.value
        const extra: Partial<RadioProps> = { name }

        if (isControlled) {
          extra.checked = childValue === value
        } else if (defaultValue !== undefined) {
          extra.defaultChecked = childValue === defaultValue
        }

        if (onChange) {
          extra.onChange = (event) => {
            if (event.target.checked) onChange(childValue)
          }
        }

        return cloneElement(radio, extra)
      })}
    </div>
  )
}
