/**
 * TSDoc-parity guard — Mechanism D.
 *
 * Two agents built the same dashboard on the same day, against the same published version.
 * One read `llms.txt` and was saved by the ⚠ on `Flex`'s `direction` default. The other read
 * the shipped `packages/react/dist/index.d.ts` and hit that default three times in one build.
 * The fix for that default had already landed — in the *manifest*, which is where the guard
 * looked. The guard was green and the defect shipped anyway.
 *
 * So this checks the surface the fix has to reach:
 *
 *  1. Every manifest prop carrying a `default` or a `⚠` has TSDoc on its TypeScript member.
 *  2. `@defaultValue` agrees with the manifest's `default`.
 *  3. No manifest ships a placeholder description — `'Width of the component.'` rendered as
 *     the entire published documentation for the single most-misunderstood chart prop.
 *  4. Coverage only ratchets up.
 *
 * `pnpm tsdoc:generate` (part of `pnpm regen`) writes (1) and (2) from the manifest, so the
 * usual fix for a failure here is to run regen and commit.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))

const SOURCE_DIRS = [
  join(ROOT, 'packages/components/src'),
  join(ROOT, 'packages/layouts/src'),
  join(ROOT, 'packages/charts/src/charts'),
]

/**
 * Descriptions that document nothing. `'Width of the component.'` was the published prose for
 * `width` on all 23 charts — the prop an adopter must understand to get a responsive chart,
 * and the reason one invented four pixel widths and wrapped every card in a scroller.
 */
const PLACEHOLDERS = [
  'Width of the component.',
  'Height of the component.',
  'The component.',
  'TODO',
]

/** Current TSDoc coverage floor. Raise it when you add docs; never lower it. */
const COVERAGE_FLOOR = 300

interface Prop {
  component: string
  name: string
  description: string
  default?: string
}

function metaFiles(): Array<{ component: string; meta: string; tsx: string }> {
  const out: Array<{ component: string; meta: string; tsx: string }> = []
  for (const dir of SOURCE_DIRS) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      try {
        out.push({
          component: entry.name,
          meta: readFileSync(join(dir, entry.name, `${entry.name}.meta.ts`), 'utf8'),
          tsx: readFileSync(join(dir, entry.name, `${entry.name}.tsx`), 'utf8'),
        })
      } catch {
        // Not every directory is a documented component (compound helpers, test utils).
      }
    }
  }
  return out
}

/** Props from a `.meta.ts`'s `props: [...]` array, as `{ name, description, default }`. */
function metaProps(component: string, source: string): Prop[] {
  const at = source.search(/\n\s*props:\s*\[/)
  if (at === -1) return []
  const from = source.indexOf('[', at)
  let depth = 0
  let end = from
  for (let i = from; i < source.length; i++) {
    if (source[i] === '[') depth++
    else if (source[i] === ']' && --depth === 0) {
      end = i
      break
    }
  }
  const props: Prop[] = []
  for (const entry of source
    .slice(from, end)
    .split(/\n\s{4}\{/)
    .slice(1)) {
    const name = /name:\s*'([^']+)'/.exec(entry)?.[1]
    if (!name) continue
    // Join the `'a' + 'b'` / multi-line string forms into one description.
    const desc = [...entry.matchAll(/description:\s*((?:\s*'(?:[^'\\]|\\.)*'\s*\+?)+)/g)][0]?.[1]
    const parts = desc ? [...desc.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1]!) : []
    props.push({
      component,
      name,
      description: parts.join(''),
      ...(/\n\s*default:\s*'([^']*)'/.exec(entry)
        ? { default: /\n\s*default:\s*'([^']*)'/.exec(entry)![1]! }
        : {}),
    })
  }
  return props
}

/** True when the component's own source declares `name?:` (vs inheriting it). */
function declaresMember(tsx: string, name: string): boolean {
  return new RegExp(`^[ \\t]+${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?\\s*:`, 'm').test(tsx)
}

/** The TSDoc block immediately above `name?:` in the source, if any. */
function tsdocFor(tsx: string, name: string): string | null {
  const lines = tsx.split('\n')
  const memberRe = new RegExp(`^[ \\t]+${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?\\s*:`)
  const at = lines.findIndex((l) => memberRe.test(l))
  if (at === -1) return null
  if (lines[at - 1]?.trimStart().startsWith('/**')) return lines[at - 1]!
  if (!lines[at - 1]?.trimStart().startsWith('*/')) return null
  let i = at - 1
  while (i >= 0 && !lines[i]!.trimStart().startsWith('/**')) i--
  return i < 0 ? null : lines.slice(i, at).join('\n')
}

