'use client'
import { createMachine, useId, useMachine, useSignalEffect, useSignals } from '@cascivo/core'
import { cloneElement, useRef } from 'react'
import type {
  CSSProperties,
  FocusEvent,
  HTMLAttributes,
  MouseEvent,
  ReactElement,
  ReactNode,
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
  // Stable, colon-stripped ids: SSR-safe and valid inside the CSS anchor-name.
  const tooltipId = useId('cascivo-tooltip')
  const anchorId = useId('cascivo-anchor')
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
    id: anchorId,
    style: { anchorName: `--tooltip-${anchorId}` },
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
        data-anchor={`--tooltip-${anchorId}`}
        className={styles['tooltip']}
      >
        {content}
      </span>
    </span>
  )
}
