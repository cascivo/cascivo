import React from 'react'
import type { Decorator, Preview, Renderer } from '@storybook/react-vite'
import { withThemeByDataAttribute } from '@storybook/addon-themes'
import { SCREEN } from '../../../packages/tokens/src/screens.ts'
import { withContextPrompt } from './context-prompt.tsx'
import '@cascivo/themes/light'
import '@cascivo/themes/dark'
import '@cascivo/themes/warm'
import '@cascivo/themes/flat'
import '@cascivo/themes/minimal'
import '@cascivo/themes/midnight'
import '@cascivo/themes/pastel'
import '@cascivo/themes/brutalist'
import '@cascivo/themes/corporate'
import '@cascivo/themes/terminal'
import '@cascivo/themes/cyberpunk'
import '@cascivo/themes/arcade'

const withFrame: Decorator = (Story, context) => {
  if (context.parameters['layout'] === 'fullscreen') return <Story />
  return (
    <div style={{ inlineSize: 'min(26rem, 90vw)' }}>
      <Story />
    </div>
  )
}

const preview: Preview = {
  initialGlobals: {
    viewport: { value: 'sm' },
  },
  decorators: [
    withThemeByDataAttribute<Renderer>({
      themes: {
        light: 'light',
        dark: 'dark',
        warm: 'warm',
        flat: 'flat',
        minimal: 'minimal',
        midnight: 'midnight',
        pastel: 'pastel',
        brutalist: 'brutalist',
        corporate: 'corporate',
        terminal: 'terminal',
        cyberpunk: 'cyberpunk',
        arcade: 'arcade',
      },
      defaultTheme: 'light',
      attributeName: 'data-theme',
      parentSelector: 'html',
    }),
    withFrame,
    withContextPrompt,
  ],
  parameters: {
    layout: 'centered',
    viewport: {
      options: {
        xs: {
          name: 'XS (320px)',
          styles: { width: '320px', height: '812px' },
        },
        sm: {
          name: `SM (${SCREEN.sm.px}px)`,
          styles: { width: `${SCREEN.sm.px}px`, height: '812px' },
        },
        md: {
          name: `MD (${SCREEN.md.px}px)`,
          styles: { width: `${SCREEN.md.px}px`, height: '1024px' },
        },
        lg: {
          name: `LG (${SCREEN.lg.px}px)`,
          styles: { width: `${SCREEN.lg.px}px`, height: '768px' },
        },
      },
    },
  },
}

export default preview
