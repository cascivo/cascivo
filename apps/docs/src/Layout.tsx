import type { ComponentChildren } from 'preact'
import { useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { buildNav } from './nav'
import { applyTheme, THEMES, type Theme } from './theme'

export function Layout({ children, theme }: { children: ComponentChildren; theme: Theme }) {
  const nav = buildNav()
  const { path } = useLocation()
  const [current, setCurrent] = useState<Theme>(theme)
  const [open, setOpen] = useState(false)

  const selectTheme = (next: Theme) => {
    applyTheme(next)
    setCurrent(next)
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
              class={`theme-btn ${current === t ? 'active' : ''}`}
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
