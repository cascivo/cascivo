'use client'
import { signal, useSignalEffect, useSignals } from '@cascivo/core'
import { defineMessages, t } from '@cascivo/i18n'
import { CommandMenu, Header, SideNav } from '@cascivo/react'
import type { CommandGroup, SideNavGroup, SideNavItem } from '@cascivo/react'
import { persistedSignal } from '@cascivo/storage'
import { useRef, type ReactNode } from 'react'
import styles from './app-shell.module.css'

const msg = defineMessages('kit.appShell', {
  toggleMenu: 'Toggle menu',
  toggleTheme: 'Toggle theme',
  searchPlaceholder: 'Search…',
  searchLabel: 'Command menu',
  mockBanner: 'Mock demo — no real data',
})

export type AppShellTheme = 'dark' | 'light'

const THEMES: AppShellTheme[] = ['dark', 'light']

// Module-level persisted signal — theme survives page reload
const theme = persistedSignal<AppShellTheme>('kit.appShell.theme', 'dark')

// Module-level signal for command menu open state
const menuOpen = signal(false)

export interface AppShellProps {
  navItems?: SideNavItem[]
  navGroups?: SideNavGroup[]
  commandGroups?: CommandGroup[]
  brand?: ReactNode
  actions?: ReactNode
  children: ReactNode
  mockBanner?: boolean
}

export function AppShell({
  navItems,
  navGroups,
  commandGroups = [],
  brand,
  actions,
  children,
  mockBanner = false,
}: AppShellProps) {
  useSignals()
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync theme to container data-theme attribute
  useSignalEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.setAttribute('data-theme', theme.value)
  })

  function cycleTheme() {
    const next = THEMES[(THEMES.indexOf(theme.value) + 1) % THEMES.length]
    theme.value = next ?? 'dark'
  }

  const themeButton = (
    <button type="button" onClick={cycleTheme}>
      {t(msg.toggleTheme)}
    </button>
  )

  return (
    <div ref={containerRef} className={styles['shell']} data-theme={theme.value}>
      {mockBanner && <div className={styles['mockBanner']}>{t(msg.mockBanner)}</div>}
      <Header brand={brand} actions={actions ?? themeButton} sticky />
      <div className={styles['body']}>
        <SideNav groups={navGroups} items={navItems} />
        <main className={styles['content']}>{children}</main>
      </div>
      {commandGroups.length > 0 && (
        <CommandMenu
          open={menuOpen.value}
          onOpenChange={(v) => {
            menuOpen.value = v
          }}
          groups={commandGroups}
          placeholder={t(msg.searchPlaceholder)}
          label={t(msg.searchLabel)}
        />
      )}
    </div>
  )
}
