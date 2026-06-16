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
  const isMobile = useSignal(
    typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 39.999rem)').matches,
  )

  useSignalEffect(() => {
    document.body.style.overflow = sidebarOpen.value ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  })

  useSignalEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(max-width: 39.999rem)')
    const handler = (e: MediaQueryListEvent) => {
      isMobile.value = e.matches
    }
    isMobile.value = mq.matches
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  })

  useSignalEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen.value) {
        sidebarOpen.value = false
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
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

      <aside
        className={styles.sidebar}
        data-open={String(sidebarOpen.value)}
        aria-hidden={isMobile.value ? !sidebarOpen.value : undefined}
      >
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
