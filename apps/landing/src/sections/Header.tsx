'use client'
import { useRef } from 'react'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { ShellHeader } from '@cascivo/components/shell-header'
import { THEMES, setTheme, theme } from '../theme'

const path = typeof window !== 'undefined' ? window.location.pathname : '/'

const NAV_LINKS = [
  { label: 'Components', href: '/docs' },
  { label: 'Examples', href: '/examples', active: path.startsWith('/examples') },
  { label: 'Storybook', href: '/storybook' },
  {
    label: 'Accessibility',
    href: '/accessibility',
    active: path.startsWith('/accessibility'),
  },
  {
    label: 'Performance',
    href: '/performance',
    active: path.startsWith('/performance'),
  },
  {
    label: 'Guides',
    href: '/guides',
    active: path.startsWith('/guides'),
  },
  { label: 'GitHub', href: 'https://github.com/urbanisierung/cascivo' },
]

export function Header() {
  useSignals()
  const isNavOpen = useSignal(false)
  const drawerRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLElement | null>(null)

  // Body scroll lock
  useSignalEffect(() => {
    if (isNavOpen.value) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  })

  // Escape key closes drawer
  useSignalEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') isNavOpen.value = false
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  // Focus trap: while open, keep Tab/Shift-Tab inside the drawer; on close,
  // restore focus to whatever opened it (captured in onMenuClick — the
  // hamburger toggle). DOM side effect → useSignalEffect, never useEffect.
  useSignalEffect(() => {
    const drawer = drawerRef.current
    if (!isNavOpen.value || !drawer) return
    const focusables = () =>
      Array.from(drawer.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
    focusables()[0]?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
    drawer.addEventListener('keydown', onKey)
    return () => {
      drawer.removeEventListener('keydown', onKey)
      toggleRef.current?.focus()
    }
  })

  return (
    <>
      <ShellHeader
        brand={{ name: 'cascivo', href: '/' }}
        nav={NAV_LINKS}
        // The landing supplies its own SkipNavLink/SkipNavTarget on every page;
        // disable ShellHeader's built-in skip link so its default #cascade-main
        // target (which the landing doesn't render) can't dangle.
        skipToContentHref={false}
        onMenuClick={() => {
          // Capture the toggle so focus can return to it on close.
          if (!isNavOpen.value) toggleRef.current = document.activeElement as HTMLElement | null
          isNavOpen.value = !isNavOpen.value
        }}
        menuExpanded={isNavOpen.value}
        end={
          <div className="header-themes" role="group" aria-label="Theme">
            {THEMES.map((t) => (
              <button
                key={t}
                type="button"
                className="header-theme-dot"
                data-state={theme.value === t ? 'active' : undefined}
                data-theme-name={t}
                aria-pressed={theme.value === t}
                onClick={() => setTheme(t)}
              >
                <span className="visually-hidden">{t}</span>
              </button>
            ))}
          </div>
        }
      />

      {/* Scrim */}
      {isNavOpen.value && (
        <div
          className="nav-scrim"
          aria-hidden="true"
          onClick={() => {
            isNavOpen.value = false
          }}
        />
      )}

      {/* Off-canvas drawer */}
      <nav
        ref={drawerRef}
        id="mobile-nav-drawer"
        className={`mobile-nav-drawer${isNavOpen.value ? ' mobile-nav-drawer--open' : ''}`}
        aria-label="Main navigation"
        aria-hidden={!isNavOpen.value}
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="mobile-nav-link"
            aria-current={link.active ? 'page' : undefined}
            onClick={() => {
              isNavOpen.value = false
            }}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </>
  )
}
