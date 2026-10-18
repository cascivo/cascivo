import type { AstroIntegration } from 'astro'
// `/pure`, never the root entry: this runs in Astro's config process, and the root entry
// loads the React runtime and the signals runtime at module scope.
import { themePreloadScript } from '@cascivo/core/pure'

/** Inlined at build time from `packages/tokens/src/layers.css` (see vite.config.ts). */
declare const __CASCIVO_DEFAULT_LAYERS__: string

export interface CascivoAstroOptions {
  /** Full `@layer …;` order statement injected first on every page. Default: DEFAULT_LAYERS. */
  layers?: string
  /** Theme stylesheet injected on every page. `false` to import it yourself. Default '@cascivo/themes/light-dark.css'. */
  theme?: string | false
  /** Inline no-flash theme script. `false` to opt out. Defaults mirror ThemeProvider. */
  themeScript?: false | { storageKey?: string; attribute?: string; defaultTheme?: string }
}

/**
 * `@layer vendor, ` + the names of the canonical statement in `@cascivo/tokens/layers.css`.
 *
 * A whole statement, not the tokens file: a layer takes its position from its first
 * appearance, so if the canonical statement (which has no `vendor`) ran first, an app's later
 * `@layer vendor, …` would append `vendor` ABOVE every cascivo layer and third-party CSS would
 * win. An app with its own layer names passes the complete statement through `layers`.
 */
export const DEFAULT_LAYERS: string = __CASCIVO_DEFAULT_LAYERS__

const VIRTUAL_LAYERS = 'virtual:cascivo/layers.css'
const RESOLVED_LAYERS = `\0${VIRTUAL_LAYERS}`

/**
 * Astro integration: the cascade-layer order, a theme stylesheet and a no-flash theme
 * script on every page, so `astro.config` is the only file an adopter edits.
 */
export default function cascivo(options: CascivoAstroOptions = {}): AstroIntegration {
  const layers = options.layers ?? DEFAULT_LAYERS
  const theme = options.theme ?? '@cascivo/themes/light-dark.css'
  const themeScript = options.themeScript ?? {}

  return {
    name: '@cascivo/astro',
    hooks: {
      'astro:config:setup'({ updateConfig, injectScript }) {
        // Vite externalizes node_modules packages in the server build, and Astro collects a
        // page's CSS by walking the module graph, so an externalized @cascivo/react renders
        // islands unstyled. `@cascivo/react` releases that carry the `astro-component`
        // keyword are inlined anyway; this covers the ones before it. It must be `resolve.`,
        // not `ssr.`: Astro prerenders in its own Vite environment, which `ssr.*` misses.
        updateConfig({ vite: { resolve: { noExternal: [/^@cascivo\//] } } })

        // The order statement as a module of its own, so it is the first CSS on the page:
        // a statement that lands after any cascivo stylesheet cannot reorder anything.
        updateConfig({
          vite: {
            plugins: [
              {
                name: 'cascivo:layers',
                resolveId(id: string) {
                  return id === VIRTUAL_LAYERS ? RESOLVED_LAYERS : undefined
                },
                load(id: string) {
                  return id === RESOLVED_LAYERS ? layers : undefined
                },
              },
            ],
          },
        })
        injectScript(
          'page-ssr',
          `import ${JSON.stringify(VIRTUAL_LAYERS)};` +
            (theme === false ? '' : `import ${JSON.stringify(theme)};`),
        )

        // `head-inline` runs before first paint and is NOT re-executed by <ClientRouter>, so
        // its listener is added once. The listener matters: a soft navigation copies the
        // incoming page's server-rendered <html data-theme> over the persisted choice.
        if (themeScript !== false) {
          injectScript(
            'head-inline',
            themePreloadScript({ ...themeScript, reapplyOn: 'astro:after-swap' }),
          )
        }
      },
    },
  }
}
