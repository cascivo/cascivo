/**
 * A config-item flag must never silently discard the row it is set on.
 *
 * ## The defect this generalises
 *
 * `DropdownItem` carried `separator?: boolean` alongside a **required** `label` and `value`.
 * Setting it did not draw a rule above the item — it replaced the item with a rule, dropping
 * the label, value and icon. Types passed, nothing warned, and the sanctioned usage forced a
 * fake row (`{ label: '', value: 'sep', separator: true }`). An adopter lost a "Log out"
 * entry to it and found out only because a smoke test counted menu rows (2026-08-22 report
 * item 9).
 *
 * The shape is the bug: **a boolean on a data-carrying row that turns it into a non-data
 * row.** The information the adopter supplied has nowhere to go, so it is dropped. The fix is
 * always the same — a discriminated union member (`{ kind: 'separator' }`) that cannot carry
 * data in the first place.
 *
 * ## Why the subjects are DERIVED
 *
 * `link-item-id-parity.test.ts` records the lesson this follows: *"a guard that enumerates its
 * own subjects can only catch the instances its author already knew about, which is the failure
 * it was written to prevent, one level up."* So this does not check `Dropdown`. It sweeps every
 * exported config-item interface in the catalog — an interface with a **required `label`** — and
 * fails on any boolean member whose name says "this row is really a decoration".
 *
 * The point is the NEXT component that invents the shape, not the one already fixed.
 *
 * Run: `pnpm dead-props:check`-style — wired into `pnpm meta:check`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))

const SOURCE_DIRS = [
  'packages/components/src',
  'packages/layouts/src',
  'packages/charts/src/charts',
]

/**
 * Boolean member names that mean "this entry is a decoration, not data". A boolean by any of
 * these names on a row that also carries a required `label` has no way to render both.
 */
const DECORATION_FLAGS = /^(separator|divider|spacer|rule|heading|groupLabel)$/

/**
 * Legacy members kept for backwards compatibility, each already superseded by a union member
 * and already warning at runtime. An entry here is a deprecation being served out, not work
 * being parked: it must name the replacement.
 */
const GRANDFATHERED: Record<string, string> = {
  'DropdownMenuItem.separator':
    "superseded by the `{ kind: 'separator' }` member of `DropdownItem`; deprecated, warns in dev, removed at 1.0",
}

/** Every non-test `.tsx`/`.ts` source file under a directory. */
function sourceFiles(dir: string): string[] {
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
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full))
    } else if (/\.tsx?$/.test(entry) && !/\.(test|stories)\.tsx?$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

/** Exported `interface Name { … }` bodies in a source file. */
function exportedInterfaces(src: string): Map<string, string> {
  const out = new Map<string, string>()
  for (const m of src.matchAll(/export interface (\w+)[^{]*\{([\s\S]*?)\n\}/g)) {
    out.set(m[1]!, m[2]!)
  }
  return out
}

describe('config items do not carry a flag that discards their own data', () => {
  const offenders: string[] = []
  let interfacesScanned = 0

  for (const dir of SOURCE_DIRS) {
    for (const file of sourceFiles(join(ROOT, dir))) {
      const src = readFileSync(file, 'utf8')
      for (const [name, body] of exportedInterfaces(src)) {
        // A config item is an interface with a REQUIRED `label` — the row's data.
        if (!/^\s*label\s*:/m.test(body)) continue
        interfacesScanned++
        for (const m of body.matchAll(/^\s*(\w+)\?:\s*boolean/gm)) {
          const prop = m[1]!
          if (!DECORATION_FLAGS.test(prop)) continue
          if (GRANDFATHERED[`${name}.${prop}`]) continue
          offenders.push(`${relative(ROOT, file)}: ${name}.${prop}`)
        }
      }
    }
  }

  it('finds config-item interfaces to check', () => {
    // A rename or a regex slip that makes the sweep return nothing must fail loudly rather
    // than pass vacuously — the failure mode this guard family exists to avoid.
    assert.ok(
      interfacesScanned >= 10,
      `only ${interfacesScanned} config-item interfaces found — the discovery predicate is broken`,
    )
  })

  it('no boolean flag turns a data-carrying row into a decoration', () => {
    assert.deepEqual(
      offenders,
      [],
      'A boolean flag on a row with a required `label` cannot render both the row and the ' +
        'decoration, so it silently drops the label/value the adopter supplied.\n' +
        'Model it as a union member that carries no data instead:\n' +
        "  export type XItem = { label: string; value: string } | { kind: 'separator' }\n" +
        'Offenders:\n  ' +
        offenders.join('\n  '),
    )
  })

  it('every grandfathered flag still exists and still names its replacement', () => {
    const stale: string[] = []
    for (const [key, reason] of Object.entries(GRANDFATHERED)) {
      const [iface, prop] = key.split('.')
      let found = false
      for (const dir of SOURCE_DIRS) {
        for (const file of sourceFiles(join(ROOT, dir))) {
          const body = exportedInterfaces(readFileSync(file, 'utf8')).get(iface!)
          if (body && new RegExp(`^\\s*${prop}\\?:\\s*boolean`, 'm').test(body)) found = true
        }
      }
      if (!found) stale.push(`${key} (no longer exists — remove the entry)`)
      if (!/kind:|replaced by|superseded/.test(reason)) {
        stale.push(`${key} (reason does not name the replacement)`)
      }
    }
    assert.deepEqual(stale, [], `Stale GRANDFATHERED entries:\n  ${stale.join('\n  ')}`)
  })
})
