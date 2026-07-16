import { renderToString } from 'react-dom/server'
import { App } from './App'

/**
 * Server render entry. The smoke test (test/ssr-smoke.mjs) imports the built
 * SSR bundle and calls this — if the `.css` side-effect imports inside the
 * @cascivo/react dist were not processed (no `ssr.noExternal`), the mere import
 * of this bundle throws `Unknown file extension ".css"` before render runs.
 */
export function render(): string {
  return renderToString(<App />)
}
