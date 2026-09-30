'use client'
import { AppShell, ShellHeader, SideNav, type SideNavItem } from '@cascivo/react'
import type { ReactNode } from 'react'

import '@cascivo/themes/light.css'
// No '@cascivo/react/styles.css' here. On a bundler build each component imports its
// own CSS, so you ship exactly what you use — this app emits well under 100 kB of entry
// CSS instead of the ~273 kB aggregate sheet. Import the aggregate ONLY if you drop the
// bundler (CDN / single-file setup). See https://cascivo.com/docs/getting-started.md
// The theme import above is always required — themes are never automatic.

export interface ShellProps {
  /** Side-nav entries. Use `href` for a routed app, `onClick` for local state. */
  navItems: SideNavItem[]
  children: ReactNode
}

/**
 * App shell: header + side nav + a content slot.
 *
 * Routing lives in src/router.ts; nav items carry `href`s, and main.tsx registers the
 * router's Link so they navigate client-side.
 */
export function Shell({ navItems, children }: ShellProps) {
  return (
    <AppShell
      header={<ShellHeader brand={{ name: 'Cascivo Agent' }} />}
      nav={<SideNav items={navItems} />}
    >
      {children}
    </AppShell>
  )
}
