'use client'
import { useSignal, useSignals } from '@cascivo/core'
import { HeaderPanel, ShellHeader, SideNav, Switcher } from '@cascivo/react'
import { Bell, Database, Grid, HelpCircle, Home, Server, Settings, Users } from '@cascivo/icons'
import { AppShell } from '../../app-shell/app-shell'
import { createShellState } from '../../app-shell/shell-state'
import { PageHeader } from '../../page-header/page-header'
import styles from './console-app.module.css'

const instances = [
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
]

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
          brand={{ prefix: 'cascivo', name: 'Console', href: '#' }}
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
        <div className={styles['aside-content']}>
          <h2 className={styles['aside-title']}>Resource details</h2>
          <dl className={styles['aside-dl']}>
            <dt className={styles['aside-dt']}>Status</dt>
            <dd className={styles['aside-dd']}>Running</dd>
            <dt className={styles['aside-dt']}>Region</dt>
            <dd className={styles['aside-dd']}>us-east-1</dd>
            <dt className={styles['aside-dt']}>CPU</dt>
            <dd className={styles['aside-dd']}>4 vCPU</dd>
            <dt className={styles['aside-dt']}>Memory</dt>
            <dd className={styles['aside-dd']}>16 GB</dd>
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
          <li className={styles['panel-item']}>Instance i-001 started</li>
          <li className={styles['panel-item']}>Backup completed</li>
          <li className={styles['panel-item']}>Certificate renewed</li>
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
      <div className={styles['content']}>
        <PageHeader title="Instances" description="Manage your compute instances" />
        <div className={styles['table-wrap']}>
          <table className={styles['table']}>
            <thead className={styles['thead']}>
              <tr>
                {['Name', 'Status', 'Type', 'Region', 'IP', 'Created', 'Actions'].map((h) => (
                  <th key={h} className={styles['th']}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={styles['tbody']}>
              {instances.map((row) => (
                <tr key={row.name} className={styles['tr']}>
                  <td className={styles['td']} data-label="Name">
                    {row.name}
                  </td>
                  <td className={styles['td']} data-label="Status">
                    {row.status}
                  </td>
                  <td className={styles['td']} data-label="Type">
                    {row.type}
                  </td>
                  <td className={styles['td']} data-label="Region">
                    {row.region}
                  </td>
                  <td className={styles['td']} data-label="IP">
                    {row.ip}
                  </td>
                  <td className={styles['td']} data-label="Created">
                    {row.created}
                  </td>
                  <td className={styles['td']} data-label="Actions">
                    <a href="#" className={styles['action-link']}>
                      Manage
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
