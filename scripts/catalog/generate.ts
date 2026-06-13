/**
 * Token catalog generator.
 *
 * Reads the token sources, parses all --cascivo-* custom properties, and
 * writes apps/docs/public/tokens.catalog.json.
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

  const outDir = join(ROOT, 'apps/docs/public')
  await mkdir(outDir, { recursive: true })

  const catalog = {
    generatedFrom: ['packages/tokens/src/index.css', 'packages/themes/src/light.css'],
    resolutionTheme: 'light',
    generatedAt: new Date().toISOString().slice(0, 10),
    count: tokens.length,
    tokens,
  }

  await writeFile(join(outDir, 'tokens.catalog.json'), JSON.stringify(catalog, null, 2) + '\n')
  console.log(`Wrote ${tokens.length} tokens to tokens.catalog.json`)
}

await main()
