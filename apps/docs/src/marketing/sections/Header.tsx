'use client'
import { useRef, type ReactElement } from 'react'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { ShellHeader, type ShellHeaderNavItem } from '@cascivo/components/shell-header'
import { Tooltip } from '@cascivo/components/tooltip'
import { Dropdown, type DropdownItem } from '@cascivo/components/dropdown'
import { setTheme, theme, THEMES, type ThemeName } from '../../theme'
import { currentPath, navigate } from '../../router'
import { SearchButton } from '../search/SearchButton'
import { searchOpen } from '../search/state'
import { peek } from '../peek'

const GITHUB_HREF = 'https://github.com/cascivo/cascivo'

type NavLink = { label: string; href: string }

// Slim primary nav (v36): three top-level links. Secondary routes group under a
// "Resources" menu; every route is also reachable from the footer link map.
const PRIMARY_LINKS: NavLink[] = [
  { label: 'Docs', href: '/docs' },
  { label: 'Examples', href: '/examples' },
  { label: 'Guides', href: '/guides' },
]

const RESOURCE_LINKS: NavLink[] = [
  { label: 'Highlights', href: '/highlights' },
  { label: 'Showcase', href: '/showcase' },
  { label: 'Create', href: '/create' },
  { label: 'Blocks', href: '/blocks' },
  { label: 'Accessibility', href: '/accessibility' },
  { label: 'Performance', href: '/performance' },
  { label: 'Modern CSS', href: '/modern-css' },
  { label: 'AI', href: '/ai' },
]

function isExternalHref(href: string) {
  return /^https?:\/\//.test(href)
}

// All themes are selectable from a dropdown (not just the three first-party ones).
const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="7.05" y2="7.05" />
      <line x1="16.95" y1="16.95" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="7.05" y2="16.95" />
      <line x1="16.95" y1="7.05" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function WarmIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      <path d="M17 12a5 5 0 0 1-5 5" strokeOpacity="0.5" />
    </svg>
  )
}

function PaletteIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.012 17.5 2 12 2z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

const THEME_ICONS: Record<string, () => ReactElement> = {
  light: SunIcon,
  dark: MoonIcon,
  warm: WarmIcon,
}

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
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
  const isActive = (href: string) => !isExternalHref(href) && currentPath.value.startsWith(href)
  const navItems: ShellHeaderNavItem[] = [
    ...PRIMARY_LINKS.map((link) => ({ ...link, active: isActive(link.href) })),
    {
      label: 'Resources',
      items: RESOURCE_LINKS.map((link) => ({ ...link, active: isActive(link.href) })),
    },
  ]
  const drawerLinks = [...PRIMARY_LINKS, ...RESOURCE_LINKS]
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
            {currentPath.value === '/' && (
              <Tooltip
                content={peek.value ? 'Back to the page' : 'Peek at the components'}
                placement="bottom"
              >
                <button
                  type="button"
                  className="header-peek-toggle"
                  aria-pressed={peek.value}
                  aria-label={
                    peek.value
                      ? 'Hide the components and show the page'
                      : 'Peek at the components behind the page'
                  }
                  onClick={() => {
                    peek.value = !peek.value
                  }}
                >
                  <EyeIcon />
                </button>
              </Tooltip>
            )}
            <Dropdown
              placement="bottom-end"
              items={THEMES.map(
                (t): DropdownItem => ({
                  label: titleCase(t),
                  value: t,
                  ...(theme.value === t ? { icon: <CheckIcon /> } : {}),
                }),
              )}
              onSelect={(value) => setTheme(value as ThemeName)}
              trigger={
                <button
                  type="button"
                  className="header-theme-cycle"
                  aria-label={`Switch theme, current: ${theme.value}`}
                >
                  {(THEME_ICONS[theme.value] ?? PaletteIcon)()}
                </button>
              }
            />
            <SearchButton
              onClick={() => {
                searchOpen.value = true
              }}
            />
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
        inert={!isNavOpen.value ? true : undefined}
      >
        {drawerLinks.map((link) => {
          const isExternal = isExternalHref(link.href)
          return (
            <a
              key={link.href}
              href={link.href}
              className="mobile-nav-link"
              aria-current={isActive(link.href) ? 'page' : undefined}
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
