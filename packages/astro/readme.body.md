The Astro integration for cascivo. One line in `astro.config` sets up the CSS layer
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
  (`DEFAULT_LAYERS`). Pass `layers` with a complete `@layer …;` statement to add your own slots
  (a layer takes its position from its first appearance, so it must name every layer the page uses).
- Imports the theme stylesheet on every page (`theme`, default
  `@cascivo/themes/light-dark.css`; `false` to import it yourself).
- Inlines the no-flash theme script in `<head>` and re-applies it after every
  `<ClientRouter />` swap (`themeScript`; `false` to opt out). `themeScript` takes
  `{ storageKey?, attribute?, defaultTheme? }`; an app on one custom theme sets `theme` and
  `themeScript.defaultTheme` together.
- Keeps `@cascivo/*` packages in the Vite graph (`vite.resolve.noExternal`), so server-rendered
  islands keep their CSS on `@cascivo/react` releases that predate the `astro-component` keyword.

## Two rules for islands

- Compose compound components (`Tabs`, `Accordion`, `Popover`) in one `.tsx` file and hydrate that
  island. Astro renders `.astro` children separately, so React context never reaches them.
- Never put a `client:*` directive on a `@cascivo/react` export imported straight into an `.astro`
  file: it measured 326 KB of JS and 331 KB of CSS.

`npx cascivo create my-app --framework astro` emits an app with all of this wired. The adopter path
is verified by the Astro arm of `pnpm framework:check`.

Full guide: [docs/USING-WITH-ASTRO.md](https://github.com/cascivo/cascivo/blob/main/docs/USING-WITH-ASTRO.md).
