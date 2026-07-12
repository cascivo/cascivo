/**
 * Distribution-channel + stylesheet guard for the generated AI surfaces.
 *
 * The dashboard-adopter feedback lost time on two channel/stylesheet gaps:
 *   1. An agent could not tell from the llms.txt component index whether an
 *      entry was a copy-paste block or a separate npm package.
 *   2. The required `@cascivo/charts/styles.css` import was absent from every
 *      *generated* surface, so charts shipped with their screen-reader
 *      data-table fallback rendered visibly.
 *
 * This check locks both closed against regression:
 *   - Every npm-distributed registry entry (`install` set) whose package
 *     exports a `./styles.css` carries a `styles` field naming that stylesheet.
 *   - The llms.txt component index annotates every entry's channel, and every
 *     npm entry's index line names its npm package.
 *   - Every npm entry's per-component markdown documents its stylesheet import.
 *
 * Run with: `pnpm llms:check` (also runs in `regen`/CI). Regenerate with
 * `pnpm regen` if this fails after a registry change.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const REGISTRY_PATH = join(REPO_ROOT, 'registry.json')
const LLMS_TXT_PATH = join(REPO_ROOT, 'apps/site/public/llms.txt')
const LLMS_DIR = join(REPO_ROOT, 'apps/site/public/llms')

interface Entry {
  name: string
  type: string
  install?: string
  styles?: string
}

function registry(): Entry[] {
  return (JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as { components: Entry[] }).components
}

/** Does the workspace package `@cascivo/<x>` export a `./styles.css`? */
function packageExportsStylesheet(installPkg: string): boolean {
  const m = /^@cascivo\/(.+)$/.exec(installPkg)
  if (!m) return false
  const pkgPath = join(REPO_ROOT, 'packages', m[1], 'package.json')
  if (!existsSync(pkgPath)) return false
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { exports?: Record<string, unknown> }
  return Boolean(pkg.exports?.['./styles.css'])
}

describe('llms channel + stylesheet guard', () => {
  it('every npm entry whose package ships a stylesheet carries a matching `styles` field', () => {
    const missing = registry()
      .filter((e) => e.install && packageExportsStylesheet(e.install))
      .filter((e) => e.styles !== `${e.install}/styles.css`)
      .map((e) => `${e.name} (install: ${e.install}, styles: ${e.styles ?? 'MISSING'})`)
    assert.deepEqual(
      missing,
      [],
      `These npm entries are missing the expected \`styles\` field (run \`pnpm regen\`):\n${missing.join('\n')}`,
    )
  })

  it('the llms.txt index names the npm package for every npm-distributed entry', () => {
    const txt = readFileSync(LLMS_TXT_PATH, 'utf8')
    const failures: string[] = []
    for (const e of registry()) {
      if (!e.install) continue
      // Index line: `- [<name>](…/llms/<name>.md) — <desc> _(npm <pkg>)_`
      const line = txt.split('\n').find((l) => l.startsWith(`- [${e.name}](`))
      if (!line) {
        failures.push(`${e.name}: no index line in llms.txt`)
      } else if (!line.includes(`_(npm ${e.install})_`)) {
        failures.push(`${e.name}: index line lacks "_(npm ${e.install})_" — got: ${line.trim()}`)
      }
    }
    assert.deepEqual(failures, [], `Regenerate llms.txt (\`pnpm regen\`):\n${failures.join('\n')}`)
  })

  it('every npm entry’s markdown documents its stylesheet import', () => {
    const failures: string[] = []
    for (const e of registry()) {
      if (!e.styles) continue
      const md = join(LLMS_DIR, `${e.name}.md`)
      if (!existsSync(md)) {
        failures.push(`${e.name}: missing generated markdown`)
        continue
      }
      if (!readFileSync(md, 'utf8').includes(`import '${e.styles}'`)) {
        failures.push(`${e.name}: markdown lacks \`import '${e.styles}'\``)
      }
    }
    assert.deepEqual(failures, [], `Regenerate docs (\`pnpm regen\`):\n${failures.join('\n')}`)
  })
})
