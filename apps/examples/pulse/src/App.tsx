'use client'
import { signal, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { ToastProvider, Button, SegmentedControl } from '@cascivo/react'
import { persistedSignal } from '@cascivo/storage'
import { AppShell, useSimulation } from '@cascivo/example-kit'
import type { SideNavItem } from '@cascivo/react'
import { metricsSim } from './sim/metrics'
import { Overview } from './sections/Overview'
import { Metrics } from './sections/Metrics'
import { Alerts } from './sections/Alerts'
import { Logs } from './sections/Logs'
import { msg } from './i18n'

import '@cascivo/themes/dark.css'
import '@cascivo/themes/light.css'
import '@cascivo/themes/warm.css'
import '@cascivo/tokens'

type Section = 'overview' | 'metrics' | 'alerts' | 'logs'
type TimeRange = 'live' | '5m' | '1h'

export const currentSection = signal<Section>('overview')
export const timeRange = persistedSignal<TimeRange>('pulse-range', 'live')

const RANGE_OPTIONS = [
  { label: t(msg.controlsLive), value: 'live' as TimeRange },
  { label: t(msg.controls5m), value: '5m' as TimeRange },
  { label: t(msg.controls1h), value: '1h' as TimeRange },
]

export default function App() {
  useSignals()

  // Start simulation — runs once, cleaned up on unmount
  useSimulation(metricsSim)

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
      label: t(msg.navMetrics),
      active: currentSection.value === 'metrics',
      onClick: (e) => {
        e.preventDefault()
        currentSection.value = 'metrics'
      },
    },
    {
      label: t(msg.navAlerts),
      active: currentSection.value === 'alerts',
      onClick: (e) => {
        e.preventDefault()
        currentSection.value = 'alerts'
      },
    },
    {
      label: t(msg.navLogs),
      active: currentSection.value === 'logs',
      onClick: (e) => {
        e.preventDefault()
        currentSection.value = 'logs'
      },
    },
  ]

  const actions = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--cascivo-space-3)',
      }}
    >
      {metricsSim.running.value && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--cascivo-space-1)',
            fontSize: 'var(--cascivo-text-xs)',
            fontWeight: 600,
            color: 'var(--cascivo-color-success)',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '0.5rem',
              height: '0.5rem',
              borderRadius: '50%',
              background: 'var(--cascivo-color-success)',
              animation: 'pulse-blink 1.2s ease-in-out infinite',
            }}
          />
          {t(msg.liveLabel)}
        </span>
      )}
      <SegmentedControl
        options={RANGE_OPTIONS}
        value={timeRange.value}
        onValueChange={(v) => {
          timeRange.value = v as TimeRange
        }}
        size="sm"
      />
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          metricsSim.toggle()
        }}
      >
        {metricsSim.running.value ? t(msg.pauseSimulation) : t(msg.resumeSimulation)}
      </Button>
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes pulse-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      <ToastProvider>
        <AppShell navItems={navItems} actions={actions} mockBanner>
          {currentSection.value === 'overview' && <Overview />}
          {currentSection.value === 'metrics' && <Metrics />}
          {currentSection.value === 'alerts' && <Alerts />}
          {currentSection.value === 'logs' && <Logs />}
        </AppShell>
      </ToastProvider>
    </>
  )
}
