'use client'
import { signal, useMediaQuery, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Activity, Bell, LayoutDashboard, Terminal } from '@cascivo/icons'
import { ToastProvider, Badge, Button, SegmentedControl, Status } from '@cascivo/react'
import { persistedSignal } from '@cascivo/storage'
import { AppShell, useSimulation } from '@cascivo/example-kit'
import type { SideNavItem } from '@cascivo/react'
import { alerts, hostMetrics, metricsSim } from './sim/metrics'
import { HOSTS } from './data/seed'
import { Overview } from './sections/Overview'
import { Metrics } from './sections/Metrics'
import { Alerts } from './sections/Alerts'
import { Logs } from './sections/Logs'
import { msg } from './i18n'

// Every theme the landing can wear: the hero embeds this app in whatever theme the visitor
// picked there, including cascivo.com's own poster pair (site-local, not a published theme).
import '@cascivo/themes/all.css'
import '../../../site/src/poster.css'
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
      ...(alerts.value.length > 0
        ? {
            trailing: (
              <Badge variant="danger" size="sm">
                {alerts.value.length}
              </Badge>
            ),
          }
        : {}),
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

  // Sidebar footer: per-region health, so the rail carries signal instead of empty space.
  const regionHealth = [...new Set(HOSTS.map((h) => h.region))].map((region) => {
    const services = hostMetrics.value.filter((hm) => hm.host.region === region)
    const failing = services.filter((hm) => hm.p99 > 500 || hm.errorRate > 0.01).length
    return { region, services: services.length, failing }
  })
  const navFooter = (
    <div
      style={{
        display: 'grid',
        gap: 'var(--cascivo-space-2)',
        padding: 'var(--cascivo-space-3)',
        fontSize: 'var(--cascivo-text-xs)',
        color: 'var(--cascivo-color-foreground-muted)',
      }}
    >
      <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
        {t(msg.sidebarRegions)}
      </span>
      {regionHealth.map((r) => (
        <Status key={r.region} status={r.failing > 0 ? 'warning' : 'success'}>
          <span style={{ fontFamily: 'var(--cascivo-font-mono)' }}>{r.region}</span>
          <span style={{ marginInlineStart: 'auto' }}>
            {r.services - r.failing}/{r.services}
          </span>
        </Status>
      ))}
    </div>
  )

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
            data-pulse-live=""
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
        @media (prefers-reduced-motion: reduce) {
          [data-pulse-live] { animation: none !important; }
        }
      `}</style>
      <ToastProvider>
        <AppShell
          navItems={navItems}
          navFooter={navFooter}
          actions={wide.value ? controls : undefined}
          mockBanner
        >
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
