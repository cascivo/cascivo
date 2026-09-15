#!/usr/bin/env node
/**
 * `npx @cascivo/email-preview [dir]` — the edit / look / edit loop, outside this repo.
 *
 * The recipe used to document `pnpm --filter @cascivo/email-preview dev`, which is a
 * workspace filter: it resolves only inside the cascivo monorepo, so the documented command
 * worked if and only if you were cascivo. Everyone else got "No projects matched the
 * filters" and wrote their own preview server.
 *
 * Vite is started through its JS API rather than shelled out to, so the adopter needs no
 * config file of their own: this package's own directory is the Vite root, their templates
 * reach the module graph through a virtual module, and their `.tsx` is compiled by the same
 * pipeline that compiles ours.
 */
import { existsSync, statSync } from 'node:fs'
import { argv, cwd, env, exit, stderr, stdout } from 'node:process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const HELP = `cascivo-email-preview — preview cascivo email templates in a browser

Usage:
  npx @cascivo/email-preview [dir] [options]

  dir                 Directory of templates. Every .tsx/.jsx file in it is a template:
                      its default export is rendered, and the optional named exports
                      \`subject\` (string) and \`previewProps\` (object) are used if present.
                      Omit it to browse the templates that ship with @cascivo/email.

Options:
  --port <n>          Port to listen on (default 4190, or the next free one)
  --host [addr]       Listen on a network address, not just localhost
  --open              Open a browser once the server is ready
  --caniemail <file>  Can I email matrix for the conformance panel, as downloaded from
                      https://www.caniemail.com/api/data.json. Without it the panel
                      explains where to get one; everything else works.
  -h, --help          Show this message

What you get: every shipped theme, a viewport switcher, per-client simulation, the
encoded-byte gauge with Gmail's clip thresholds drawn on it, the same conformance findings
CI reports, and an .eml download.`

function parse(args) {
  const options = { dir: null, port: 4190, host: false, open: false, caniemail: null }
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
    } else if (arg === '--caniemail') {
      options.caniemail = args[(i += 1)]
      if (!options.caniemail) return { error: '--caniemail needs a file path' }
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
  stderr.write(`cascivo-email-preview: ${parsed.error}\n\n${HELP}\n`)
  exit(2)
}

if (parsed.dir !== null) {
  const dir = resolve(cwd(), parsed.dir)
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    stderr.write(`cascivo-email-preview: no such directory: ${parsed.dir}\n`)
    exit(1)
  }
  parsed.dir = dir
}

if (parsed.caniemail !== null) {
  const file = resolve(cwd(), parsed.caniemail)
  if (!existsSync(file)) {
    stderr.write(`cascivo-email-preview: no such file: ${parsed.caniemail}\n`)
    exit(1)
  }
  parsed.caniemail = file
}

// The matrix that ships beside this package, when one does. In the monorepo the build step
// copies it here; a published tarball carries it; either way it beats asking for a flag.
const bundled = resolve(PKG_ROOT, 'vendor/caniemail.json')
if (parsed.caniemail === null && existsSync(bundled)) parsed.caniemail = bundled

const { createServer } = await import('vite')
const { cascivoEmailPreview } = await import('../src/plugin.mjs')

const server = await createServer({
  configFile: false,
  root: PKG_ROOT,
  server: {
    port: parsed.port,
    // `strictPort: false` so a second preview alongside a running one takes the next port
    // instead of refusing to start.
    strictPort: false,
    host: parsed.host,
    open: parsed.open,
    // Templates live outside this package's root, so Vite's file-serving allowlist has to
    // be widened to reach them. One object, because a second `server` key in this literal
    // would replace this one wholesale rather than merge with it.
    fs: { allow: parsed.dir ? [PKG_ROOT, parsed.dir, cwd()] : [PKG_ROOT] },
  },
  plugins: [cascivoEmailPreview({ dir: parsed.dir, caniemail: parsed.caniemail })],
  resolve: {
    // The adopter's templates import react and @cascivo/email from their own node_modules
    // while the UI imports them from ours. Two copies of React is a blank screen and a
    // hook-order error, so both halves are pinned to one.
    dedupe: ['react', 'react-dom', '@cascivo/email'],
  },
  optimizeDeps: { include: ['react', 'react-dom/client'] },
})

await server.listen()
const url = server.resolvedUrls?.local?.[0] ?? `http://localhost:${parsed.port}/`
stdout.write(
  `\n  cascivo email preview  ${url}\n` +
    `  templates              ${parsed.dir ?? 'built-in (@cascivo/email)'}\n` +
    `  conformance matrix     ${parsed.caniemail ? 'loaded' : 'not supplied — see --help'}\n\n`,
)
if (env.CASCIVO_PREVIEW_EXIT === '1') await server.close()
