// Rewrites starters/<name>/ from the built CLI, and the example-app starters from
// apps/examples/. Run after `vp run cascivo#build`.
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { buildExampleStarter, EXAMPLE_STARTERS } from './examples.ts'
import { CLI, STARTERS, STARTERS_DIR, scaffoldStarter } from './starters.ts'

if (!existsSync(CLI)) {
  throw new Error(`Built CLI not found at ${CLI}. Run \`vp run cascivo#build\` first.`)
}

function write(name: string, files: Map<string, string>): void {
  const target = join(STARTERS_DIR, name)
  rmSync(target, { recursive: true, force: true })
  for (const [path, contents] of files) {
    const file = join(target, path)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, contents)
  }
  console.log(`starters: wrote starters/${name}`)
}

for (const starter of STARTERS) write(starter.name, scaffoldStarter(starter))
for (const starter of EXAMPLE_STARTERS) write(starter.name, buildExampleStarter(starter))
