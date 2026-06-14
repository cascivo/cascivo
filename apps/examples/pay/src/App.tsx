'use client'
import { signal, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { ToastProvider } from '@cascivo/react'
import { persistedSignal } from '@cascivo/storage'
import { AppShell } from '@cascivo/example-kit'
import type { SideNavItem } from '@cascivo/react'
import { Overview } from './sections/Overview'
import { Transactions } from './sections/Transactions'
import { msg } from './i18n'
import type { Range } from './api'

import '@cascivo/themes/dark'
import '@cascivo/themes/light'
import '@cascivo/themes/warm'
import '@cascivo/tokens'

export const rangeSignal = persistedSignal<Range>('pay-range', '30d')
export const currentSection = signal<'overview' | 'payments' | 'customers'>('overview')

export default function App() {
  useSignals()

  const navItems: SideNavItem[] = [
    {
      label: t(msg.navOverview),
      active: currentSection.value === 'overview',
      onClick: (e) => {
        e.preventDefault()
        currentSection.value = 'overview'
      },
    },
    {
      label: t(msg.navPayments),
      active: currentSection.value === 'payments',
      onClick: (e) => {
        e.preventDefault()
        currentSection.value = 'payments'
      },
    },
    {
      label: t(msg.navCustomers),
      active: currentSection.value === 'customers',
      onClick: (e) => {
        e.preventDefault()
        currentSection.value = 'customers'
      },
    },
  ]

  return (
    <ToastProvider>
      <AppShell navItems={navItems} mockBanner>
        {currentSection.value === 'overview' && <Overview />}
        {currentSection.value === 'payments' && <Transactions />}
        {currentSection.value === 'customers' && (
          <div style={{ padding: 'var(--cascivo-space-6)' }}>
            <p style={{ color: 'var(--cascivo-color-foreground-muted)' }}>
              Customer view — coming soon.
            </p>
          </div>
        )}
      </AppShell>
    </ToastProvider>
  )
}
