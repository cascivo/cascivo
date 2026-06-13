'use client'
import { useSignal, useSignals } from '@cascade-ui/core'
import { HeaderPanel, ShellHeader, SideNav, Switcher } from '@cascade-ui/react'
import { Bell, Database, Grid, HelpCircle, Home, Server, Settings, Users } from '@cascade-ui/icons'
import { AppShell } from '../../app-shell/app-shell'
import { createShellState } from '../../app-shell/shell-state'
import { PageHeader } from '../../page-header/page-header'

export function ConsoleApp() {
  useSignals()

  const stateStore = useSignal<ReturnType<typeof createShellState> | null>(null)
  if (stateStore.peek() === null) stateStore.value = createShellState({ persistKey: false })
  const shell = stateStore.peek()!

  const openPanel = useSignal<'notifications' | 'switcher' | null>(null)

  return (
    <AppShell
      state={shell}
      persistKey={false}
      header={
        <ShellHeader
          brand={{ prefix: 'cascade', name: 'Console', href: '#' }}
          onMenuClick={shell.toggleSideNav}
          menuExpanded={!shell.sideNavCollapsed.value}
          nav={[
            { label: 'Overview', href: '#', active: true },
            {
              label: 'Resources',
              items: [
                { label: 'Instances', href: '#' },
                { label: 'Volumes', href: '#' },
                { label: 'Networks', href: '#' },
              ],
            },
            {
              label: 'Manage',
              items: [
                { label: 'Users', href: '#' },
                { label: 'Access groups', href: '#' },
              ],
            },
          ]}
          actions={[
            {
              id: 'notifications',
              label: 'Notifications',
              icon: <Bell />,
              active: openPanel.value === 'notifications',
              onClick: () => {
                openPanel.value = openPanel.value === 'notifications' ? null : 'notifications'
              },
            },
            {
              id: 'switcher',
              label: 'Switch application',
              icon: <Grid />,
              active: openPanel.value === 'switcher',
              onClick: () => {
                openPanel.value = openPanel.value === 'switcher' ? null : 'switcher'
              },
            },
            { id: 'help', label: 'Help', icon: <HelpCircle /> },
          ]}
        />
      }
      sideNav={
        <SideNav
          collapsed={shell.sideNavCollapsed.value}
          onCollapsedChange={(c) => {
            shell.sideNavCollapsed.value = c
          }}
          items={[
            { label: 'Home', href: '#', icon: <Home />, active: true },
            { label: 'Servers', href: '#', icon: <Server /> },
            {
              label: 'Compute',
              icon: <Server />,
              items: [
                { label: 'Instances', href: '#' },
                { label: 'Images', href: '#' },
              ],
            },
            { label: 'Databases', href: '#', icon: <Database /> },
            { label: 'Team', href: '#', icon: <Users /> },
            { label: 'Settings', href: '#', icon: <Settings /> },
          ]}
          footer={<span style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>v4.0.0</span>}
        />
      }
      aside={
        <div
          style={{ padding: '1rem', borderInlineStart: '1px solid var(--cascivo-color-border)' }}
        >
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, marginBlockEnd: '0.75rem' }}>
            Resource details
          </h2>
          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '0.25rem 0.75rem',
              fontSize: '0.875rem',
            }}
          >
            <dt style={{ color: 'var(--cascivo-color-text-subtle)' }}>Status</dt>
            <dd>Running</dd>
            <dt style={{ color: 'var(--cascivo-color-text-subtle)' }}>Region</dt>
            <dd>us-east-1</dd>
            <dt style={{ color: 'var(--cascivo-color-text-subtle)' }}>CPU</dt>
            <dd>4 vCPU</dd>
            <dt style={{ color: 'var(--cascivo-color-text-subtle)' }}>Memory</dt>
            <dd>16 GB</dd>
          </dl>
        </div>
      }
    >
      <HeaderPanel
        open={openPanel.value === 'notifications'}
        onClose={() => {
          if (openPanel.value === 'notifications') openPanel.value = null
        }}
        label="Notifications"
      >
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li
            style={{
              padding: '0.75rem 1rem',
              borderBlockEnd: '1px solid var(--cascivo-color-border)',
            }}
          >
            Instance i-001 started
          </li>
          <li
            style={{
              padding: '0.75rem 1rem',
              borderBlockEnd: '1px solid var(--cascivo-color-border)',
            }}
          >
            Backup completed
          </li>
          <li style={{ padding: '0.75rem 1rem' }}>Certificate renewed</li>
        </ul>
      </HeaderPanel>
      <HeaderPanel
        open={openPanel.value === 'switcher'}
        onClose={() => {
          if (openPanel.value === 'switcher') openPanel.value = null
        }}
        label="Switch application"
      >
        <Switcher
          items={[
            { label: 'Console', href: '#', active: true },
            { label: 'Billing', href: '#' },
            { divider: true },
            { label: 'Docs', href: '#' },
          ]}
        />
      </HeaderPanel>
      <div style={{ padding: '1.5rem' }}>
        <PageHeader title="Instances" description="Manage your compute instances" />
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBlockStart: '1rem' }}>
          <thead>
            <tr>
              {['Name', 'Status', 'Type', 'Region', 'IP', 'Created', 'Actions'].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'start',
                    padding: '0.5rem',
                    borderBlockEnd: '1px solid var(--cascivo-color-border)',
                    fontSize: '0.875rem',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              {
                name: 'web-01',
                status: 'Running',
                type: 't3.medium',
                region: 'us-east-1',
                ip: '10.0.0.1',
                created: '2024-01-01',
              },
              {
                name: 'web-02',
                status: 'Running',
                type: 't3.medium',
                region: 'us-east-1',
                ip: '10.0.0.2',
                created: '2024-01-02',
              },
              {
                name: 'db-01',
                status: 'Running',
                type: 'r5.large',
                region: 'us-west-2',
                ip: '10.0.1.1',
                created: '2024-01-03',
              },
              {
                name: 'cache-01',
                status: 'Stopped',
                type: 't3.small',
                region: 'us-east-1',
                ip: '10.0.0.3',
                created: '2024-01-04',
              },
            ].map((row) => (
              <tr key={row.name}>
                {[row.name, row.status, row.type, row.region, row.ip, row.created, 'Manage'].map(
                  (cell) => (
                    <td
                      key={cell}
                      style={{
                        padding: '0.5rem',
                        borderBlockEnd: '1px solid var(--cascivo-color-border)',
                        fontSize: '0.875rem',
                      }}
                    >
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  )
}
