'use client'
import { cn, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import type { Signal } from '@cascivo/core'
import { createContext, forwardRef, useId, useRef } from 'react'
import type { Ref, HTMLAttributes, ReactNode } from 'react'
import styles from './accordion.module.css'

interface AccordionStore {
  open: Signal<string[]>
  toggle: (value: string, next: boolean) => void
  baseId: string
  type: 'single' | 'multiple'
}

const AccordionContext = createContext<AccordionStore | null>(null)
const AccordionItemContext = createContext<{ value: string } | null>(null)

export interface AccordionProps {
  type?: 'single' | 'multiple'
  defaultValue?: string | string[]
  value?: string | string[]
  onValueChange?: (value: string | string[]) => void
  className?: string
  children: ReactNode
}

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

export function Accordion({
  type = 'single',
  defaultValue,
  value,
  onValueChange,
  className,
  children,
}: AccordionProps) {
  const baseId = useId()
  const open = useSignal<string[]>(toArray(value ?? defaultValue))
  if (value !== undefined) open.value = toArray(value)

  const store: AccordionStore = {
    open,
    baseId,
    type,
    /**
     * `next` is the state the browser has already moved the `<details>` to. Exclusivity is
     * still computed here rather than delegated to the native `name` grouping: jsdom does
     * not implement `name`, so tests would diverge from browsers, and with JS on this
     * signal is what actually drives the render. `name` covers the JS-off case only.
     */
    toggle: (val, next) => {
      const current = open.value
      let updated: string[]
      if (type === 'multiple') {
        updated = next ? [...new Set([...current, val])] : current.filter((v) => v !== val)
      } else {
        updated = next ? [val] : []
      }
      if (value === undefined) open.value = updated
      onValueChange?.(type === 'multiple' ? updated : (updated[0] ?? ''))
    },
  }

  return (
    <AccordionContext.Provider value={store}>
      <div data-type={type} className={cn(styles['accordion'], className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

export interface AccordionItemProps extends HTMLAttributes<HTMLElement> {
  value: string
}

/**
 * Renders the `<details>` element itself, so `AccordionTrigger` (a `<summary>`) and
 * `AccordionContent` land as its first and second children — which is exactly the shape
 * consumers already write.
 */
export function AccordionItem({ value, className, children, ...props }: AccordionItemProps) {
  return (
    <AccordionItemContext.Provider value={{ value }}>
      <AccordionContext.Consumer>
        {(store) =>
          store ? (
            <AccordionItemDetails store={store} value={value} className={className} {...props}>
              {children}
            </AccordionItemDetails>
          ) : null
        }
      </AccordionContext.Consumer>
    </AccordionItemContext.Provider>
  )
}

function AccordionItemDetails({
  store,
  value,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLElement> & { store: AccordionStore; value: string }) {
  useSignals()
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const isOpen = store.open.value.includes(value)

  /**
   * A user click mutates `details.open` in the DOM behind React's back, so when the signal
   * round-trips to the value React last rendered, React issues no update and the element
   * stays stuck. Reconciling the property is what makes exclusive mode close the sibling.
   */
  useSignalEffect(() => {
    const el = detailsRef.current
    const next = store.open.value.includes(value)
    if (el && el.open !== next) el.open = next
  })

  return (
    <details
      ref={detailsRef}
      open={isOpen}
      /* Native exclusivity for the JS-off case; the store owns it once JS runs. */
      {...(store.type === 'single' ? { name: store.baseId } : {})}
      data-value={value}
      data-state={isOpen ? 'open' : 'closed'}
      className={cn(styles['item'], className)}
      onToggle={(event) => {
        const el = event.currentTarget
        if (el.open !== store.open.value.includes(value)) store.toggle(value, el.open)
        /*
          A controlled parent may refuse the change, leaving the signal where it was while
          the browser has already moved the element. The signal is authoritative, so put
          the DOM back. Writing `open` re-enters this handler once, finds both sides in
          agreement, and stops.
        */
        const authoritative = store.open.value.includes(value)
        if (el.open !== authoritative) el.open = authoritative
      }}
      {...props}
    >
      {children}
    </details>
  )
}

/**
 * `forwardRef` so `ref` reaches the trigger element — see `textarea.tsx` for the full
 * rationale (2026-07-28 report C10). The target is the `<summary>`, not a `<button>`:
 * `<summary>` must be the first child of `<details>`, so it cannot be nested inside a
 * heading. The heading moves inside it instead, which `<summary>`'s content model allows.
 */
export const AccordionTrigger = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  function AccordionTrigger(props, ref) {
    return (
      <AccordionContext.Consumer>
        {(store) => (
          <AccordionItemContext.Consumer>
            {(item) =>
              store && item ? (
                <AccordionTriggerInner store={store} item={item} summaryRef={ref} {...props} />
              ) : null
            }
          </AccordionItemContext.Consumer>
        )}
      </AccordionContext.Consumer>
    )
  },
)

function AccordionTriggerInner({
  store,
  item,
  className,
  children,
  summaryRef,
  ...props
}: HTMLAttributes<HTMLElement> & {
  store: AccordionStore
  item: { value: string }
  summaryRef?: Ref<HTMLElement>
}) {
  useSignals()
  const open = store.open.value.includes(item.value)

  return (
    /*
      No `aria-expanded` and no explicit `role`: `<summary>` carries the button role and the
      expanded state natively, and re-declaring either overrides the disclosure mapping and
      suppresses state announcement in some assistive tech.
    */
    <summary
      id={`${store.baseId}-trigger-${item.value}`}
      aria-controls={`${store.baseId}-content-${item.value}`}
      data-state={open ? 'open' : 'closed'}
      className={cn(styles['trigger'], className)}
      ref={summaryRef}
      {...props}
    >
      <h3 className={styles['heading']}>{children}</h3>
      <span className={styles['indicator']} aria-hidden="true" />
    </summary>
  )
}

export function AccordionContent(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <AccordionContext.Consumer>
      {(store) => (
        <AccordionItemContext.Consumer>
          {(item) =>
            store && item ? <AccordionContentInner store={store} item={item} {...props} /> : null
          }
        </AccordionItemContext.Consumer>
      )}
    </AccordionContext.Consumer>
  )
}

function AccordionContentInner({
  store,
  item,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { store: AccordionStore; item: { value: string } }) {
  return (
    <div
      role="region"
      id={`${store.baseId}-content-${item.value}`}
      aria-labelledby={`${store.baseId}-trigger-${item.value}`}
      className={cn(styles['content'], className)}
      {...props}
    >
      {children}
    </div>
  )
}
