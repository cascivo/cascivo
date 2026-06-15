'use client'
import { signal, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Badge, ToastProvider } from '@cascivo/react'
import type { SideNavGroup } from '@cascivo/react'
import { AppShell } from '@cascivo/example-kit'
import { Instances } from './sections/Instances'
import { Incidents } from './sections/Incidents'
import { Tasklist } from './sections/Tasklist'
import { msg } from './i18n'

import '@cascivo/themes/dark'
import '@cascivo/themes/light'
import '@cascivo/themes/warm'
import '@cascivo/tokens'

type Section = 'instances' | 'incidents' | 'tasklist' | 'catalog'

export const currentSection = signal<Section>('instances')
export const selectedInstanceId = signal<string | null>(null)

export default function App() {
  useSignals()

  const navGroups: SideNavGroup[] = [
    {
      label: t(msg.navGroupConsole),
      items: [
        {
          label: t(msg.navDashboard),
          active: currentSection.value === 'instances',
          onClick: (e) => {
            e.preventDefault()
            currentSection.value = 'instances'
          },
        },
        {
          label: t(msg.navClustersNav),
          active: false,
        },
        {
          label: t(msg.navOrganization),
          active: false,
        },
        {
          label: t(msg.navCatalog),
          active: currentSection.value === 'catalog',
          onClick: (e) => {
            e.preventDefault()
            currentSection.value = 'catalog'
          },
        },
      ],
    },
    {
      label: t(msg.navGroupClusters),
      items: [
        {
          label: t(msg.navClusterItem),
          active: false,
          icon: (
            <Badge size="sm" variant="secondary">
              Dev
            </Badge>
          ),
          items: [
            {
              label: t(msg.navInstances),
              href: '#',
              active: currentSection.value === 'instances',
            },
            {
              label: t(msg.navIncidents),
              href: '#',
              active: currentSection.value === 'incidents',
            },
            {
              label: t(msg.navTasklist),
              href: '#',
              active: currentSection.value === 'tasklist',
            },
          ],
          onClick: (e) => {
            e.preventDefault()
          },
        },
      ],
    },
  ]

  return (
    <ToastProvider>
      <AppShell navGroups={navGroups} mockBanner>
        {currentSection.value === 'instances' && <Instances />}
        {currentSection.value === 'incidents' && <Incidents />}
        {currentSection.value === 'tasklist' && <Tasklist />}
      </AppShell>
    </ToastProvider>
  )
}
