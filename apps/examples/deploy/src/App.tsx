'use client'
import { useSignal, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { deployMsg } from './i18n'
import { MetricsBar } from './sections/MetricsBar'
import { PipelineList } from './sections/PipelineList'
import { EnvironmentGrid } from './sections/EnvironmentGrid'
import styles from './App.module.css'

import '@cascivo/themes/dark'
import '@cascivo/themes/light'
import '@cascivo/tokens'

const THEMES = ['dark', 'light'] as const
type Theme = (typeof THEMES)[number]

export default function App() {
  useSignals()
  const theme = useSignal<Theme>('dark')

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
