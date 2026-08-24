/**
 * The docs site's hand-written prop shims do not drift from the real components.
 *
 * ## Why this exists
 *
 * `apps/site` is Preact (`jsxImportSource: preact`) while the components are React, so its
 * `tsconfig.json` maps all 66 `@cascivo/components/*` specifiers to hand-written `.d.ts`
 * files under `src/shims/`. That avoids a React/Preact JSX type clash, and it has a cost
 * nobody was paying attention to: **the site does not type-check against the real component
 * types at all.** It type-checks against a parallel copy that only a human keeps in sync.
 *
 * That copy silently went stale at 1.0. `Dropdown`'s removed `separator: true` flag survived
 * in `dropdown.d.ts`, so `demos.tsx` kept passing it, `tsc --noEmit` exited 0, and the
 * published docs demo would have shipped demonstrating the exact data-loss bug the removal
 * was meant to eliminate. Six more shims still declared the removed value-carrying
 * `onChange`. Every other guard on the branch was green throughout.
 *
 * ## What it checks, and why the manifest is the reference
 *
 * Every prop a shim declares must exist on the component. The comparison is against the
 * component's **manifest**, not its TypeScript source, because `props-parity` already proves
 * the manifest and the interface agree in *both* directions — so checking the shim against
 * the manifest transitively checks it against the real type, with one parse instead of two.
 *
 * The reverse direction is deliberately not checked: a shim declaring a *subset* is fine and
 * normal — it only needs the props the site actually uses.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const SHIM_DIR = join(ROOT, 'apps/site/src/shims')

/** Props every React component accepts, which no manifest documents. */
const UNIVERSAL = new Set([
  'className',
  'children',
  'id',
  'style',
  'key',
  'ref',
  'role',
  'tabIndex',
  'title',
])

/**
 * Props that are real but undocumented, because they reach the component through an
 * `extends …HTMLAttributes` rather than being declared on it. A manifest documents a
 * component's OWN props, so these can never appear there.
 */
const NATIVE_PASSTHROUGH: Record<string, string> = {
  'checkbox.defaultChecked': 'InputHTMLAttributes — CheckboxProps extends it',
  'input.defaultValue': 'InputHTMLAttributes — InputProps extends it',
  'input.value': 'InputHTMLAttributes',
  'input.onFocus': 'InputHTMLAttributes',
  'input.onBlur': 'InputHTMLAttributes',
  'input.onChange': 'InputHTMLAttributes — Input is a native wrapper, so onChange IS the DOM event',
  'slider.onChange':
    'Slider deliberately has no onValueChange; its onChange is the DOM event (see slider.tsx)',
  'textarea.placeholder': 'TextareaHTMLAttributes — TextareaProps extends it',
}

interface RegistryEntry {
  name: string
  meta?: { props?: { name: string }[] }
}

const registry = JSON.parse(readFileSync(join(ROOT, 'registry.json'), 'utf8')) as {
  components: RegistryEntry[]
  blocks?: RegistryEntry[]
}
const byName = new Map([...registry.components, ...(registry.blocks ?? [])].map((c) => [c.name, c]))

/** Prop names declared in a shim's `*Props` interface. */
function shimProps(source: string): string[] {
  const body = /export interface \w*Props \{([\s\S]*?)\n\}/.exec(source)
  if (body === null) return []
  const props: string[] = []
  for (const line of body[1]!.split('\n')) {
    const m = /^ {2}([A-Za-z_$][\w$]*)\??:/.exec(line)
    if (m !== null) props.push(m[1]!)
  }
  return props
}

const checkable = readdirSync(SHIM_DIR)
  .filter((f) => f.endsWith('.d.ts'))
  .map((f) => ({ name: f.replace(/\.d\.ts$/, ''), file: join(SHIM_DIR, f) }))
  .filter((s) => byName.has(s.name))

describe('site shims — hand-written prop copies match the real components', () => {
  it('finds the shims it is meant to cover (guards against passing vacuously)', () => {
    assert.ok(
      checkable.length >= 30,
      `expected 30+ shims resolvable to a registry component, found ${checkable.length} — ` +
        'the filename-to-component mapping has probably broken rather than the shims having ' +
        'been deleted',
    )
  })

  it('no shim declares a prop the component does not have', () => {
    const offenders: string[] = []
    for (const { name, file } of checkable) {
      const documented = new Set((byName.get(name)?.meta?.props ?? []).map((p) => p.name))
      for (const prop of shimProps(readFileSync(file, 'utf8'))) {
        if (UNIVERSAL.has(prop) || prop.startsWith('aria') || prop.startsWith('data')) continue
        if (`${name}.${prop}` in NATIVE_PASSTHROUGH) continue
        if (documented.has(prop)) continue
        offenders.push(`  apps/site/src/shims/${name}.d.ts: '${prop}' is not a prop of <${name}>`)
      }
    }
    assert.deepEqual(
      offenders,
      [],
      'These shims declare props the real component does not have. Because apps/site ' +
        'type-checks against the shims rather than the components, the site will happily ' +
        'compile code that fails everywhere else — which is how a removed prop stayed in the ' +
        'published docs demo through a full green CI run.\n' +
        'Update the shim to match the manifest, or add a NATIVE_PASSTHROUGH entry if the prop ' +
        `is real but reaches the component through an \`extends …HTMLAttributes\`.\n${offenders.join('\n')}`,
    )
  })

  it('the native-passthrough allowlist has no stale entries', () => {
    const live = new Set(
      checkable.flatMap(({ name, file }) =>
        shimProps(readFileSync(file, 'utf8')).map((p) => `${name}.${p}`),
      ),
    )
    const stale = Object.keys(NATIVE_PASSTHROUGH).filter((k) => !live.has(k))
    assert.deepEqual(stale, [], `Stale NATIVE_PASSTHROUGH entries — remove them: ${stale}`)
  })
})
