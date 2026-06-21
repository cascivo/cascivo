import { addons } from 'storybook/manager-api'
import { create } from 'storybook/theming/create'

// Brand the Storybook manager chrome (sidebar logo, accent colors, title) so the
// public Storybook at storybook.cascivo.com matches the cascivo identity instead
// of the generic default. Assets are served from ../public via staticDirs.
const theme = create({
  base: 'light',
  brandTitle: 'cascivo design system',
  brandUrl: 'https://cascivo.com',
  brandImage: '/brand.svg',
  brandTarget: '_blank',
  colorPrimary: '#0079bf',
  colorSecondary: '#0079bf',
})

addons.setConfig({ theme })