const FILES = metaFiles()
const ALL_PROPS = FILES.flatMap((f) => metaProps(f.component, f.meta))

describe('tsdoc-parity — the .d.ts carries what the manifest documents', () => {
  it('resolves a plausible number of components', () => {
    assert.ok(FILES.length > 100, `only ${FILES.length} manifests resolved — the scan is broken`)
  })

  it('every prop with a default or a ⚠ warning has TSDoc on its TypeScript member', () => {
    const missing: string[] = []
    for (const file of FILES) {
      for (const prop of metaProps(file.component, file.meta)) {
        const notable = prop.default !== undefined || prop.description.includes('⚠')
        if (!notable || !prop.description) continue
        // Only props the component DECLARES. A manifest may document an inherited HTML
        // attribute (`disabled`, `alt`, `rows`) that has no member of its own to annotate —
        // its docs live on React's types, not ours.
        if (!declaresMember(file.tsx, prop.name)) continue
        if (tsdocFor(file.tsx, prop.name)) continue
        missing.push(`  ${file.component}.${prop.name}`)
      }
    }
    assert.deepEqual(
      missing,
      [],
      'These props document a default or a ⚠ in the manifest but carry no TSDoc, so the fact ' +
        'never reaches `@cascivo/react/dist/index.d.ts` — the surface a typed-language agent ' +
        `reads. Run \`pnpm tsdoc:generate\` and commit:\n${missing.join('\n')}`,
    )
  })

  it('@defaultValue agrees with the manifest', () => {
    const wrong: string[] = []
    for (const file of FILES) {
      for (const prop of metaProps(file.component, file.meta)) {
        if (prop.default === undefined) continue
        const doc = tsdocFor(file.tsx, prop.name)
        if (!doc) continue // reported by the test above
        const documented = /@defaultValue\s+`([^`]*)`/.exec(doc)?.[1]
        if (documented === undefined || documented === prop.default) continue
        wrong.push(
          `  ${file.component}.${prop.name}: TSDoc \`${documented}\`, manifest \`${prop.default}\``,
        )
      }
    }
    assert.deepEqual(
      wrong,
      [],
      `TSDoc @defaultValue disagrees with the manifest:\n${wrong.join('\n')}`,
    )
  })

  it('no manifest ships a placeholder description', () => {
    const bad: string[] = []
    for (const prop of ALL_PROPS) {
      if (!PLACEHOLDERS.some((p) => prop.description.trim() === p)) continue
      bad.push(`  ${prop.component}.${prop.name}: "${prop.description}"`)
    }
    assert.deepEqual(
      bad,
      [],
      'A placeholder description is published verbatim to every AI surface and to the props ' +
        `table. Write what the prop actually does:\n${bad.join('\n')}`,
    )
  })

  it('TSDoc coverage does not regress', () => {
    let covered = 0
    for (const file of FILES) {
      for (const prop of metaProps(file.component, file.meta)) {
        if (tsdocFor(file.tsx, prop.name)) covered++
      }
    }
    assert.ok(
      covered >= COVERAGE_FLOOR,
      `TSDoc coverage fell to ${covered} props (floor ${COVERAGE_FLOOR}). Raise the floor when ` +
        'you add docs; never lower it.',
    )
  })

  it('a required-but-invisible chart `title` says so in its TSDoc', () => {
    // `title: string` is required on every chart and renders NO visible text — it becomes
    // the SVG accessible name. The prop name promises a heading, so an adopter wrote one,
    // saw nothing, and shipped a redundant `CardTitle` above every chart. The requirement
    // is deliberate (a chart with no accessible name is unusable with a screen reader), so
    // the warning in the TSDoc is the only thing standing between the next adopter and the
    // same afternoon.
    const charts = ['area-chart', 'line-chart', 'bar-chart']
    const missing: string[] = []
    for (const chart of charts) {
      const file = join(ROOT, `packages/charts/src/charts/${chart}/${chart}.tsx`)
      const src = readFileSync(file, 'utf8')
      const doc = /\/\*\*(?:(?!\*\/)[\s\S])*?\*\/\s*\n\s*title: string/.exec(src)?.[0]
      if (doc === undefined || !/not rendered as a visible heading/i.test(doc)) {
        missing.push(chart)
      }
    }
    assert.deepEqual(
      missing,
      [],
      `These charts' required \`title\` prop does not warn that it renders nothing visible: ${missing.join(', ')}`,
    )
  })
})
