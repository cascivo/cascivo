'use client'

import {
  cn,
  DismissableLayer,
  FocusScope,
  Portal,
  Presence,
  useControllableSignal,
  useRovingFocus,
  useSignals,
} from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useId } from 'react'
import type { ReactNode } from 'react'
import styles from './action-sheet.module.css'

export interface ActionSheetAction {
  label: ReactNode
  onSelect: () => void
  /** Render in the destructive (danger) style. */
  destructive?: boolean
  disabled?: boolean
}

export interface ActionSheetProps {
  /** Controlled open state. */
  open?: boolean
  /** Initial open state for uncontrolled use. */
  defaultOpen?: boolean
  /** Called whenever the open state should change (selection, cancel, Escape, outside press). */
  onOpenChange?: (open: boolean) => void
  /** The choices presented, top to bottom. */
  actions: ActionSheetAction[]
  /** Optional heading shown above the actions; also labels the menu. */
  title?: ReactNode
  /** Optional supporting message under the title. */
  description?: ReactNode
  /** Show the separate Cancel button. Default true. */
  showCancel?: boolean
  labels?: { cancel?: string; label?: string }
  className?: string
}

/**
 * Bottom-rising sheet of discrete actions (iOS action-sheet pattern). Renders a
 * role="menu" of menuitems with vertical roving focus (Arrow keys, Home/End, wraps);
 * Escape and outside press dismiss it, and a separate Cancel button gives an explicit
 * non-destructive exit. Body scroll is not locked — the sheet is transient. Reuses the
 * overlay primitives and CSS-only slide; no animation library.
 */
export function ActionSheet({
  open,
  defaultOpen,
  onOpenChange,
  actions,
  title,
  description,
  showCancel = true,
  labels,
  className,
}: ActionSheetProps) {
  useSignals()
  const [isOpen, setOpen] = useControllableSignal<boolean>({
    value: open,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  })

  const roving = useRovingFocus({ orientation: 'vertical', loop: true })

  const titleId = useId()
  const descId = useId()
  const cancelLabel = labels?.cancel ?? t(builtin.actionSheet.cancel)
  const menuLabel = labels?.label ?? t(builtin.actionSheet.label)

  const select = (action: ActionSheetAction): void => {
    if (action.disabled) return
    action.onSelect()
    setOpen(false)
  }

  // Cancel is the last roving item so Arrow keys reach it.
  const cancelIndex = actions.length

  return (
    <Portal>
      <Presence present={isOpen}>
        <div className={styles['overlay']}>
          <DismissableLayer onDismiss={() => setOpen(false)}>
            <FocusScope trapped restoreFocus autoFocus>
              <div
                role="menu"
                aria-label={title ? undefined : menuLabel}
                aria-labelledby={title ? titleId : undefined}
                aria-describedby={description ? descId : undefined}
                className={cn(styles['sheet'], className)}
              >
                <div className={styles['group']}>
                  {(title || description) && (
                    <div className={styles['heading']} role="presentation">
                      {title && (
                        <p id={titleId} className={styles['title']}>
                          {title}
                        </p>
                      )}
                      {description && (
                        <p id={descId} className={styles['description']}>
                          {description}
                        </p>
                      )}
                    </div>
                  )}
                  {actions.map((action, index) => {
                    const itemProps = roving.getItemProps(index)
                    return (
                      <button
                        key={index}
                        ref={itemProps.ref}
                        type="button"
                        role="menuitem"
                        tabIndex={itemProps.tabIndex}
                        aria-disabled={action.disabled || undefined}
                        data-destructive={action.destructive ? '' : undefined}
                        className={styles['item']}
                        onKeyDown={itemProps.onKeyDown}
                        onFocus={itemProps.onFocus}
                        onClick={() => select(action)}
                      >
                        {action.label}
                      </button>
                    )
                  })}
                </div>
                {showCancel && (
                  <div className={styles['group']}>
                    {(() => {
                      const itemProps = roving.getItemProps(cancelIndex)
                      return (
                        <button
                          ref={itemProps.ref}
                          type="button"
                          role="menuitem"
                          tabIndex={itemProps.tabIndex}
                          className={cn(styles['item'], styles['cancel'])}
                          onKeyDown={itemProps.onKeyDown}
                          onFocus={itemProps.onFocus}
                          onClick={() => setOpen(false)}
                        >
                          {cancelLabel}
                        </button>
                      )
                    })()}
                  </div>
                )}
              </div>
            </FocusScope>
          </DismissableLayer>
        </div>
      </Presence>
    </Portal>
  )
}
