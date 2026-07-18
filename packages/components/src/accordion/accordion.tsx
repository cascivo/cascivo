'use client'
import { cn, useSignal, useSignals } from '@cascivo/core'
import type { Signal } from '@cascivo/core'
import { createContext, useId } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
import styles from './accordion.module.css'

interface AccordionStore {
  open: Signal<string[]>
  toggle: (value: string) => void
  baseId: string
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
    toggle: (val) => {
      const current = open.value
      let next: string[]
      if (type === 'multiple') {
        next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val]
      } else {
        next = current.includes(val) ? [] : [val]
      }
      if (value === undefined) open.value = next
      onValueChange?.(type === 'multiple' ? next : (next[0] ?? ''))
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

export interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string
}

export function AccordionItem({ value, className, children, ...props }: AccordionItemProps) {
  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div data-value={value} className={cn(styles['item'], className)} {...props}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  )
}

export function AccordionTrigger(props: HTMLAttributes<HTMLButtonElement>) {
  return (
    <AccordionContext.Consumer>
      {(store) => (
        <AccordionItemContext.Consumer>
          {(item) =>
            store && item ? <AccordionTriggerInner store={store} item={item} {...props} /> : null
          }
        </AccordionItemContext.Consumer>
      )}
    </AccordionContext.Consumer>
  )
}

function AccordionTriggerInner({
  store,
  item,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLButtonElement> & { store: AccordionStore; item: { value: string } }) {
  useSignals()
  const open = store.open.value.includes(item.value)

  return (
    <h3 className={styles['heading']}>
      <button
        type="button"
        id={`${store.baseId}-trigger-${item.value}`}
        aria-expanded={open}
        aria-controls={`${store.baseId}-content-${item.value}`}
        data-state={open ? 'open' : 'closed'}
        className={cn(styles['trigger'], className)}
        onClick={() => store.toggle(item.value)}
        {...props}
      >
        <span>{children}</span>
        <span className={styles['indicator']} aria-hidden="true" />
      </button>
    </h3>
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
  useSignals()
  const open = store.open.value.includes(item.value)

  return (
    <div
      role="region"
      id={`${store.baseId}-content-${item.value}`}
      aria-labelledby={`${store.baseId}-trigger-${item.value}`}
      data-state={open ? 'open' : 'closed'}
      className={cn(styles['content'], className)}
      {...props}
    >
      <div className={styles['contentInner']}>{children}</div>
    </div>
  )
}
