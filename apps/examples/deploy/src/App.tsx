'use client'
import { signal, useSignalEffect, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { ToastProvider } from '@cascivo/react'
import type { SideNavGroup } from '@cascivo/react'
import { AppShell } from '@cascivo/example-kit'
import {
  Folder,
  Server,
  Globe,
  BarChart,
  Database,
  Zap,
  Grid,
  Settings as SettingsIcon,
} from '@cascivo/icons'
import { deployMsg } from './i18n'
import { loadData, loadError } from './data/fixtures'
import { UsagePanel } from './sections/home/UsagePanel'
import { TemplateGallery } from './sections/home/TemplateGallery'
import { Deployments } from './sections/project/Deployments'
import { FlagsView } from './sections/flags/FlagsView'
import styles from './App.module.css'

import '@cascivo/themes/dark'
import '@cascivo/themes/light'
import '@cascivo/tokens'

type View = 'projects' | 'deployments' | 'flags'

const currentView = signal<View>('projects')

export default function App() {
  useSignals()

  useSignalEffect(() => {
    void loadData()
  })

  const navGroups: SideNavGroup[] = [
    {
      items: [
        {
          label: t(deployMsg.navProjects),
          icon: <Folder size={16} />,
          active: currentView.value === 'projects',
          onClick: (e) => {
            e.preventDefault()
            currentView.value = 'projects'
          },
        },
        {
          label: t(deployMsg.navDeployments),
          icon: <Server size={16} />,
          active: currentView.value === 'deployments',
          onClick: (e) => {
            e.preventDefault()
            currentView.value = 'deployments'
          },
        },
        {
          label: t(deployMsg.navDomains),
          icon: <Globe size={16} />,
          active: false,
          onClick: (e) => e.preventDefault(),
        },
        {
          label: t(deployMsg.navAnalytics),
          icon: <BarChart size={16} />,
          active: false,
          onClick: (e) => e.preventDefault(),
        },
        {
          label: t(deployMsg.navStorage),
          icon: <Database size={16} />,
          active: false,
          onClick: (e) => e.preventDefault(),
        },
      ],
    },
    {
      items: [
        {
          label: t(deployMsg.navFlags),
          icon: <Zap size={16} />,
          active: currentView.value === 'flags',
          onClick: (e) => {
            e.preventDefault()
            currentView.value = 'flags'
          },
        },
        {
          label: t(deployMsg.navUsage),
          icon: <Grid size={16} />,
          active: false,
          onClick: (e) => e.preventDefault(),
        },
        {
          label: t(deployMsg.navSettings),
          icon: <SettingsIcon size={16} />,
          active: false,
          onClick: (e) => e.preventDefault(),
        },
      ],
    },
  ]

  return (
    <ToastProvider>
      <AppShell navGroups={navGroups} mockBanner>
        {loadError.value && (
          <div
            role="alert"
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--cascivo-color-destructive-subtle)',
              color: 'var(--cascivo-color-error)',
            }}
          >
            {loadError.value}
          </div>
        )}
        {currentView.value === 'flags' && <FlagsView />}
        {currentView.value === 'deployments' && <Deployments />}
        {currentView.value === 'projects' && (
          <div className={styles['homeLayout']}>
            <aside className={styles['sidebar']}>
              <UsagePanel />
            </aside>
            <main className={styles['main']}>
              <TemplateGallery />
            </main>
          </div>
        )}
      </AppShell>
    </ToastProvider>
  )
}
