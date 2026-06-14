'use client'
import { cn, useControllableSignal, useSignals } from '@cascivo/core'
import { useId, type ReactNode } from 'react'
import styles from './collapsible.module.css'

export interface CollapsibleProps {
  /** Controlled open state. */
  open?: boolean
  /** Initial open state for uncontrolled use. */
  defaultOpen?: boolean
  /** Called whenever the open state should change. */
  onOpenChange?: (open: boolean) => void
  /** Content rendered inside the trigger button. */
  trigger: ReactNode
  /** Disables the trigger. */
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
  const isOpen = openSig.value

  return (
    <div data-state={isOpen ? 'open' : 'closed'} className={cn(styles['root'], className)}>
      <button
        type="button"
        id={triggerId}
        aria-expanded={isOpen}
        aria-controls={contentId}
        disabled={disabled}
        data-state={isOpen ? 'open' : 'closed'}
        className={styles['trigger']}
        onClick={() => setOpen(!isOpen)}
      >
        {trigger}
      </button>
      <div
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        data-state={isOpen ? 'open' : 'closed'}
        className={styles['content']}
      >
        <div className={styles['contentInner']}>{children}</div>
      </div>
    </div>
  )
}
