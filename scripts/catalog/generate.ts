/**
 * Token catalog generator.
 *
 * Reads the token sources, parses all --cascivo-* custom properties, and
 * writes apps/site/public/tokens.catalog.json.
 *
 * Run with: `pnpm catalog:generate`
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseTokens } from './parse-tokens.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')

async function main() {
  const indexCss = await readFile(join(ROOT, 'packages/tokens/src/index.css'), 'utf8')
  const lightCss = await readFile(join(ROOT, 'packages/themes/src/light.css'), 'utf8')
  const tokens = parseTokens(indexCss, lightCss)

  const catalog = {
    generatedFrom: ['packages/tokens/src/index.css', 'packages/themes/src/light.css'],
    resolutionTheme: 'light',
    generatedAt: new Date().toISOString().slice(0, 10),
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
  console.log(`Wrote ${tokens.length} tokens to tokens.catalog.json (docs + storybook)`)
}

await main()
