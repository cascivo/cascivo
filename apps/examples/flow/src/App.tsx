'use client'
import { signal, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { ToastProvider } from '@cascivo/react'
import { AppShell } from '@cascivo/example-kit'
import type { SideNavItem } from '@cascivo/react'
import { Instances } from './sections/Instances'
import { Incidents } from './sections/Incidents'
import { Tasklist } from './sections/Tasklist'
import { msg } from './i18n'

import '@cascivo/themes/dark'
import '@cascivo/themes/light'
import '@cascivo/themes/warm'
import '@cascivo/tokens'

type Section = 'instances' | 'incidents' | 'tasklist'

export const currentSection = signal<Section>('instances')
export const selectedInstanceId = signal<string | null>(null)

export default function App() {
  useSignals()

  const navItems: SideNavItem[] = [
    {
      label: t(msg.navInstances),
      active: currentSection.value === 'instances',
      onClick: (e) => {
        e.preventDefault()
        currentSection.value = 'instances'
      },
    },
    {
      label: t(msg.navIncidents),
      active: currentSection.value === 'incidents',
      onClick: (e) => {
        e.preventDefault()
        currentSection.value = 'incidents'
      },
    },
    {
      label: t(msg.navTasklist),
      active: currentSection.value === 'tasklist',
      onClick: (e) => {
        e.preventDefault()
        currentSection.value = 'tasklist'
      },
    },
  ]

  return (
    <ToastProvider>
      <AppShell navItems={navItems} mockBanner>
        {currentSection.value === 'instances' && <Instances />}
        {currentSection.value === 'incidents' && <Incidents />}
        {currentSection.value === 'tasklist' && <Tasklist />}
      </AppShell>
    </ToastProvider>
  )
}
