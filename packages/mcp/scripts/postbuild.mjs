/**
 * Post-build for @cascivo/mcp: make the published package self-contained.
 *
 * `npx -y @cascivo/mcp` runs with no repo checkout and possibly no network,
 * so every data file a tool depends on is bundled next to the built server
 * (the loaders in src/ probe `join(HERE, '<file>')` before falling back to
 * the network). Missing bundle files are a build error, not a silent skip —
 * shipping without them regresses tools to network-only (or, for templates,
 * to an empty catalog).
 */
import { chmodSync, copyFileSync, cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const REPO_ROOT = join(PKG_ROOT, '..', '..')
const DIST = join(PKG_ROOT, 'dist')

// Keep the CLI shebang.
const entry = join(DIST, 'index.mjs')
const content = readFileSync(entry, 'utf8')
if (!content.startsWith('#!/')) {
  writeFileSync(entry, `#!/usr/bin/env node\n${content}`)
}
chmodSync(entry, 0o755)

const DATA_FILES = [
  ['registry.json', join(REPO_ROOT, 'registry.json')],
  ['tokens.catalog.json', join(REPO_ROOT, 'apps', 'site', 'public', 'tokens.catalog.json')],
  ['tokens.variants.json', join(REPO_ROOT, 'apps', 'site', 'public', 'tokens.variants.json')],
  ['context.json', join(REPO_ROOT, 'apps', 'site', 'public', 'context.json')],
  ['marketplace.json', join(REPO_ROOT, 'apps', 'site', 'public', 'marketplace.json')],
]

for (const [name, src] of DATA_FILES) {
  if (!existsSync(src)) {
    console.error(`postbuild: missing ${src} — run \`pnpm regen\` first`)
    process.exit(1)
  }
  copyFileSync(src, join(DIST, name))
}

const contextDir = join(REPO_ROOT, 'apps', 'site', 'public', 'context')
if (!existsSync(contextDir)) {
  console.error(`postbuild: missing ${contextDir} — run \`pnpm regen\` first`)
  process.exit(1)
}
cpSync(contextDir, join(DIST, 'context'), { recursive: true })

console.log(`Bundled ${DATA_FILES.length} data files + context/ into dist/`)
