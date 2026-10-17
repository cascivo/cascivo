import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as pure from './pure.ts'
import { themePreloadScript } from './theme.tsx'

const SRC = dirname(fileURLToPath(import.meta.url))

/** Value-level specifiers a module imports or re-exports (type-only edges are erased). */
function valueSpecifiers(code: string): string[] {
  const out: string[] = []
  const re = /^\s*(import|export)\s+(type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/gm
  for (const m of code.matchAll(re)) {
    if (m[2] === undefined) out.push(m[3]!)
  }
  return out
}

/** Every bare package the `pure` entry reaches through its relative source graph. */
function packagesReachedFrom(entry: string): { packages: Set<string>; clientModules: string[] } {
  const packages = new Set<string>()
  const clientModules: string[] = []
  const seen = new Set<string>()
  const walk = (file: string): void => {
    if (seen.has(file)) return
    seen.add(file)
    const code = readFileSync(file, 'utf8')
    if (/^['"]use client['"]/m.test(code)) clientModules.push(file)
    for (const spec of valueSpecifiers(code)) {
      if (spec.startsWith('.')) walk(resolve(dirname(file), spec))
      else packages.add(spec)
    }
  }
  walk(entry)
  return { packages, clientModules }
}

describe('@cascivo/core/pure', () => {
  it('serves themePreloadScript, the same function the root entry exports', () => {
    expect(pure.themePreloadScript).toBe(themePreloadScript)
  })

  // An Astro integration builds the preload script in its config process (Node, no DOM):
  // the module that defines it must not load anything.
  it('defines themePreloadScript in a module with no imports', () => {
    const code = readFileSync(join(SRC, 'theme-script.ts'), 'utf8')
    expect(valueSpecifiers(code)).toEqual([])
    expect(code).not.toMatch(/^['"]use client['"]/m)
  })

  // `Slot` and `useId` reach `react` itself (both are server-legal: no state, no effects). The
  // client runtime — `react-dom` and the signals runtime — and `'use client'` modules stay out.
  it('reaches no client runtime and no client module', () => {
    const { packages, clientModules } = packagesReachedFrom(join(SRC, 'pure.ts'))
    expect([...packages].sort()).toEqual(['react'])
    expect(clientModules).toEqual([])
  })
})
