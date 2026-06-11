import React from 'react'
import type { Decorator, Preview, Renderer } from '@storybook/react-vite'
import { withThemeByDataAttribute } from '@storybook/addon-themes'
import '@cascade-ui/themes/light'
import '@cascade-ui/themes/dark'
import '@cascade-ui/themes/warm'
import '@cascade-ui/themes/flat'
import '@cascade-ui/themes/minimal'

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
