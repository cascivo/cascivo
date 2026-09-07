/**
 * The cross-package export-name overlap, computed once and shared by the guard
 * (`scripts/checks/export-collisions.test.ts`) and the doc generator
 * (`scripts/docs-md/collisions.ts`) so the published list can never disagree with the
 * one CI enforces.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { exportedNamesOf, reactExportedNames } from '../../registry/react-exports.ts'

/** Markers delimiting the generated block in docs/RECIPE-DASHBOARD.md. */
export const BEGIN = '<!-- BEGIN:icon-collisions -->'
export const END = '<!-- END:icon-collisions -->'

/** Top-level export names of a package's entry module (one level of `export *` followed). */
export function packageExports(root: string, entry: string): Set<string> {
  const file = join(root, entry)
  const src = readFileSync(file, 'utf8')
  const names = new Set(exportedNamesOf(file))
  for (const m of src.matchAll(/export\s+\*\s+from\s+'(\.[^']+)'/g)) {
    const spec = m[1]!.replace(/\.(ts|tsx)$/, '')
    for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
      const resolved = join(file, '..', spec + ext)
      if (!existsSync(resolved)) continue
      for (const name of exportedNamesOf(resolved)) names.add(name)
      break
    }
  }
  return names
}

/** Only value exports matter for a JSX name clash; type-only names never collide at runtime. */
export function componentNames(names: Set<string>): Set<string> {
  return new Set([...names].filter((n) => /^[A-Z]/.test(n) && !/Props$|Options$|Config$/.test(n)))
}

/** Every `@cascivo/icons` export that also names a component or a chart, sorted. */
export function collidingIconNames(root: string): string[] {
  const react = componentNames(reactExportedNames(root))
  const charts = componentNames(packageExports(root, 'packages/charts/src/index.ts'))
  const icons = componentNames(packageExports(root, 'packages/icons/src/index.tsx'))
  return [...icons].filter((n) => react.has(n) || charts.has(n)).sort()
}
