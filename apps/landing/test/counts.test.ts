/**
 * Drift guard for the landing's headline counts (roadmap v19 #1).
 *
 * The og/twitter descriptions in index.html are injected at build from
 * registry.json + packages/themes/src (see vite.config.ts injectCounts), so the
 * component/theme numbers can never silently rot. This test pins that contract:
 *   - index.html uses the injection placeholders, not a hardcoded number.
 *   - no stale literal ("97+", "five themes") survives.
 *   - the theme count equals the number of theme CSS files (the "eleven themes"
 *     literal used in page copy must match source).
 *
 * Run via `vp run -r test` (the landing `test` script).
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { test } from 'node:test'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../../..')

function componentCount(): number {
  const registry = JSON.parse(readFileSync(resolve(root, 'registry.json'), 'utf8')) as {
    components: unknown[]
  }
  return registry.components.length
}

// `all.css` (the light+dark bundle) and `base.css` (the typography reset) are not
// user-facing themes — exclude them so the count tracks selectable themes only.
const NON_THEME_CSS = new Set(['all.css', 'base.css'])

function themeCount(): number {
  return readdirSync(resolve(root, 'packages/themes/src')).filter(
    (f) => f.endsWith('.css') && !NON_THEME_CSS.has(f),
  ).length
}

test('index.html injects counts via placeholders (no hardcoded headline numbers)', () => {
  const html = readFileSync(resolve(here, '../index.html'), 'utf8')
  assert.match(html, /%CASCIVO_COMPONENT_COUNT%/, 'component count must be injected, not hardcoded')
  assert.match(html, /%CASCIVO_THEME_COUNT%/, 'theme count must be injected, not hardcoded')
  assert.doesNotMatch(html, /97\+/, 'stale "97+" component count must be gone')
  assert.doesNotMatch(html, /five themes/i, 'stale "five themes" must be gone')
})

test('theme count matches the "eleven themes" copy used across the page', () => {
  assert.equal(
    themeCount(),
    11,
    'theme CSS file count changed — update the "eleven themes" page copy',
  )
})

test('registry has a non-trivial component count', () => {
  assert.ok(componentCount() > 100, 'unexpected registry component count')
})
