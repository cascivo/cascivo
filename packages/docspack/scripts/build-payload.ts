/**
 * Writes the `.llms/` payload and the root `llms.txt` for `@cascivo/docspack`.
 *
 * It does NOT generate documentation — `pnpm regen` does. This reads the already-generated
 * surface under `apps/site/public/` and reshapes it into the docspack package format. A
 * missing source is a build ERROR (mirrors `packages/docs/scripts/build-content.mjs`):
 * publishing a docs package that installs fine and indexes nothing is the one failure the
 * format cannot report to the adopter.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serializeManifest } from 'docspack'
import { buildPayload } from '../src/payload.ts'

const PKG_ROOT = fileURLToPath(new URL('..', import.meta.url))
const REPO_ROOT = join(PKG_ROOT, '..', '..')

const pkg = JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8')) as {
  name: string
  version: string
}

let payload
try {
  payload = buildPayload({ root: REPO_ROOT, name: pkg.name, version: pkg.version })
} catch (error) {
  console.error(
    `build-payload: ${error instanceof Error ? error.message : String(error)}\n` +
      'The generated docs surface is missing — run `pnpm regen` first.',
  )
  process.exit(1)
}

const llmsDir = join(PKG_ROOT, '.llms')
rmSync(llmsDir, { recursive: true, force: true })

for (const file of payload.files) {
  const target = join(llmsDir, file.path)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, file.contents)
}
writeFileSync(join(llmsDir, 'manifest.json'), serializeManifest(payload.manifest))
writeFileSync(join(PKG_ROOT, 'llms.txt'), payload.llmsTxt)

const tokens = payload.manifest.chunks.reduce((total, chunk) => total + chunk.tokens, 0)
console.log(
  `build-payload: ${payload.manifest.chunks.length} chunks, ~${tokens.toLocaleString('en-US')} tokens ` +
    `into .llms/ for ${pkg.name}@${pkg.version}`,
)
