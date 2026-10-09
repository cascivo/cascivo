#!/usr/bin/env node
/**
 * `npx @cascivo/workbench [dir]` — every copied component's examples, in every theme, with no
 * stories written. `npx @cascivo/workbench test [dir]` checks each of them with axe.
 */
import { existsSync, statSync } from 'node:fs'
import { argv, cwd, exit, stderr, stdout } from 'node:process'
import { resolve } from 'node:path'

const HELP = `cascivo-workbench — browse and test your cascivo components

Usage:
  npx @cascivo/workbench [dir] [options]        browse, in a browser
  npx @cascivo/workbench test [dir] [options]   check every entry with axe

  dir               Directory to scan (default: src). Every <name>.meta.ts that
                    \`cascivo add\` copied becomes one entry per example, and every
                    *.preview.tsx renders its default export with \`previewProps\`.
                    An app made by \`cascivo create\` adds each page of its
                    cascivo.app.json that renders a block.

Options:
  --style <file>    A stylesheet your app loads (a reset, fonts). Repeatable.
  --project <dir>   Where tokens, themes, Playwright and axe-core are installed
                    (default: the current directory)
  --port <n>        Port to listen on (default 4191, or the next free one)
  --host [addr]     Listen on a network address, not just localhost
  --open            Open a browser once the server is ready
  -h, --help        Show this message

Test options (need playwright and axe-core in the project):
  --themes <list>   Comma-separated themes, or "all" (default: light,dark)
  --only <text>     Only the entries whose id contains <text>
  --screenshots <dir>
                    Also compare each entry's picture with <dir>/<entry>--<theme>.png,
                    writing the ones that are missing; a difference fails and leaves
                    <name>.actual.png beside the baseline
  --update          Rewrite every screenshot instead of comparing
  --json            Print the result as JSON`

const ALL_THEMES = [
  'light',
  'dark',
  'warm',
  'flat',
  'minimal',
  'midnight',
  'pastel',
  'brutalist',
  'corporate',
  'terminal',
  'cyberpunk',
  'arcade',
]

function parse(args) {
  const options = {
    command: 'dev',
    dir: null,
    styles: [],
    project: null,
    port: 4191,
    host: false,
    open: false,
    themes: ['light', 'dark'],
    only: null,
    screenshots: null,
    update: false,
    json: false,
  }
  const value = (i, flag) => {
    const next = args[i + 1]
    if (!next || next.startsWith('-')) throw new Error(`${flag} needs a value`)
    return next
  }
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '-h' || arg === '--help') return 'help'
    else if (i === 0 && arg === 'test') options.command = 'test'
    else if (arg === '--open') options.open = true
    else if (arg === '--update') options.update = true
    else if (arg === '--json') options.json = true
    else if (arg === '--host') {
      const next = args[i + 1]
      if (next && !next.startsWith('-')) {
        options.host = next
        i += 1
      } else options.host = true
    } else if (arg === '--port') {
      options.port = Number(value(i, arg))
      i += 1
      if (!Number.isInteger(options.port)) throw new Error('--port needs a number')
    } else if (arg === '--style') {
      options.styles.push(value(i, arg))
      i += 1
    } else if (arg === '--project') {
      options.project = value(i, arg)
      i += 1
    } else if (arg === '--themes') {
      const list = value(i, arg)
      i += 1
      options.themes = list === 'all' ? ALL_THEMES : list.split(',').map((t) => t.trim())
      const unknown = options.themes.filter((t) => !ALL_THEMES.includes(t))
      if (unknown.length > 0) throw new Error(`unknown theme ${unknown.join(', ')}`)
    } else if (arg === '--only') {
      options.only = value(i, arg)
      i += 1
    } else if (arg === '--screenshots') {
      options.screenshots = value(i, arg)
      i += 1
    } else if (arg.startsWith('-')) throw new Error(`unknown option ${arg}`)
    else if (options.dir === null) options.dir = arg
    else throw new Error(`unexpected argument ${arg}`)
  }
  return options
}

let parsed
try {
  parsed = parse(argv.slice(2))
} catch (e) {
  stderr.write(`cascivo-workbench: ${e.message}\n\n${HELP}\n`)
  exit(2)
}
if (parsed === 'help') {
  stdout.write(`${HELP}\n`)
  exit(0)
}

const dir = resolve(cwd(), parsed.dir ?? 'src')
if (!existsSync(dir) || !statSync(dir).isDirectory()) {
  stderr.write(`cascivo-workbench: no such directory: ${parsed.dir ?? 'src'}\n`)
  exit(1)
}
const project = resolve(cwd(), parsed.project ?? '.')
const styles = parsed.styles.map((file) => resolve(cwd(), file))
for (const file of styles) {
  if (!existsSync(file)) {
    stderr.write(`cascivo-workbench: no such file: ${file}\n`)
    exit(1)
  }
}

const { startServer } = await import('../src/server.mjs')
const { blueprintPages, findBlueprint, scan } = await import('../src/plugin.mjs')
const testing = parsed.command === 'test'
const server = await startServer({
  dir,
  project,
  styles,
  port: parsed.port,
  host: parsed.host,
  open: !testing && parsed.open,
  quiet: testing,
})
const url = server.resolvedUrls?.local?.[0] ?? `http://localhost:${parsed.port}/`

if (!testing) {
  const { metas, previews } = scan(dir)
  const pages = blueprintPages(findBlueprint(dir, project))
  stdout.write(
    `\n  cascivo workbench  ${url}\n` +
      `  scanning           ${dir}\n` +
      `  entries            ${metas.length} component(s), ${previews.length} preview(s), ` +
      `${pages.length} app page(s)\n\n`,
  )
  if (metas.length === 0 && previews.length === 0 && pages.length === 0) {
    stdout.write(
      '  Nothing to show yet: add a component with `npx cascivo add <name>`, or write a\n' +
        '  *.preview.tsx file. Pass the directory to scan if it is not src.\n\n',
    )
  }
} else {
  const { runTests } = await import('../src/test-runner.mjs')
  let result
  try {
    result = await runTests({
      baseUrl: url,
      from: [project, dir],
      themes: parsed.themes,
      only: parsed.only,
      screenshots: parsed.screenshots ? resolve(cwd(), parsed.screenshots) : null,
      update: parsed.update,
      log: parsed.json ? () => {} : (line) => stdout.write(`${line}\n`),
    })
  } catch (e) {
    stderr.write(`cascivo-workbench: ${e instanceof Error ? e.message : String(e)}\n`)
    await server.close()
    exit(1)
  }
  await server.close()
  if (parsed.json) stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  else {
    stdout.write(
      `\n${result.checked} checked, ${result.failures.length} failure(s), ` +
        `${result.skipped.length} entr${result.skipped.length === 1 ? 'y' : 'ies'} skipped ` +
        `(they need code from your app — write a *.preview.tsx for those).\n`,
    )
    for (const f of result.failures) stdout.write(`  ✗ ${f.entry} [${f.theme}] ${f.problem}\n`)
  }
  exit(result.failures.length > 0 ? 1 : 0)
}
