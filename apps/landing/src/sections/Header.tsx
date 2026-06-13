'use client'
import { useSignals } from '@cascivo/core'
import { ShellHeader } from '@cascivo/components/shell-header'
import { THEMES, setTheme, theme } from '../theme'

const path = typeof window !== 'undefined' ? window.location.pathname : '/'

export function Header() {
  useSignals()
  return (
    <ShellHeader
      brand={{ name: 'cascivo', href: '/' }}
      nav={[
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
      ]}
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
  )
}
