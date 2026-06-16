'use client'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { Button } from '../../button/button'
import styles from './app-shell.module.css'

type NavItem = { label: string; href: string; icon: string; current?: boolean }

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '#', icon: '🏠', current: true },
  { label: 'Analytics', href: '#', icon: '📊' },
  { label: 'Customers', href: '#', icon: '👥' },
  { label: 'Orders', href: '#', icon: '📦' },
  { label: 'Settings', href: '#', icon: '⚙️' },
]

export function AppShell() {
  useSignals()
  const sidebarOpen = useSignal(false)

  useSignalEffect(() => {
    document.body.style.overflow = sidebarOpen.value ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  })

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function closeSidebar() {
    sidebarOpen.value = false
  }

  return (
    <div className={styles.root}>
      <div className={styles.topbar}>
        <span className={styles.topbarLogo}>cascivo</span>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Open menu"
          aria-expanded={sidebarOpen.value}
          onClick={toggleSidebar}
        >
          ☰
        </Button>
      </div>

      {sidebarOpen.value && (
        <div className={styles.overlay} onClick={closeSidebar} aria-hidden="true" />
      )}

      <aside className={styles.sidebar} data-open={String(sidebarOpen.value)}>
        <div className={styles.sidebarLogo}>cascivo</div>
        <nav className={styles.nav} aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={styles.navLink}
              aria-current={item.current ? 'page' : undefined}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <main className={styles.content}>
        <p className={styles.breadcrumb}>Home / Dashboard</p>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <div className={styles.contentPlaceholder}>Page content goes here</div>
      </main>
    </div>
  )
}
