#!/usr/bin/env node
/**
 * Simplicity-receipts generator.
 *
 * Measures, for a curated set of components that cascivo builds on browser-native
 * primitives, their real size (LOC across source files) and third-party runtime
 * dependency count — read straight from the source, so the numbers can't drift.
 * Emits apps/site/public/simplicity.json.
 *
 * The generator FAILS if a featured component imports a third-party runtime
 * dependency (anything that isn't react/react-dom, an @cascivo/* package, or a
 * local file) — so the "no wrapped third-party primitive" claim is self-verifying.
 *
 * Run with: `pnpm simplicity:generate` (part of `pnpm regen`).
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '../..')
const SRC = join(ROOT, 'packages/components/src')
const OUT = join(ROOT, 'apps/site/public/simplicity.json')

// The browser primitive each featured component is built on. Editorial (which
// platform feature), paired with measured size below.
const FEATURED: { name: string; label: string; primitive: string }[] = [
  { name: 'radio', label: 'Radio', primitive: 'Native <input type="radio">' },
  { name: 'checkbox', label: 'Checkbox', primitive: 'Native <input type="checkbox">' },
  { name: 'toggle', label: 'Switch', primitive: 'Accessible <button> + :has()' },
  { name: 'modal', label: 'Dialog', primitive: 'Native <dialog> + showModal()' },
  { name: 'popover', label: 'Popover', primitive: 'Popover API + CSS anchor positioning' },
]

const SOURCE_EXT = /\.(tsx?|css)$/
const IGNORE = /\.(test|stories|meta)\./

/** Count non-blank lines across a component's source files (tsx + css, no tests). */
function measure(dir: string): { loc: number; files: number; thirdParty: string[] } {
  const files = readdirSync(dir).filter((f) => SOURCE_EXT.test(f) && !IGNORE.test(f))
  let loc = 0
  const thirdParty = new Set<string>()
  for (const file of files) {
    const src = readFileSync(join(dir, file), 'utf8')
    loc += src.split('\n').filter((l) => l.trim() !== '').length
    for (const m of src.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const spec = m[1] ?? ''
      const bare = spec.startsWith('.')
        ? null
        : spec.startsWith('@cascivo/') || spec === 'react' || spec === 'react-dom'
          ? null
          : spec
      if (bare) thirdParty.add(bare)
    }
  }
  return { loc, files: files.length, thirdParty: [...thirdParty] }
}

function main(): void {
  const violations: string[] = []
  const components = FEATURED.map((f) => {
    const { loc, files, thirdParty } = measure(join(SRC, f.name))
    if (thirdParty.length > 0) {
      violations.push(`  ${f.name}: unexpected third-party dep(s): ${thirdParty.join(', ')}`)
    }
    return {
      name: f.name,
      label: f.label,
      primitive: f.primitive,
      loc,
      files,
      deps: thirdParty.length,
    }
  })

  if (violations.length > 0) {
    console.error(
      'simplicity:generate FAILED — a featured "platform-native" component now wraps a ' +
        `third-party runtime dependency:\n${violations.join('\n')}\n` +
        'Either remove the dependency or drop the component from the featured set.',
    )
    process.exit(1)
  }

  const payload = { components }
  writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(
    `Wrote simplicity.json — ${components.length} platform-native components, ` +
      `${components.reduce((n, c) => n + c.loc, 0)} total LOC, 0 third-party deps`,
  )
}

main()
