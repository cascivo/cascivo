/**
 * Theme-bundle guard — a bundle's name must match what it contains.
 *
 * `@cascivo/themes/all.css` shipped for thirteen minors importing **light and dark**,
 * while `@cascivo/themes/src/` held twelve themes. `getting-started.md` said "For light and
 * dark support: import `@cascivo/themes/all.css`" and then, a few lines later, listed all
 * twelve — so an adopter who set `data-theme="cyberpunk"` got components rendered in
 * greyscale, because every `--cascivo-color-*` was unresolved. One measured the accent
 * staying `oklch(0.7 0 0)` until `cyberpunk.css` was imported explicitly (2026-07-28
 * report C4).
 *
 * That is Mechanism C — one name owning two different facts ("the common bundle" and "the
 * complete set"). The structural fix is one owner per fact: the FILESYSTEM owns the theme
 * list, and each bundle is checked against it. A thirteenth theme now fails here on the day
 * it lands, instead of being silently absent from a file called `all`.
 *
 * Run: `pnpm meta:check`.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const THEMES_DIR = join(REPO_ROOT, 'packages/themes/src')

/**
 * Stylesheets in `packages/themes/src` that are NOT themes, with the reason.
 *
 * A theme defines `[data-theme='<name>']` semantic tokens. These do something else.
 */
const NOT_A_THEME: Record<string, string> = {
  'all.css': 'the bundle itself',
  'light-dark.css': 'the two-theme bundle',
  'base.css': 'minimal html font/color floor (@layer cascivo.base), not a theme',
  'tailwind.css':
    'opt-in bridge mapping cascivo tokens onto Tailwind --color-* utilities, not a theme',
}

/** Every first-party theme file, derived from disk. */
function themeFiles(): string[] {
  return readdirSync(THEMES_DIR)
    .filter((f) => f.endsWith('.css') && !(f in NOT_A_THEME))
    .sort()
}

/** Relative `@import './x.css'` targets in a bundle. */
function imports(file: string): string[] {
  const source = readFileSync(join(THEMES_DIR, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  return [...source.matchAll(/@import\s+['"]\.\/([\w-]+\.css)['"]/g)].map((m) => m[1]!)
}

describe('theme-bundle — bundle contents match bundle names', () => {
  it('all.css imports every first-party theme', () => {
    const missing = themeFiles().filter((theme) => !imports('all.css').includes(theme))
    assert.deepEqual(
      missing,
      [],
      'These themes ship in packages/themes/src but are absent from `all.css`. A file named ' +
        '"all" that contains a subset is a naming trap: setting data-theme to a missing ' +
        'theme leaves every --cascivo-color-* unresolved and renders components greyscale ' +
        '(2026-07-28 report C4).\n' +
        'Add an `@import` to all.css, or — if the file is not a theme — add it to ' +
        `NOT_A_THEME in this guard with the reason. Missing: ${missing.join(', ')}`,
    )
  })

  it('light-dark.css contains exactly light and dark', () => {
    const themes = imports('light-dark.css').filter((f) => f in NOT_A_THEME === false)
    assert.deepEqual(
      themes.sort(),
      ['dark.css', 'light.css'],
      'light-dark.css is the two-theme bundle — the previous meaning of all.css. Adding a ' +
        'third theme to it recreates the ambiguity that made all.css a trap; put it in ' +
        'all.css instead.',
    )
  })

  it('every theme is reachable as its own export', () => {
    const pkg = JSON.parse(
      readFileSync(join(REPO_ROOT, 'packages/themes/package.json'), 'utf8'),
    ) as { exports: Record<string, string> }
    const exported = new Set(Object.values(pkg.exports))
    const missing = themeFiles().filter((theme) => !exported.has(`./src/${theme}`))
    assert.deepEqual(
      missing,
      [],
      'These themes are not reachable through the package exports map, so a consumer cannot ' +
        `import them individually at all: ${missing.join(', ')}`,
    )
  })

  it('finds the themes it is meant to cover (guards against silent skips)', () => {
    const themes = themeFiles()
    assert.ok(
      themes.length >= 12,
      `expected at least 12 first-party themes, found ${themes.length}: ${themes.join(', ')}`,
    )
    assert.ok(themes.includes('cyberpunk.css'), 'cyberpunk.css — the C4 repro theme — not found')
  })
})
