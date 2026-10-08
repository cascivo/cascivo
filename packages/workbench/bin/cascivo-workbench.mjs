#!/usr/bin/env node
/**
 * `npx @cascivo/workbench [dir]` — every copied component's examples, in every theme, with no
 * stories written.
 *
 * Vite is started through its JS API, as `@cascivo/email-preview` does, so the project needs
 * no config file: this package's directory is the Vite root, and the project's components
 * reach the module graph through the virtual modules in `src/plugin.mjs`.
 */
import { existsSync, statSync } from 'node:fs'
import { argv, cwd, exit, stderr, stdout } from 'node:process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const HELP = `cascivo-workbench — browse your cascivo components in a browser

Usage:
  npx @cascivo/workbench [dir] [options]

  dir               Directory to scan (default: src). Every <name>.meta.ts that
                    \`cascivo add\` copied becomes one entry per example, and every
                    *.preview.tsx renders its default export with \`previewProps\`.

Options:
  --style <file>    A stylesheet your app loads (a reset, fonts). Repeatable.
  --port <n>        Port to listen on (default 4191, or the next free one)
  --host [addr]     Listen on a network address, not just localhost
  --open            Open a browser once the server is ready
  -h, --help        Show this message`

function parse(args) {
  const options = { dir: null, styles: [], port: 4191, host: false, open: false }
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '-h' || arg === '--help') return 'help'
    else if (arg === '--open') options.open = true
    else if (arg === '--host') {
      const next = args[i + 1]
      if (next && !next.startsWith('-')) {
        options.host = next
        i += 1
      } else options.host = true
    } else if (arg === '--port') {
      options.port = Number(args[(i += 1)])
      if (!Number.isInteger(options.port)) return { error: '--port needs a number' }
    } else if (arg === '--style') {
      const file = args[(i += 1)]
      if (!file) return { error: '--style needs a file path' }
      options.styles.push(file)
    } else if (arg.startsWith('-')) return { error: `unknown option ${arg}` }
    else if (options.dir === null) options.dir = arg
    else return { error: `unexpected argument ${arg}` }
  }
  return options
}

const parsed = parse(argv.slice(2))
if (parsed === 'help') {
  stdout.write(`${HELP}\n`)
  exit(0)
}
if (parsed.error) {
  stderr.write(`cascivo-workbench: ${parsed.error}\n\n${HELP}\n`)
  exit(2)
}

const dir = resolve(cwd(), parsed.dir ?? 'src')
if (!existsSync(dir) || !statSync(dir).isDirectory()) {
  stderr.write(`cascivo-workbench: no such directory: ${parsed.dir ?? 'src'}\n`)
  exit(1)
}
const styles = parsed.styles.map((file) => resolve(cwd(), file))
for (const file of styles) {
  if (!existsSync(file)) {
    stderr.write(`cascivo-workbench: no such file: ${file}\n`)
    exit(1)
  }
}

const { createServer } = await import('vite')
const { cascivoWorkbench, scan } = await import('../src/plugin.mjs')

const server = await createServer({
  configFile: false,
  root: PKG_ROOT,
  server: {
    port: parsed.port,
    strictPort: false,
    host: parsed.host,
    open: parsed.open,
    // The components live outside this package's root.
    fs: { allow: [PKG_ROOT, dir, cwd()] },
  },
  plugins: [cascivoWorkbench({ dir, styles })],
  resolve: {
    // The components import react from the project and the UI imports it from here; two
    // copies of React is a blank screen, so both are pinned to one.
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: { include: ['react', 'react-dom/client'] },
})

await server.listen()
const url = server.resolvedUrls?.local?.[0] ?? `http://localhost:${parsed.port}/`
const { metas, previews } = scan(dir)
stdout.write(
  `\n  cascivo workbench  ${url}\n` +
    `  scanning           ${dir}\n` +
    `  entries            ${metas.length} component(s), ${previews.length} preview(s)\n\n`,
)
if (metas.length === 0 && previews.length === 0) {
  stdout.write(
    '  Nothing to show yet: add a component with `npx cascivo add <name>`, or write a\n' +
      '  *.preview.tsx file. Pass the directory to scan if it is not src.\n\n',
  )
}
