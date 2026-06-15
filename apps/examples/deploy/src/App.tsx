'use client'
import { signal, useSignalEffect, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { ToastProvider } from '@cascivo/react'
import type { SideNavGroup } from '@cascivo/react'
import { AppShell } from '@cascivo/example-kit'
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
          active: currentView.value === 'projects',
          onClick: (e) => {
            e.preventDefault()
            currentView.value = 'projects'
          },
        },
        {
          label: t(deployMsg.navDeployments),
          active: currentView.value === 'deployments',
          onClick: (e) => {
            e.preventDefault()
            currentView.value = 'deployments'
          },
        },
        { label: t(deployMsg.navDomains), active: false, onClick: (e) => e.preventDefault() },
        { label: t(deployMsg.navAnalytics), active: false, onClick: (e) => e.preventDefault() },
        { label: t(deployMsg.navStorage), active: false, onClick: (e) => e.preventDefault() },
      ],
    },
    {
      items: [
        {
          label: t(deployMsg.navFlags),
          active: currentView.value === 'flags',
          onClick: (e) => {
            e.preventDefault()
            currentView.value = 'flags'
          },
        },
        { label: t(deployMsg.navUsage), active: false, onClick: (e) => e.preventDefault() },
        { label: t(deployMsg.navSettings), active: false, onClick: (e) => e.preventDefault() },
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
