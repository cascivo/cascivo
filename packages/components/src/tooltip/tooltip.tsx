'use client'
import { createMachine, useMachine, useSignalEffect, useSignals } from '@cascivo/core'
import {
  cloneElement,
  useId,
  useRef,
  type CSSProperties,
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
  const anchorId = useRef(`t${Math.random().toString(36).slice(2)}`)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const floatingRef = useRef<HTMLSpanElement>(null)

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

  useSignalEffect(() => {
    if (state.value === 'visible') {
      floatingRef.current?.showPopover()
    } else {
      floatingRef.current?.hidePopover()
    }
  })

  const trigger = children as ReactElement<HTMLAttributes<HTMLElement>>
  const triggerProps = trigger.props

  const merged: HTMLAttributes<HTMLElement> = {
    id: anchorId.current,
    style: { anchorName: `--tooltip-${anchorId.current}` } as CSSProperties,
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
        ref={floatingRef}
        popover="manual"
        role="tooltip"
        id={tooltipId}
        data-placement={placement}
        data-state={isVisible ? 'visible' : 'hidden'}
        data-anchor={`--tooltip-${anchorId.current}`}
        className={styles['tooltip']}
      >
        {content}
      </span>
    </span>
  )
}
