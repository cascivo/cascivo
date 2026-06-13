'use client'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { ShellHeader } from '@cascivo/components/shell-header'
import { THEMES, setTheme, theme } from '../theme'

const path = typeof window !== 'undefined' ? window.location.pathname : '/'

const NAV_LINKS = [
  { label: 'Components', href: '/docs' },
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
  { label: 'GitHub', href: 'https://github.com/urbanisierung/cascivo' },
]

export function Header() {
  useSignals()
  const isNavOpen = useSignal(false)

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

  return (
    <>
      <ShellHeader
        brand={{ name: 'cascivo', href: '/' }}
        nav={NAV_LINKS}
        onMenuClick={() => {
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
