The Astro integration for cascivo. One line in `astro.config` sets up the cascade-layer
order, the theme stylesheet and a no-flash theme script on every page.

## Usage

```sh
npx astro add @cascivo/astro
```

or add it by hand:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import cascivo from '@cascivo/astro'

export default defineConfig({
  integrations: [
    react(),
    cascivo({ theme: '@cascivo/themes/midnight.css', themeScript: { defaultTheme: 'midnight' } }),
  ],
})
```

## What it does

- Injects the layer order first on every page: `vendor`, then cascivo's canonical layers
  (`DEFAULT_LAYERS`). Pass `layers` with a complete `@layer …;` statement to add your own slots.
- Imports the theme stylesheet on every page (`theme`, default
  `@cascivo/themes/light-dark.css`; `false` to import it yourself).
- Inlines the no-flash theme script in `<head>` and re-applies it after every
  `<ClientRouter />` swap (`themeScript`; `false` to opt out).
- Keeps `@cascivo/*` packages in the Vite graph (`vite.resolve.noExternal`), so server-rendered
  islands keep their CSS.

Full guide: [docs/USING-WITH-ASTRO.md](https://github.com/cascivo/cascivo/blob/main/docs/USING-WITH-ASTRO.md).
