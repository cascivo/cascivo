/**
 * Writes `dist/elements.css` (the same CSS modules the React components use, compiled with
 * the fixed `cv-<unit>-<local>` class names cascivo-html emits) and
 * `dist/custom-elements.json`. Runs after `vp build`.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { buildCss } from '../../../scripts/html-kit/build-css.ts'
import { customElementsManifest } from '../src/manifest.ts'

export const UNITS = ['menu', 'tabs', 'combobox', 'date-picker', 'calendar'] as const

// Hosts are plain containers; the component CSS styles the markup inside them.
const HOSTS =
  '@layer cascivo.component{cv-menu{display:inline-block}cv-tabs{display:block}cv-combobox,cv-date-picker{display:block}}'

export function elementsCss(): string {
  return [HOSTS, ...UNITS.map(buildCss)].join('\n')
}

if (import.meta.main) {
  const dist = new URL('../dist/', import.meta.url)
  mkdirSync(dist, { recursive: true })
  writeFileSync(new URL('elements.css', dist), elementsCss())
  writeFileSync(
    new URL('custom-elements.json', dist),
    `${JSON.stringify(customElementsManifest(), null, 2)}\n`,
  )
}
