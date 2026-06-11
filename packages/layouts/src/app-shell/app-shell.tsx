'use client'
import { cn, signal, useSignal, useSignals, type Signal } from '@cascade-ui/core'
import { builtin, t } from '@cascade-ui/i18n'
import { persistedSignal } from '@cascade-ui/storage'
import type { ReactNode } from 'react'
import styles from './app-shell.module.css'

export interface AppShellProps {
  header: ReactNode
  sideNav?: ReactNode
  aside?: ReactNode
  children: ReactNode
  persistKey?: string | false
  className?: string
}

export function AppShell({
  header,
  sideNav,
  aside,
  children,
  persistKey = 'cascade.appshell.sidenav',
  className,
}: AppShellProps) {
  useSignals()

  // Lazy-init persisted signal (same pattern as useForm)
  const store = useSignal<Signal<boolean> | null>(null)
  if (store.peek() === null) {
    store.value = persistKey === false ? signal(false) : persistedSignal(persistKey, false)
  }
  const collapsed = store.peek() as Signal<boolean>

  const toggle = () => {
    collapsed.value = !collapsed.value
  }

  return (
    <div className={cn(styles['shell'], className)} data-collapsed={collapsed.value || undefined}>
      <div className={styles['header']}>{header}</div>
      {sideNav && (
        <div className={styles['nav']} data-state={collapsed.value ? 'collapsed' : 'expanded'}>
          <div className={styles['nav-content']}>{sideNav}</div>
          <button
            type="button"
            className={styles['toggle']}
            aria-label={collapsed.value ? t(builtin.appShell.expand) : t(builtin.appShell.collapse)}
            onClick={toggle}
          />
        </div>
      )}
      <main className={styles['main']}>{children}</main>
      {aside && <div className={styles['aside']}>{aside}</div>}
    </div>
  )
}
