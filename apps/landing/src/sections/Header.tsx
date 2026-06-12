'use client'
import { useSignals } from '@cascade-ui/core'
import { ShellHeader } from '@cascade-ui/components/shell-header'
import { THEMES, setTheme, theme } from '../theme'

const path = typeof window !== 'undefined' ? window.location.pathname : '/'

export function Header() {
  useSignals()
  return (
    <ShellHeader
      brand={{ name: 'cascade', href: '/' }}
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
        { label: 'GitHub', href: 'https://github.com/urbanisierung/cascade-ui' },
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
