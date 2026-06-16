'use client'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import {
  Activity,
  AlertTriangle,
  Dashboard,
  MoreHorizontal,
  Settings,
  Tag,
  Zap,
} from '@cascivo/icons'
import type { MouseEvent } from 'react'
import { Card } from '@cascivo/components/card'
import { Menu, MenuItem, MenuSeparator, MenuTrigger } from '@cascivo/components/menu'
import { SideNav } from '@cascivo/components/side-nav'
import { ToastProvider, useToast } from '@cascivo/components/toast'
import registry from '../../../../registry.json'
import { DeploysRegion } from './DeploysRegion'
import { FlagsRegion } from './FlagsRegion'
import { KpiRow } from './KpiRow'
import { SideRegion } from './SideRegion'
import { TrafficRegion } from './TrafficRegion'
import { NAV } from './data'

const componentCount = (registry as { components: unknown[] }).components.length

const NAV_ICONS: Record<(typeof NAV)[number], React.ReactNode> = {
  Overview: <Dashboard />,
  Deploys: <Zap />,
  Incidents: <AlertTriangle />,
  Traffic: <Activity />,
  Flags: <Tag />,
  Settings: <Settings />,
}

function SettingsView() {
  return (
    <section className="region" aria-label="Settings">
      <div className="region-head">
        <h3>Settings</h3>
      </div>
      <Card padding="md">
        <p className="console-microcopy">Settings panel — coming in the next release.</p>
      </Card>
    </section>
  )
}

function TitlebarMenu() {
  const { toast } = useToast()
  return (
    <Menu>
      <MenuTrigger aria-label="Console menu">
        <MoreHorizontal />
      </MenuTrigger>
      <MenuItem onSelect={() => toast({ title: 'Status page opened in a new tab' })}>
        View status page
      </MenuItem>
      <MenuItem
        onSelect={() => {
          void navigator.clipboard.writeText('https://status.relay.dev/incident/2f9b3aa')
          toast({ title: 'Incident link copied' })
        }}
      >
        Copy incident link
      </MenuItem>
      <MenuSeparator />
      <MenuItem onSelect={() => toast({ title: 'Signed out (demo)' })}>Sign out</MenuItem>
    </Menu>
  )
}

export function RelayConsole() {
  useSignals()
  const activeNav = useSignal(0)
  const sidebarOpen = useSignal(false)

  useSignalEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') sidebarOpen.value = false
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  const navItems = NAV.map((label, i) => ({
    label,
    icon: NAV_ICONS[label as (typeof NAV)[number]],
    active: activeNav.value === i,
    href: '#',
    onClick: (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      activeNav.value = i
    },
  }))

  const activeView = NAV[activeNav.value]

  return (
    <ToastProvider>
      <section
        className="console"
        id="console"
        aria-label="Live demo — Relay deploy console"
        data-reveal=""
      >
        <p className="console-note">
          The console below is live — 25+ cascivo components, real markup. Switch the theme in the
          header; the on-call card stays <code>data-theme=&quot;warm&quot;</code> on purpose.
        </p>
        <div className="console-frame" data-sidebar-open={sidebarOpen.value ? '' : undefined}>
          <header className="console-titlebar">
            <button
              type="button"
              className="console-burger"
              aria-label={sidebarOpen.value ? 'Close sidebar' : 'Open sidebar'}
              aria-expanded={sidebarOpen.value}
              aria-controls="console-sidebar"
              onClick={() => {
                sidebarOpen.value = !sidebarOpen.value
              }}
            >
              <span className="console-burger-bar" />
              <span className="console-burger-bar" />
              <span className="console-burger-bar" />
            </button>
            <span className="console-brand">Relay</span>
            <div className="console-titlebar-actions">
              <span className="console-env">production · eu-central</span>
              <TitlebarMenu />
            </div>
          </header>
          <div className="console-body">
            <div
              id="console-sidebar"
              className={`console-sidebar${sidebarOpen.value ? ' console-sidebar--open' : ''}`}
              aria-hidden={!sidebarOpen.value ? true : undefined}
            >
              <SideNav items={navItems} ariaLabel="Relay" defaultCollapsed />
            </div>
            <main className="console-main">
              {activeView === 'Overview' && (
                <>
                  <KpiRow />
                  <div className="console-grid">
                    <TrafficRegion />
                    <SideRegion />
                    <DeploysRegion />
                    <FlagsRegion />
                  </div>
                </>
              )}
              {activeView === 'Deploys' && <DeploysRegion />}
              {activeView === 'Incidents' && (
                <>
                  <KpiRow />
                  <div className="console-grid">
                    <SideRegion />
                  </div>
                </>
              )}
              {activeView === 'Traffic' && (
                <>
                  <KpiRow />
                  <TrafficRegion />
                </>
              )}
              {activeView === 'Flags' && <FlagsRegion />}
              {activeView === 'Settings' && <SettingsView />}
            </main>
          </div>
          {sidebarOpen.value && (
            <div
              className="console-scrim"
              aria-hidden="true"
              onClick={() => {
                sidebarOpen.value = false
              }}
            />
          )}
        </div>
        <p className="console-after">
          Built from <a href="/docs">{componentCount}+ components</a> — this page imports them like
          any app.
        </p>
      </section>
    </ToastProvider>
  )
}
