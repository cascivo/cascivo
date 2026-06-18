'use client'
import { cn } from '@cascivo/core'
import { forwardRef, type HTMLAttributes, type KeyboardEvent } from 'react'
import styles from './button-group.module.css'

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md' | 'lg'
  /** Enable arrow-key roving focus across the group's focusable buttons. */
  roving?: boolean
  loop?: boolean
}

/** Focusable, non-disabled controls inside the group, in DOM order. */
function focusableItems(group: HTMLElement): HTMLElement[] {
  return Array.from(group.querySelectorAll<HTMLElement>('button, a[href], [tabindex]')).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-disabled') !== 'true',
  )
}

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
  {
    orientation = 'horizontal',
    size = 'md',
    roving = false,
    loop = false,
    className,
    onKeyDown,
    children,
    ...props
  },
  ref,
) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (!roving) return
    const horizontal = orientation === 'horizontal'
    const forward = horizontal ? 'ArrowRight' : 'ArrowDown'
    const back = horizontal ? 'ArrowLeft' : 'ArrowUp'
    if (![forward, back, 'Home', 'End'].includes(event.key)) return

    const items = focusableItems(event.currentTarget)
    if (items.length === 0) return
    const current = items.indexOf(document.activeElement as HTMLElement)
    if (current === -1) return

    let next = current
    if (event.key === forward) next = current + 1
    else if (event.key === back) next = current - 1
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = items.length - 1

    if (next < 0) next = loop ? items.length - 1 : 0
    if (next >= items.length) next = loop ? 0 : items.length - 1

    event.preventDefault()
    items[next]?.focus()
  }

  return (
    <div
      role="group"
      data-orientation={orientation}
      data-size={size}
      className={cn(styles['buttonGroup'], className as string | undefined)}
      ref={ref}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  )
})
