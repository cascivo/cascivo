'use client'
import { useSignalEffect, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { persistedSignal } from '@cascivo/storage'
import { deployMsg } from './i18n'
import { loadData, loadError } from './data/fixtures'
import { MetricsBar } from './sections/MetricsBar'
import { PipelineList } from './sections/PipelineList'
import { EnvironmentGrid } from './sections/EnvironmentGrid'
import styles from './App.module.css'

import '@cascivo/themes/dark'
import '@cascivo/themes/light'
import '@cascivo/tokens'

const THEMES = ['dark', 'light'] as const
type Theme = (typeof THEMES)[number]

// Module-level persisted signal — theme survives page reload
const theme = persistedSignal<Theme>('deploy.theme', 'dark')

export default function App() {
  useSignals()

  // Trigger initial data load via signal effect (never useEffect)
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
      </main>
    </div>
  )
}
