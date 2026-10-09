/**
 * Start the workbench's Vite server, for the browser UI and for `test` alike.
 *
 * Through Vite's JS API, as `@cascivo/email-preview` does, so the project needs no config file:
 * this package's directory is the Vite root, and the project's components reach the module
 * graph through the virtual modules in `plugin.mjs`.
 */
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { cascivoWorkbench } from './plugin.mjs'

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * @param {{ dir: string, project: string, styles?: string[], port?: number, host?: string | boolean, open?: boolean, quiet?: boolean }} options
 */
export async function startServer({
  dir,
  project,
  styles = [],
  port = 4191,
  host = false,
  open = false,
  quiet = false,
}) {
  const server = await createServer({
    configFile: false,
    root: PKG_ROOT,
    ...(quiet ? { logLevel: 'warn' } : {}),
    server: {
      port,
      strictPort: false,
      host,
      open,
      // The components live outside this package's root.
      fs: { allow: [PKG_ROOT, dir, project] },
      // A test opens every entry, and the ones that need host code throw on purpose: their
      // stack traces in the terminal would bury the result.
      ...(quiet ? { forwardConsole: false } : {}),
    },
    plugins: [cascivoWorkbench({ dir, styles, project })],
    resolve: {
      // The components import react from the project and the UI imports it from here; two
      // copies of React is a blank screen, so both are pinned to one.
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: { include: ['react', 'react-dom/client'] },
  })
  await server.listen()
  return server
}
