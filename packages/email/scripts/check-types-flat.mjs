// Regression guard (v37 T4, #4): fail the build if the published @cascivo/react
// declarations leak the internal monorepo layout. The bundled dist/index.d.ts
// must reference only external packages (@cascivo/core, react, …) — never
// `packages/.../src` paths or a `dist/types/packages/...` re-export tree.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = fileURLToPath(new URL('..', import.meta.url))
const distDir = join(pkgRoot, 'dist')

/** Collect every .d.ts/.d.mts under dist/. */
function collect(dir) {
  /** @type {string[]} */
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...collect(full))
    else if (full.endsWith('.d.ts') || full.endsWith('.d.mts')) out.push(full)
  }
  return out
}

if (!existsSync(distDir)) {
  console.error('check-types-flat: dist/ not found — run the build first.')
  process.exit(1)
}

// A leaked declaration references the source tree in an import/export/reference.
const LEAK =
  /(?:from\s+['"]|import\(['"]|reference\s+path=['"])[^'"]*(?:packages\/|\/src\/|types\/packages)/

const offenders = []
for (const file of collect(distDir)) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (LEAK.test(line)) offenders.push(`${relative(pkgRoot, file)}:${i + 1}  ${line.trim()}`)
    })
}

if (offenders.length > 0) {
  console.error('✗ check-types-flat: published .d.ts leak internal source paths:\n')
  for (const o of offenders) console.error(`  ${o}`)
  console.error(
    '\nThe published types must be a flat rollup that resolves within the published surface.',
  )
  process.exit(1)
}

console.log('✓ check-types-flat: published .d.ts reference no packages/.../src paths')
