'use client'
import { cn, useSignal, useSignals, type Signal } from '@cascade-ui/core'
import {
  createContext,
  useId,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import styles from './tabs.module.css'

interface TabsStore {
  active: Signal<string>
  setValue: (value: string) => void
  baseId: string
}

const TabsContext = createContext<TabsStore | null>(null)

export interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: ReactNode
}

export function Tabs({ defaultValue, value, onValueChange, className, children }: TabsProps) {
  const baseId = useId()
  const active = useSignal(value ?? defaultValue ?? '')
  if (value !== undefined) active.value = value

  const store: TabsStore = {
    active,
    baseId,
    setValue: (next) => {
      if (value === undefined) active.value = next
      onValueChange?.(next)
    },
  }

  return (
    <TabsContext.Provider value={store}>
      <div className={cn(styles['tabs'], className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <TabsContext.Consumer>
      {(store) => {
        const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
          if (!store || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
          const tabs = Array.from(
            ref.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])') ?? [],
          )
          if (tabs.length === 0) return
          event.preventDefault()
          const current = tabs.findIndex((tab) => tab.dataset['value'] === store.active.value)
          let nextIndex = current
          if (event.key === 'ArrowRight') nextIndex = (current + 1) % tabs.length
          else if (event.key === 'ArrowLeft') nextIndex = (current - 1 + tabs.length) % tabs.length
          else if (event.key === 'Home') nextIndex = 0
          else if (event.key === 'End') nextIndex = tabs.length - 1
          const next = tabs[nextIndex]
          next?.focus()
          if (next?.dataset['value']) store.setValue(next.dataset['value'])
        }

        return (
          <div
            ref={ref}
            role="tablist"
            className={cn(styles['list'], className)}
            onKeyDown={handleKeyDown}
            {...props}
          >
            {children}
          </div>
        )
      }}
    </TabsContext.Consumer>
  )
}

export interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string
  disabled?: boolean
}

export function TabsTrigger(props: TabsTriggerProps) {
  return (
    <TabsContext.Consumer>
      {(store) => (store ? <TabsTriggerInner store={store} {...props} /> : null)}
    </TabsContext.Consumer>
  )
}

function TabsTriggerInner({
  store,
  value,
  className,
  children,
  disabled,
  ...props
}: TabsTriggerProps & { store: TabsStore }) {
  useSignals()
  const selected = store.active.value === value

  return (
    <button
      type="button"
      role="tab"
      id={`${store.baseId}-trigger-${value}`}
      aria-selected={selected}
      aria-controls={`${store.baseId}-content-${value}`}
      tabIndex={selected ? 0 : -1}
      data-state={selected ? 'active' : 'inactive'}
      data-value={value}
      disabled={disabled}
      className={cn(styles['trigger'], className)}
      onClick={() => store.setValue(value)}
      {...props}
    >
      {children}
    </button>
  )
}

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string
}

export function TabsContent(props: TabsContentProps) {
  return (
    <TabsContext.Consumer>
      {(store) => (store ? <TabsContentInner store={store} {...props} /> : null)}
    </TabsContext.Consumer>
  )
}

function TabsContentInner({
  store,
  value,
  className,
  children,
  ...props
}: TabsContentProps & { store: TabsStore }) {
  useSignals()
  if (store.active.value !== value) return null

  return (
    <div
      role="tabpanel"
      id={`${store.baseId}-content-${value}`}
      aria-labelledby={`${store.baseId}-trigger-${value}`}
      tabIndex={0}
      className={cn(styles['content'], className)}
      {...props}
    >
      {children}
    </div>
  )
}
