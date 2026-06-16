'use client'
import { useRef } from 'react'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { ShellHeader } from '@cascivo/components/shell-header'
import { THEMES, setTheme, theme } from '../theme'
import { currentPath, navigate } from '../router'

const GITHUB_HREF = 'https://github.com/urbanisierung/cascivo'

const NAV_LINKS = [
  { label: 'Components', href: 'https://docs.cascivo.com' },
  { label: 'Examples', href: '/examples' },
  { label: 'Storybook', href: 'https://storybook.cascivo.com' },
  { label: 'Accessibility', href: '/accessibility' },
  { label: 'Performance', href: '/performance' },
  { label: 'Guides', href: '/guides' },
]

function isExternalHref(href: string) {
  return /^https?:\/\//.test(href)
}

function GitHubIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="20"
      height="20"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

export function Header() {
  useSignals()
  const isNavOpen = useSignal(false)

  // Active detection is reactive: reads currentPath so navigation re-renders it.
  const navItems = NAV_LINKS.map((link) => ({
    ...link,
    active: !isExternalHref(link.href) && currentPath.value.startsWith(link.href),
  }))
  const drawerRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLElement | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  // Scroll progress — write to a CSS custom property directly to avoid re-renders.
  useSignalEffect(() => {
    const update = () => {
      const el = progressRef.current
      if (!el) return
      const scrollable = document.body.scrollHeight - window.innerHeight
      const ratio = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0
      el.style.setProperty('--scroll-ratio', String(ratio))
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  })

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
        className="landing-shell-header"
        brand={{ name: 'cascivo', href: '/' }}
        nav={navItems}
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
          <>
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
            <a
              href={GITHUB_HREF}
              className="header-icon-link"
              aria-label="GitHub"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon />
            </a>
          </>
        }
      />

      <div ref={progressRef} className="scroll-progress" aria-hidden="true" />

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
        {navItems.map((link) => {
          const isExternal = isExternalHref(link.href)
          return (
            <a
              key={link.href}
              href={link.href}
              className="mobile-nav-link"
              aria-current={link.active ? 'page' : undefined}
              {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              onClick={() => {
                isNavOpen.value = false
                if (!isExternal) navigate(link.href)
              }}
            >
              {link.label}
            </a>
          )
        })}
      </nav>
    </>
  )
}
