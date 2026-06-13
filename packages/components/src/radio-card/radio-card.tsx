'use client'
import { cn } from '@cascivo/core'
import { createContext, type InputHTMLAttributes, type ReactNode } from 'react'
import styles from './radio-card.module.css'

interface RadioCardCtx {
  name: string
  value?: string | undefined
  defaultValue?: string | undefined
  onValueChange?: ((value: string) => void) | undefined
}

const Ctx = createContext<RadioCardCtx>({ name: '' })

export interface RadioCardGroupProps {
  name: string
  label: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: ReactNode
  className?: string | undefined
}

export function RadioCardGroup({
  name,
  label,
  value,
  defaultValue,
  onValueChange,
  children,
  className,
}: RadioCardGroupProps) {
  return (
    <Ctx.Provider value={{ name, value, defaultValue, onValueChange }}>
      <div role="radiogroup" aria-label={label} className={cn(styles['group'], className)}>
        {children}
      </div>
    </Ctx.Provider>
  )
}

export interface RadioCardProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'name' | 'value' | 'title'
> {
  value: string
  title: ReactNode
  description?: ReactNode
  disabled?: boolean
  hideIndicator?: boolean
}

export function RadioCard({
  value,
  title,
  description,
  disabled,
  hideIndicator,
  ...props
}: RadioCardProps) {
  return (
    <Ctx.Consumer>
      {(ctx) => (
        <label className={styles['card']} data-disabled={disabled || undefined}>
          <input
            type="radio"
            className={styles['input']}
            name={ctx.name}
            value={value}
            disabled={disabled}
            {...(ctx.value !== undefined
              ? { checked: ctx.value === value, onChange: () => ctx.onValueChange?.(value) }
              : {
                  defaultChecked: ctx.defaultValue === value,
                  onChange: () => ctx.onValueChange?.(value),
                })}
            {...props}
          />
          {!hideIndicator && <span className={styles['glyph']} aria-hidden="true" />}
          <span className={styles['body']}>
            <span className={styles['title']}>{title}</span>
            {description && <span className={styles['description']}>{description}</span>}
          </span>
        </label>
      )}
    </Ctx.Consumer>
  )
}
