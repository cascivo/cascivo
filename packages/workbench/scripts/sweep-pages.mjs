#!/usr/bin/env node
/**
 * Every registry block, as the page `cascivo create --from` makes of it, through the
 * workbench's axe sweep. Block manifests carry no examples, so the component sweep never
 * renders a block; this renders each one the way an adopter receives it: copied by its
 * recipe, imports rewritten, inside a generated app whose blueprint lists it as a page.
 *
 * The app is written to `.pages/` here, so it resolves `@cascivo/*` from this package's own
 * dev dependencies. Extra arguments go to `cascivo-workbench test` (`--themes all`).
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { argv, execPath, exit } from 'node:process'
import { fileURLToPath } from 'node:url'

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..')
const CLI = join(PKG, '..', 'cli')
const OUT = join(PKG, '.pages')

const blocks = readdirSync(join(CLI, 'recipes'))
  .filter((dir) => dir.startsWith('block-'))
  .map((dir) => dir.slice('block-'.length))
  .sort()

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT)
const blueprint = join(OUT, 'cascivo.app.json')
writeFileSync(
  blueprint,
  JSON.stringify({
    name: 'app',
    framework: 'react-vite',
    pages: blocks.map((block) => ({ title: block, block })),
  }),
)

const run = (args, cwd) => spawnSync(execPath, args, { cwd, stdio: 'inherit' }).status ?? 1
const created = run(
  [join(CLI, 'bin', 'cascivo.mjs'), 'create', 'app', '--from', blueprint, '--yes'],
  OUT,
)
if (created !== 0) exit(created)

exit(
  run(
    [
      join(PKG, 'bin', 'cascivo-workbench.mjs'),
      'test',
      join(OUT, 'app', 'src'),
      '--project',
      PKG,
      ...argv.slice(2),
    ],
    PKG,
  ),
)
