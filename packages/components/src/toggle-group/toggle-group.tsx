'use client'
import { cn, useControllableSignal, useRovingFocus, useSignals } from '@cascivo/core'
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import styles from './toggle-group.module.css'

export interface ToggleGroupItem {
  value: string
  label?: string
  icon?: ReactNode
  disabled?: boolean
}

export interface ToggleGroupProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  type: 'single' | 'multiple'
  value?: string | string[]
  defaultValue?: string | string[]
  onValueChange?: (value: string | string[]) => void
  items: ToggleGroupItem[]
  orientation?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

function isSelected(current: string | string[] | undefined, value: string): boolean {
  if (Array.isArray(current)) return current.includes(value)
  return current === value
}

export const ToggleGroup = forwardRef<HTMLDivElement, ToggleGroupProps>(function ToggleGroup(
  {
    type,
    value,
    defaultValue,
    onValueChange,
    items,
    orientation = 'horizontal',
    size = 'md',
    disabled = false,
    className,
    ...props
  },
  ref,
) {
  useSignals()
  const emptyDefault: string | string[] = type === 'multiple' ? [] : ''
  const [selected, setSelected] = useControllableSignal<string | string[]>({
    value,
    defaultValue: defaultValue ?? emptyDefault,
    onChange: onValueChange,
  })

  const roving = useRovingFocus({ orientation, loop: true })

  const toggle = (itemValue: string) => {
    const current = selected.value
    if (type === 'multiple') {
      const list = Array.isArray(current) ? current : []
      const next = list.includes(itemValue)
        ? list.filter((v) => v !== itemValue)
        : [...list, itemValue]
      setSelected(next)
    } else {
      // Single: clicking the active item clears it.
      setSelected(current === itemValue ? '' : itemValue)
    }
  }

  return (
    <div
      role={type === 'single' ? 'radiogroup' : 'group'}
      data-orientation={orientation}
      data-size={size}
      className={cn(styles['toggleGroup'], className as string | undefined)}
      ref={ref}
      {...props}
    >
      {items.map((item, index) => {
        const on = isSelected(selected.value, item.value)
        const itemDisabled = disabled || item.disabled
        const { ref: itemRef, ...rovingProps } = roving.getItemProps(index)
        const ariaProps =
          type === 'single'
            ? { role: 'radio' as const, 'aria-checked': on }
            : { 'aria-pressed': on }
        return (
          <button
            key={item.value}
            type="button"
            {...ariaProps}
            {...rovingProps}
            ref={itemRef}
            data-state={on ? 'on' : 'off'}
            disabled={itemDisabled}
            aria-label={item.icon && !item.label ? item.value : undefined}
            className={styles['item']}
            onClick={() => toggle(item.value)}
          >
            {item.icon}
            {item.label && <span>{item.label}</span>}
          </button>
        )
      })}
    </div>
  )
})
