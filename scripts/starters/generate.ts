// Rewrites starters/<name>/ from the built CLI. Run after `vp run cascivo#build`.
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { CLI, STARTERS, STARTERS_DIR, scaffoldStarter } from './starters.ts'

if (!existsSync(CLI)) {
  throw new Error(`Built CLI not found at ${CLI}. Run \`vp run cascivo#build\` first.`)
}

for (const starter of STARTERS) {
  const target = join(STARTERS_DIR, starter.name)
  rmSync(target, { recursive: true, force: true })
  for (const [path, contents] of scaffoldStarter(starter)) {
    const file = join(target, path)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, contents)
  }
  console.log(`starters: wrote starters/${starter.name}`)
}
