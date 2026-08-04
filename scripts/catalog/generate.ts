/**
 * Token catalog generator.
 *
 * Reads the token sources, parses all --cascivo-* custom properties, and
 * writes apps/site/public/tokens.catalog.json.
 *
 * Run with: `pnpm catalog:generate`
 */
import { readdirSync, statSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { registryGeneratedAt } from '../registry/generated-at.ts'
import { parseComponentHooks, parseTokens } from './parse-tokens.ts'

/** Shipped stylesheets that may define a per-component author hook. */
const COMPONENT_CSS_ROOTS = [
  'packages/components/src',
  'packages/layouts/src',
  'packages/charts/src',
  'packages/flow/src',
  'packages/editor/src',
]

function cssFiles(dir: string): string[] {
  const out: string[] = []
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'dist') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...cssFiles(full))
    else if (entry.endsWith('.css')) out.push(full)
  }
  return out
}

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')

async function main() {
  const indexCss = await readFile(join(ROOT, 'packages/tokens/src/index.css'), 'utf8')
  const lightCss = await readFile(join(ROOT, 'packages/themes/src/light.css'), 'utf8')
  const base = parseTokens(indexCss, lightCss)

  // Per-component author hooks live in component stylesheets, not the token sources, so a
  // catalog built from those two files alone silently omitted every per-component knob.
  const paths = COMPONENT_CSS_ROOTS.flatMap((r) => cssFiles(join(ROOT, r)))
  const sources = await Promise.all(
    paths.map(async (path) => ({ path, source: await readFile(path, 'utf8') })),
  )
  const hooks = parseComponentHooks(sources, new Set(base.map((t) => t.name)))
  const tokens = [...base, ...hooks]

  const catalog = {
    generatedFrom: [
      'packages/tokens/src/index.css',
      'packages/themes/src/light.css',
      ...COMPONENT_CSS_ROOTS.map((r) => `${r}/**/*.css (per-component author hooks)`),
    ],
    resolutionTheme: 'light',
    generatedAt: registryGeneratedAt(),
    count: tokens.length,
    tokens,
  }

  const json = JSON.stringify(catalog, null, 2) + '\n'
  // Written to both the docs and Storybook public dirs so each app's
  // auto-generated Design Tokens page can fetch it at runtime.
  const outDirs = [join(ROOT, 'apps/site/public'), join(ROOT, 'apps/storybook/public')]
  for (const outDir of outDirs) {
    await mkdir(outDir, { recursive: true })
    await writeFile(join(outDir, 'tokens.catalog.json'), json)
  }
  console.log(
    `Wrote ${tokens.length} tokens (${hooks.length} per-component hooks) to tokens.catalog.json (docs + storybook)`,
  )
}

await main()
