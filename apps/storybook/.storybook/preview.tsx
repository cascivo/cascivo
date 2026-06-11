import type { Preview, Renderer } from '@storybook/react-vite'
import { withThemeByDataAttribute } from '@storybook/addon-themes'
import '@cascade-ui/themes/light'
import '@cascade-ui/themes/dark'
import '@cascade-ui/themes/warm'
import '@cascade-ui/themes/flat'
import '@cascade-ui/themes/minimal'

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
  ],
  parameters: {
    layout: 'centered',
  },
}

export default preview
