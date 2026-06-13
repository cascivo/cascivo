import React from 'react'
import type { Decorator, Preview, Renderer } from '@storybook/react-vite'
import { withThemeByDataAttribute } from '@storybook/addon-themes'
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

const withFrame: Decorator = (Story, context) => {
  if (context.parameters['layout'] === 'fullscreen') return <Story />
  return (
    <div style={{ inlineSize: 'min(26rem, 90vw)' }}>
      <Story />
    </div>
  )
}

const preview: Preview = {
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
      },
      defaultTheme: 'light',
      attributeName: 'data-theme',
      parentSelector: 'html',
    }),
    withFrame,
  ],
  parameters: {
    layout: 'centered',
  },
}

export default preview
