'use client'
import { Header, SideNav } from '@cascade-ui/react'
import { AppShell } from '../../app-shell/app-shell'

export function SidebarApp() {
  return (
    <AppShell
      persistKey={false}
      header={
        <Header
          brand={<span>App</span>}
          links={[{ label: 'Dashboard', href: '#', active: true }]}
        />
      }
      sideNav={
        <SideNav
          items={[
            { label: 'Dashboard', href: '#', active: true },
            { label: 'Users', href: '#' },
            { label: 'Settings', href: '#' },
          ]}
        />
      }
    >
      <div style={{ padding: '2rem' }}>
        <h1>Dashboard</h1>
        <p>Welcome to your app.</p>
      </div>
    </AppShell>
  )
}
