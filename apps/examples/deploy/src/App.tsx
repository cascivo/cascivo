'use client'
import { signal, useSignalEffect, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { persistedSignal } from '@cascivo/storage'
import { deployMsg } from './i18n'
import { loadData, loadError } from './data/fixtures'
import { MetricsBar } from './sections/MetricsBar'
import { PipelineList } from './sections/PipelineList'
import { EnvironmentGrid } from './sections/EnvironmentGrid'
import { UsagePanel } from './sections/home/UsagePanel'
import { TemplateGallery } from './sections/home/TemplateGallery'
import { Deployments } from './sections/project/Deployments'
import { FlagsView } from './sections/flags/FlagsView'
import styles from './App.module.css'

import '@cascivo/themes/dark'
import '@cascivo/themes/light'
import '@cascivo/tokens'

const THEMES = ['dark', 'light'] as const
type Theme = (typeof THEMES)[number]

type View = 'home' | 'flags' | 'deployments'

const theme = persistedSignal<Theme>('deploy.theme', 'dark')
const currentView = signal<View>('home')

const NAV_ITEMS: Array<{ label: string; view: View }> = [
  { label: t(deployMsg.navPipelines), view: 'home' },
  { label: t(deployMsg.navFlags), view: 'flags' },
]

export default function App() {
  useSignals()

  useSignalEffect(() => {
    void loadData()
  })

  function cycleTheme() {
    const next = THEMES[(THEMES.indexOf(theme.value) + 1) % THEMES.length]
    theme.value = next ?? 'dark'
  }

  return (
    <div className={styles['shell']} data-theme={theme.value}>
      <header className={styles['header']}>
        <span className={styles['headerTitle']}>{t(deployMsg.appTitle)}</span>
        <nav className={styles['nav']}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.view}
              type="button"
              className={styles['navBtn']}
              data-active={currentView.value === item.view || undefined}
              onClick={() => {
                currentView.value = item.view
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button type="button" className={styles['themeToggle']} onClick={cycleTheme}>
          {theme.value}
        </button>
      </header>
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
      {currentView.value === 'home' && (
        <div className={styles['homeLayout']}>
          <main className={styles['main']}>
            <section className={styles['section']}>
              <h2 className={styles['sectionTitle']}>{t(deployMsg.sectionMetrics)}</h2>
              <MetricsBar />
            </section>
            <section className={styles['section']}>
              <h2 className={styles['sectionTitle']}>{t(deployMsg.sectionPipelines)}</h2>
              <PipelineList />
            </section>
            <section className={styles['section']}>
              <h2 className={styles['sectionTitle']}>{t(deployMsg.sectionEnvironments)}</h2>
              <EnvironmentGrid />
            </section>
            <TemplateGallery />
          </main>
          <aside className={styles['sidebar']}>
            <UsagePanel />
          </aside>
        </div>
      )}
    </div>
  )
}
