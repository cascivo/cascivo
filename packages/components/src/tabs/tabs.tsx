'use client'
import { cn, Slot, useSignal, useSignals } from '@cascivo/core'
import type { Signal } from '@cascivo/core'
import { createContext, forwardRef, useId, useRef } from 'react'
import type { HTMLAttributes, KeyboardEvent, Ref, ReactNode } from 'react'
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
  /**
   * Render your own element instead of the `<button>`, keeping every tab behaviour
   * (`role="tab"`, `aria-selected`, `aria-controls`, the roving `tabIndex`, `data-state`)
   * and the tab styling.
   *
   * This exists for **URL-driven tabs**, the canonical dashboard shape: one route per tab.
   * Navigating from `onValueChange` instead loses middle-click, cmd-click, open-in-new-tab
   * and a crawlable `href` — a real anchor gives you all four for free.
   *
   * ```tsx
   * <TabsTrigger value="overview" asChild>
   *   <Link to="/projects/$id/overview">Overview</Link>
   * </TabsTrigger>
   * ```
   *
   * With `asChild`, `disabled` becomes `aria-disabled`: it is not a valid attribute on an
   * anchor, and a slotted element gets no `type` either. See
   * [USING-WITH-A-ROUTER.md](../../../../docs/USING-WITH-A-ROUTER.md) for the full recipe.
   */
  asChild?: boolean
}

/**
 * `forwardRef` so `ref` reaches the tab `<button>` — see `textarea.tsx` for the full
 * rationale (2026-07-28 report C10). Threaded through the private Inner, which owns the
 * button. Roving-focus navs need a real element here, so this is not cosmetic.
 */
export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  function TabsTrigger(props, ref) {
    return (
      <TabsContext.Consumer>
        {(store) => (store ? <TabsTriggerInner store={store} buttonRef={ref} {...props} /> : null)}
      </TabsContext.Consumer>
    )
  },
)

function TabsTriggerInner({
  store,
  value,
  className,
  children,
  disabled,
  buttonRef,
  asChild = false,
  ...props
}: TabsTriggerProps & { store: TabsStore; buttonRef?: Ref<HTMLButtonElement> }) {
  useSignals()
  const selected = store.active.value === value
  // Matches `popover.tsx`: `type` and `disabled` go only on a real <button>. A slotted
  // router <Link> renders an <a>, where `type` means something else entirely and
  // `disabled` is not a valid attribute.
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      type={asChild ? undefined : 'button'}
      role="tab"
      id={`${store.baseId}-trigger-${value}`}
      aria-selected={selected}
      aria-controls={`${store.baseId}-content-${value}`}
      tabIndex={selected ? 0 : -1}
      data-state={selected ? 'active' : 'inactive'}
      data-value={value}
      {...(asChild ? { 'aria-disabled': disabled || undefined } : { disabled })}
      className={cn(styles['trigger'], className)}
      onClick={() => store.setValue(value)}
      ref={buttonRef}
      {...props}
    >
      {children}
    </Comp>
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
