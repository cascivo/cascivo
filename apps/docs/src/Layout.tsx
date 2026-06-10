import type { ComponentChildren } from 'preact'
import { useSignals } from '@cascade-ui/core'
import { useLocation } from 'preact-iso'
import { useState } from 'preact/hooks'
import { buildNav } from './nav'
import { applyTheme, theme, THEMES } from './theme'

export function Layout({ children }: { children: ComponentChildren }) {
  useSignals()
  const nav = buildNav()
  const { path } = useLocation()
  const [open, setOpen] = useState(false)

  const selectTheme = (next: (typeof THEMES)[number]) => {
    applyTheme(next)
  }

  return (
    <div class="layout">
      <header class="layout-header">
        <button
          class="hamburger"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>
        <a class="layout-logo" href="/">
          <span>cascade</span> ui
        </a>
        <div class="theme-switcher">
          {THEMES.map((t) => (
            <button
              key={t}
              class={`theme-btn ${theme.value === t ? 'active' : ''}`}
              onClick={() => selectTheme(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <div class="layout-body">
        <aside class={`sidebar ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
          <nav>
            {nav.map((group) => (
              <div class="nav-group" key={group.category}>
                <div class="nav-group-label">{group.label}</div>
                {group.items.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    class={`nav-link ${path === item.href ? 'active' : ''}`}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <main class="layout-main">{children}</main>
      </div>
    </div>
  )
}
