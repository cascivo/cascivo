/**
 * Build the shipped docs bundle for @cascivo/docs.
 *
 * cascivo's docs already exist as generated artifacts under `apps/site/public/`
 * (the machine-readable surface: llms.txt, per-component `llms/*.md`, `context/*`,
 * registry + catalogs) and `apps/site/public/docs/` (the adopter-facing guide
 * mirror). This script copies that surface into `packages/docs/content/` so the
 * whole thing publishes to npm as one package — reachable via `npx @cascivo/docs`
 * even when npmjs.com and cascivo.com are blocked/offline (the one channel every
 * adopter provably has: the registry that installed their packages).
 *
 * It does NOT generate docs — `pnpm regen` does. A missing source is a build
 * ERROR (mirrors `packages/mcp/scripts/postbuild.mjs`): shipping a partial bundle
 * would be worse than failing loudly. `content/` is a build artifact (gitignored),
 * regenerated on every build/pack, so it can never lag the sources.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PKG_ROOT = fileURLToPath(new URL('..', import.meta.url))
const REPO_ROOT = join(PKG_ROOT, '..', '..')
const PUBLIC = join(REPO_ROOT, 'apps', 'site', 'public')
const CONTENT = join(PKG_ROOT, 'content')

const die = (msg) => {
  console.error(`build-content: ${msg}`)
  process.exit(1)
}

// Single files copied verbatim from the generated public surface.
const FILES = [
  'llms.txt',
  'llms-full.txt',
  'registry.json',
  'context.json',
  'breaking-changes.json',
  'marketplace.json',
  'tokens.catalog.json',
  'icons.catalog.json',
  'tokens.variants.json',
]
// Directory trees copied recursively.
const DIRS = ['llms', 'context']

rmSync(CONTENT, { recursive: true, force: true })
mkdirSync(CONTENT, { recursive: true })

for (const f of FILES) {
  const src = join(PUBLIC, f)
  if (!existsSync(src)) die(`missing ${src} — run \`pnpm regen\` first`)
  cpSync(src, join(CONTENT, f))
}
for (const d of DIRS) {
  const src = join(PUBLIC, d)
  if (!existsSync(src)) die(`missing ${src}/ — run \`pnpm regen\` first`)
  cpSync(src, join(CONTENT, d), { recursive: true })
}

// The adopter-facing guides live under apps/site/public/docs/<slug>.md; ship them
// as content/guides/<slug>.md so `npx @cascivo/docs guide <slug>` is a stable path.
const guidesSrc = join(PUBLIC, 'docs')
if (!existsSync(guidesSrc)) die(`missing ${guidesSrc}/ — run \`pnpm regen\` first`)
cpSync(guidesSrc, join(CONTENT, 'guides'), { recursive: true })

// versions.json — a snapshot of every published sibling's version at build time,
// so an adopter can verify the docs match their installed set (registry-vs-registry
// freshness, which works even when the docs site is down).
const packagesDir = join(REPO_ROOT, 'packages')
const versions = {}
for (const dir of readdirSync(packagesDir)) {
  const pkgPath = join(packagesDir, dir, 'package.json')
  if (!existsSync(pkgPath)) continue
  let pkg
  try {
    pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  } catch {
    continue
  }
  if (pkg.private === true || !pkg.name) continue
  versions[pkg.name] = pkg.version
}
writeFileSync(
  join(CONTENT, 'versions.json'),
  `${JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), packages: versions }, null, 2)}\n`,
)

const guideCount = readdirSync(join(CONTENT, 'guides')).filter((f) => f.endsWith('.md')).length
const llmsCount = readdirSync(join(CONTENT, 'llms')).length
console.log(
  `build-content: bundled ${FILES.length} files, ${DIRS.length} trees, ${guideCount} guides, ` +
    `${llmsCount} llms entries, ${Object.keys(versions).length} package versions into content/`,
)
