'use client'
import { createMachine, useMachine, useSignalEffect, useSignals } from '@cascade-ui/core'
import {
  cloneElement,
  useId,
  useRef,
  type FocusEvent,
  type HTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import styles from './tooltip.module.css'

const machine = createMachine({
  initial: 'hidden' as const,
  states: {
    hidden: { on: { SHOW: 'visible' } },
    visible: { on: { HIDE: 'hidden' } },
  },
})

export interface TooltipProps {
  content: ReactNode
  placement?: 'top' | 'right' | 'bottom' | 'left'
  children: ReactElement
  delay?: number
}

export function Tooltip({ content, placement = 'top', children, delay = 200 }: TooltipProps) {
  useSignals()
  const [state, send] = useMachine(machine)
  const tooltipId = useId()
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const isVisible = state.value === 'visible'

  const show = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => send('SHOW'), delay)
  }
  const hide = () => {
    clearTimeout(timer.current)
    send('HIDE')
  }

  useSignalEffect(() => () => clearTimeout(timer.current))

  const trigger = children as ReactElement<HTMLAttributes<HTMLElement>>
  const triggerProps = trigger.props

  const merged: HTMLAttributes<HTMLElement> = {
    onMouseEnter: (event: MouseEvent<HTMLElement>) => {
      triggerProps.onMouseEnter?.(event)
      show()
    },
    onMouseLeave: (event: MouseEvent<HTMLElement>) => {
      triggerProps.onMouseLeave?.(event)
      hide()
    },
    onFocus: (event: FocusEvent<HTMLElement>) => {
      triggerProps.onFocus?.(event)
      show()
    },
    onBlur: (event: FocusEvent<HTMLElement>) => {
      triggerProps.onBlur?.(event)
      hide()
    },
    'aria-describedby': isVisible ? tooltipId : triggerProps['aria-describedby'],
  }

  return (
    <span className={styles['root']}>
      {cloneElement(trigger, merged)}
      <span
        role="tooltip"
        id={tooltipId}
        data-placement={placement}
        data-state={isVisible ? 'visible' : 'hidden'}
        className={styles['tooltip']}
      >
        {content}
      </span>
    </span>
  )
}
