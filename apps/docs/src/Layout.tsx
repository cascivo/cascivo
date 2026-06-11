import type { ComponentChildren } from 'preact'
import { useSignal, useSignals } from '@cascade-ui/core'
import { useLocation } from 'preact-iso'
import { useState } from 'preact/hooks'
import { buildNav } from './nav'
import { DocsSearch } from './search'
import { applyTheme, theme, THEMES } from './theme'
import { persistedSignal } from '@cascade-ui/storage'

// Persisted sidebar collapse state — initialized once at module level.
const sidebarCollapsed = persistedSignal('cascade.docs.sidebar.collapsed', false)

export function Layout({ children }: { children: ComponentChildren }) {
  useSignals()
  const nav = buildNav()
  const { path } = useLocation()
  const [open, setOpen] = useState(false)
  // Local signal proxy so this component re-renders on collapse change.
  const collapsed = useSignal(sidebarCollapsed.value)
  collapsed.value = sidebarCollapsed.value

  const toggleCollapse = (e: MouseEvent) => {
    e.stopPropagation()
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

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
        <DocsSearch />
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

      <div class="layout-body" data-sidebar-collapsed={collapsed.value || undefined}>
        <aside
          class={`sidebar ${open ? 'open' : ''} ${collapsed.value ? 'collapsed' : ''}`}
          onClick={() => setOpen(false)}
        >
          <nav>
            <div class="nav-group">
              <div class="nav-group-label">Explore</div>
              <a href="/ai" class={`nav-link ${path === '/ai' ? 'active' : ''}`}>
                AI / MCP
              </a>
              <a href="/charts" class={`nav-link ${path === '/charts' ? 'active' : ''}`}>
                Charts
              </a>
            </div>
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
          <button
            type="button"
            class="sidebar-toggle"
            aria-label={collapsed.value ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={toggleCollapse}
          >
            {collapsed.value ? '›' : '‹'}
          </button>
        </aside>

        <main class="layout-main">{children}</main>
      </div>
    </div>
  )
}
