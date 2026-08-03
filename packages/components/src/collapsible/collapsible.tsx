'use client'
import { cn, useControllableSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { useId, useRef } from 'react'
import type { ReactNode } from 'react'
import styles from './collapsible.module.css'

export interface CollapsibleProps {
  /** Controlled open state. */
  open?: boolean
  /**
   * Initial open state for uncontrolled use
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  defaultOpen?: boolean
  /** Called whenever the open state should change. */
  onOpenChange?: (open: boolean) => void
  /** Content rendered inside the trigger. */
  trigger: ReactNode
  /**
   * Disables the trigger. Enforced in the enhancement layer — <details> has no native
   * disabled state, so with JavaScript off a disabled Collapsible is still operable
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  disabled?: boolean
  className?: string
  children?: ReactNode
}

export function Collapsible({
  open,
  defaultOpen = false,
  onOpenChange,
  trigger,
  disabled = false,
  className,
  children,
}: CollapsibleProps) {
  useSignals()
  const [openSig, setOpen] = useControllableSignal<boolean>({
    ...(open !== undefined ? { value: open } : {}),
    defaultValue: defaultOpen,
    ...(onOpenChange ? { onChange: onOpenChange } : {}),
  })
  const baseId = useId()
  const contentId = `${baseId}-content`
  const triggerId = `${baseId}-trigger`
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const isOpen = openSig.value

  /**
   * React tracks `open` against its own last render, but a user click mutates
   * `details.open` in the DOM behind its back. When the signal round-trips to the value
   * React last rendered, React issues no DOM update and the element stays stuck.
   * Reconciling the property here is what makes the controlled case survive a second toggle.
   */
  useSignalEffect(() => {
    const el = detailsRef.current
    if (el && el.open !== openSig.value) el.open = openSig.value
  })

  return (
    <details
      ref={detailsRef}
      open={isOpen}
      data-state={isOpen ? 'open' : 'closed'}
      className={cn(styles['root'], className)}
      onToggle={(event) => {
        const el = event.currentTarget
        if (el.open !== openSig.value) setOpen(el.open)
        /*
          A controlled parent may refuse the change, leaving the signal where it was while
          the browser has already moved the element. The signal is authoritative, so put
          the DOM back. Writing `open` re-enters this handler once, finds both sides in
          agreement, and stops.
        */
        if (el.open !== openSig.value) el.open = openSig.value
      }}
    >
      {/*
        `<summary>` is the disclosure control: the browser supplies the button role,
        Enter/Space activation, and the expanded state, so none of that is re-declared here.
        `<details>` has no `disabled`, so the enhancement layer cancels the click — with JS
        off a disabled Collapsible is still operable, which the manifest records.
      */}
      <summary
        id={triggerId}
        aria-controls={contentId}
        {...(disabled ? { 'aria-disabled': true } : {})}
        data-state={isOpen ? 'open' : 'closed'}
        className={styles['trigger']}
        onClick={(event) => {
          if (disabled) event.preventDefault()
        }}
      >
        {trigger}
      </summary>
      <div id={contentId} role="region" aria-labelledby={triggerId} className={styles['content']}>
        {children}
      </div>
    </details>
  )
}
