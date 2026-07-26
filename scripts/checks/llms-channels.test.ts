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
import { reactExportedNames } from '../registry/react-exports.ts'

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

  // ── Channel truth (2026-07-25 plan, WS-6 / mechanism B) ──────────────────────────────
  //
  // The channel annotation existed and was *checked for presence* long before it was
  // checked for TRUTH — and it was inverted for the seven layout primitives that
  // @cascivo/react does export, so `layout/flex` shipped a doc page reading "Copy-paste
  // only — not published as an importable package" while the dashboard recipe correctly
  // said the opposite. Presence checks cannot see a wrong answer; this one can.
  //
  // No allowlist by design: if an entry's channel is ever ambiguous, the export list IS
  // the answer.
  it("every entry's channels match the real @cascivo/react export list", () => {
    const exported = reactExportedNames(REPO_ROOT)
    const failures: string[] = []
    for (const e of registry()) {
      // An explicit `install` is authoritative — the entry ships in that package, and its
      // display name may legitimately collide with a different component of the same name
      // in @cascivo/react (`chart/calendar` vs the date-picker `Calendar`).
      if (e.install) continue
      const name = (e as { meta?: { name?: string } }).meta?.name ?? e.name
      const channels = (e as { channels?: string[] }).channels ?? []
      const claimsReact = channels.includes('npm:@cascivo/react')
      const reallyExported = exported.has(name)
      if (claimsReact !== reallyExported) {
        failures.push(
          `${e.name}: registry says ${claimsReact ? '' : 'NOT '}importable from ` +
            `@cascivo/react, but packages/react/src/index.ts ${reallyExported ? 'does' : 'does not'} export \`${name}\``,
        )
      }
    }
    assert.deepEqual(
      failures,
      [],
      `Channel annotations disagree with the real export list (run \`pnpm regen\`):\n${failures.join('\n')}`,
    )
  })

  it('no generated markdown calls an importable entry "copy-paste only"', () => {
    const failures: string[] = []
    for (const e of registry()) {
      const channels = (e as { channels?: string[] }).channels ?? []
      if (!channels.some((c) => c.startsWith('npm:'))) continue
      const md = join(LLMS_DIR, `${e.name}.md`)
      if (!existsSync(md)) continue
      if (/Copy-paste only/i.test(readFileSync(md, 'utf8'))) {
        failures.push(
          `${e.name}: doc says "Copy-paste only" but it ships in ${channels.join(', ')}`,
        )
      }
    }
    assert.deepEqual(failures, [], `Regenerate docs (\`pnpm regen\`):\n${failures.join('\n')}`)
  })

  // Docs freshness invariant (WS-A): every served artifact carries a version stamp,
  // so a stale deployed copy is detectable (by a reader and by the post-deploy probe).
  it('llms.txt carries a top-of-file registry-version stamp', () => {
    const txt = readFileSync(LLMS_TXT_PATH, 'utf8')
    const version = (JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as { version: string }).version
    const head = txt.split('\n').slice(0, 6).join('\n')
    assert.ok(
      head.includes(`registry v${version}`),
      `llms.txt is missing the top-of-file "registry v${version}" stamp (run \`pnpm regen\`)`,
    )
  })

  it('every per-component markdown ends with a freshness stamp', () => {
    const version = (JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as { version: string }).version
    const failures: string[] = []
    for (const e of registry()) {
      const md = join(LLMS_DIR, `${e.name}.md`)
      if (!existsSync(md)) continue
      if (!readFileSync(md, 'utf8').includes(`registry v${version}`)) {
        failures.push(`${e.name}: markdown lacks the "registry v${version}" stamp`)
      }
    }
    assert.deepEqual(failures, [], `Regenerate docs (\`pnpm regen\`):\n${failures.join('\n')}`)
  })
})
