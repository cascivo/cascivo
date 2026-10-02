'use client'
import { signal, useMediaQuery, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Activity, Bell, LayoutDashboard, Terminal } from '@cascivo/icons'
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

import '@cascivo/themes/brutalist.css'
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
  // A phone-width header cannot hold the brand, theme toggle, live badge, range control and
  // pause button in one row, so below md the controls move into a toolbar above the content.
  const wide = useMediaQuery('(min-width: 40rem)')

  const navItems: SideNavItem[] = [
    {
      label: t(msg.navOverview),
      icon: <LayoutDashboard size={16} />,
      active: currentSection.value === 'overview',
      onClick: (e) => {
        e.preventDefault()
        currentSection.value = 'overview'
      },
    },
    {
      label: t(msg.navMetrics),
      icon: <Activity size={16} />,
      active: currentSection.value === 'metrics',
      onClick: (e) => {
        e.preventDefault()
        currentSection.value = 'metrics'
      },
    },
    {
      label: t(msg.navAlerts),
      icon: <Bell size={16} />,
      active: currentSection.value === 'alerts',
      onClick: (e) => {
        e.preventDefault()
        currentSection.value = 'alerts'
      },
    },
    {
      label: t(msg.navLogs),
      icon: <Terminal size={16} />,
      active: currentSection.value === 'logs',
      onClick: (e) => {
        e.preventDefault()
        currentSection.value = 'logs'
      },
    },
  ]

  const controls = (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 'var(--cascivo-space-3)',
        ...(wide.value
          ? {}
          : {
              padding: 'var(--cascivo-space-3) var(--cascivo-space-6)',
              borderBlockEnd: '1px solid var(--cascivo-color-border)',
            }),
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
        <AppShell navItems={navItems} actions={wide.value ? controls : undefined} mockBanner>
          {!wide.value && controls}
          {currentSection.value === 'overview' && <Overview />}
          {currentSection.value === 'metrics' && <Metrics />}
          {currentSection.value === 'alerts' && <Alerts />}
          {currentSection.value === 'logs' && <Logs />}
        </AppShell>
      </ToastProvider>
    </>
  )
}
