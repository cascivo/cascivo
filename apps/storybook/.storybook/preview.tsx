import React from 'react'
import type { Decorator, Preview } from '@storybook/react-vite'
import '@cascade-ui/themes/light'
import '@cascade-ui/themes/dark'
import '@cascade-ui/themes/warm'
import '@cascade-ui/themes/flat'
import '@cascade-ui/themes/minimal'

const THEMES = ['light', 'dark', 'warm', 'flat', 'minimal'] as const

const frame: React.CSSProperties = {
  padding: '1.5rem',
  backgroundColor: 'var(--cascade-color-bg)',
  color: 'var(--cascade-color-text)',
  fontFamily: 'var(--cascade-font-sans)',
}

/** Wraps every story in a `[data-theme]` container; "side-by-side" renders all three. */
const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as string | undefined) ?? 'light'

  if (theme === 'side-by-side') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {THEMES.map((t) => (
          <div key={t} data-theme={t} style={frame}>
            <div style={{ marginBlockEnd: '0.75rem', fontSize: '0.75rem', opacity: 0.6 }}>{t}</div>
            <Story />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div data-theme={theme} style={{ ...frame, minHeight: '100vh' }}>
      <Story />
    </div>
  )
}

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: 'cascade theme',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: ['light', 'dark', 'warm', 'flat', 'minimal', 'side-by-side'],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  parameters: {
    layout: 'fullscreen',
  },
}

export default preview
