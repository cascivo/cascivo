/**
 * Props-parity check — reconcile each component's hand-authored `.meta.ts`
 * `props` (inlined into registry.json and every AI surface) against its actual
 * TypeScript prop interface. A rename in the `.tsx` (`sideNav`→`nav`) without
 * touching the manifest would otherwise ship undetected.
 *
 * Two directions, deliberately asymmetric (see docs/internal/feedback/
 * spec-ssr-verify-and-props-parity-2026-07.md, Track B):
 *
 *   - Direction A (ERROR): a manifest prop that does NOT exist on the type
 *     (checked against `resolvedAll`, incl. inherited/spread — so documenting a
 *     passthrough `onClick` on a `...ButtonHTMLAttributes` component is fine).
 *   - Direction B (WARN): an own declared prop absent from the manifest (checked
 *     against `declaredOwn`, own-only — so inherited HTML attributes aren't
 *     required to be documented). Warn-only until the manifests are swept.
 *
 * Resolution is keyed by directory (each `.tsx` from the registry entry's files),
 * so `layout/app-shell` and `app-shell` are checked independently, and only the
 * EXPORTED `<meta.name>Props` type is read — internal helpers like
 * `MenubarTriggerProps` are ignored.
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { resolvePropSets, resolvePropSetsFromSource } from './lib/component-props.ts'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))

interface MetaProp {
  name: string
  required?: boolean
}
interface RegistryComponent {
  name: string
  files?: string[]
  meta: { name: string; props?: MetaProp[] }
}

/**
 * Genuinely-intentional divergences. Key: `<registry name>.<prop>`. Value: why.
 * Kept honest by the stale-entry test below.
 */
const ALLOWLIST: Record<string, string> = {
  'layout/grid.span':
    'documented on the sibling GridItem component (GridItemProps) in the same file; ' +
    'the manifest covers the Grid/GridItem compound under one entry',
}

/** Own props never required in a manifest (framework passthrough / DOM). */
const SKIP_OWN = new Set(['className', 'children', 'style', 'key', 'ref'])

/** Repo-relative path from a registry file URL (`…/main/packages/x` → `packages/x`). */
function repoRelative(url: string): string {
  const i = url.indexOf('/packages/')
  return i === -1 ? url : url.slice(i + 1)
}

function loadRegistry(): RegistryComponent[] {
  const registry = JSON.parse(readFileSync(join(REPO_ROOT, 'registry.json'), 'utf8')) as {
    components: RegistryComponent[]
  }
  return registry.components
}

interface Checkable {
  name: string
  propsType: string
  metaProps: MetaProp[]
  sets: NonNullable<ReturnType<typeof resolvePropSets>>
}

/** Resolve every registry entry that has a `.tsx` and an exported `<Pascal>Props`. */
function collectCheckable(): Checkable[] {
  const out: Checkable[] = []
  for (const c of loadRegistry()) {
    const tsx = (c.files ?? []).filter((f) => f.endsWith('.tsx')).map(repoRelative)
    if (tsx.length === 0) continue // npm-installed (charts/flow/editor): no source
    const propsType = `${c.meta.name}Props`
    const sets = resolvePropSets(tsx, propsType)
    if (!sets) continue // no exported <Pascal>Props (compound/imperative/no-props)
    out.push({ name: c.name, propsType, metaProps: c.meta.props ?? [], sets })
  }
  return out
}

describe('props-parity — manifest props match the TypeScript interface', () => {
  const checkable = collectCheckable()

  it('resolves a plausible number of components', () => {
    assert.ok(
      checkable.length > 100,
      `only ${checkable.length} components resolved a props type — resolver broken?`,
    )
  })

  it('Direction A — no manifest documents a prop that does not exist on the type', () => {
    const errors: string[] = []
    for (const c of checkable) {
      for (const p of c.metaProps) {
        if (c.sets.resolvedAll.has(p.name)) continue
        if (ALLOWLIST[`${c.name}.${p.name}`] !== undefined) continue
        errors.push(`  ${c.name} (${c.propsType}): meta documents '${p.name}', not on the type`)
      }
    }
    assert.deepEqual(
      errors,
      [],
      `Manifest documents props that don't exist on the component's TypeScript interface ` +
        `(fix the .meta.ts + \`pnpm regen\`, or allowlist with a reason):\n${errors.join('\n')}`,
    )
  })

  it('Direction B — own declared props are documented (warn-only)', () => {
    const warnings: string[] = []
    for (const c of checkable) {
      const documented = new Set(c.metaProps.map((p) => p.name))
      for (const own of c.sets.declaredOwn) {
        if (documented.has(own) || SKIP_OWN.has(own)) continue
        if (ALLOWLIST[`${c.name}.${own}`] !== undefined) continue
        warnings.push(`  ${c.name}: own prop '${own}' is undocumented`)
      }
    }
    // Warn-only: print for future burn-down, never fail. Promote to an assertion
    // once the manifests are swept.
    if (warnings.length > 0) {
      console.log(
        `\n[props-parity] Direction B — ${warnings.length} undocumented own prop(s) (warn-only):\n` +
          warnings.join('\n'),
      )
    }
    assert.ok(true)
  })

  it('allowlist has no stale entries', () => {
    const byName = new Map(checkable.map((c) => [c.name, c]))
    const stale: string[] = []
    for (const [key, reason] of Object.entries(ALLOWLIST)) {
      const dot = key.lastIndexOf('.')
      const compName = key.slice(0, dot)
      const prop = key.slice(dot + 1)
      const c = byName.get(compName)
      // Stale if the divergence no longer holds: component/prop gone from the
      // manifest, or the prop is now genuinely present on the type.
      const documented = c?.metaProps.some((p) => p.name === prop) ?? false
      const onType = c?.sets.resolvedAll.has(prop) ?? false
      if (!c || !documented || onType) stale.push(`${key} (${reason})`)
    }
    assert.deepEqual(stale, [], `Stale ALLOWLIST entries — remove them:\n  ${stale.join('\n  ')}`)
  })

  it('seeded mutation — a renamed prop is caught by Direction A', () => {
    // `nav` exists on the type; the manifest still says `sideNav` → Direction A
    // must flag it (its predicate: meta name not in resolvedAll).
    const drift = resolvePropSetsFromSource('export interface FooProps { nav: string }', 'FooProps')
    assert.ok(drift, 'expected FooProps to resolve')
    assert.equal(drift.resolvedAll.has('sideNav'), false, 'sideNav must not be on the type')
    assert.equal(drift.resolvedAll.has('nav'), true, 'nav must be on the type')

    // Align the manifest to the type → Direction A passes.
    const aligned = resolvePropSetsFromSource(
      'export interface FooProps { sideNav: string }',
      'FooProps',
    )
    assert.ok(aligned)
    assert.equal(aligned.resolvedAll.has('sideNav'), true)
  })
})
