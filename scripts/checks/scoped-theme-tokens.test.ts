/**
 * A token derived from a theme colour has to resolve inside a scoped theme.
 *
 * Themes apply to any element (`data-theme` on a section, a card, a preview), and a custom
 * property's `var()` resolves on the element that DECLARES it. A token declared on `:root`
 * alone as `var(--cascivo-color-…)` is therefore computed once, from the root theme, and
 * every element below inherits that frozen value, scoped theme or not. `--cascivo-link-color`
 * did exactly that: every Link inside a `[data-theme='dark']` container kept the light accent,
 * 3.67:1 on the dark background (found by the workbench sweep, 2026-10-08).
 *
 * The rule: a `:root` declaration in `@cascivo/tokens` that reads a theme colour is either
 * restated by every theme (it then resolves per theme) or also declared on `[data-theme]`.
 * `@cascivo/editor`'s colours were the other case, and moved with it.
 *
 * Run: `pnpm meta:check`.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

const ROOT = join(import.meta.dirname, '../..')
const TOKENS = join(ROOT, 'packages/tokens/src/index.css')
const THEMES = join(ROOT, 'packages/themes/src')

/** The body of every rule whose selector list matches `selector`. */
function blocks(css: string, selector: RegExp): string[] {
  const out: string[] = []
  for (const m of css.matchAll(/([^{};]+)\{/g)) {
    if (!selector.test(m[1]!)) continue
    let depth = 1
    let i = m.index! + m[0].length
    const start = i
    while (i < css.length && depth > 0) {
      if (css[i] === '{') depth++
      else if (css[i] === '}') depth--
      i++
    }
    out.push(css.slice(start, i - 1))
  }
  return out
}

function names(block: string): Set<string> {
  return new Set([...block.matchAll(/(--cascivo-[a-z0-9-]+)\s*:/g)].map((m) => m[1]!))
}

test('tokens derived from a theme colour resolve inside a scoped theme', () => {
  const css = readFileSync(TOKENS, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  const [rootOnly] = blocks(css, /^\s*:root\s*$/)
  assert.ok(rootOnly, 'packages/tokens/src/index.css has no `:root {` block; the guard is stale')
  const scoped = new Set(blocks(css, /\[data-theme\]/).flatMap((b) => [...names(b)]))

  const themeFiles = readdirSync(THEMES).filter((f) => f.endsWith('.css') && f !== 'all.css')
  const perTheme = themeFiles.map((f) => names(readFileSync(join(THEMES, f), 'utf8')))
  const everyTheme = (name: string) => perTheme.filter((n) => n.size > 20).every((n) => n.has(name))

  const frozen: string[] = []
  for (const m of rootOnly.matchAll(/(--cascivo-[a-z0-9-]+)\s*:([^;]+);/g)) {
    const [, name, value] = m
    if (!/var\(\s*--cascivo-(color|chart)-/.test(value!)) continue
    if (scoped.has(name!) || everyTheme(name!)) continue
    frozen.push(name!)
  }

  assert.deepEqual(
    frozen,
    [],
    `declared on :root alone from a theme colour, so frozen at the root theme inside any ` +
      `scoped [data-theme]: ${frozen.join(', ')}. Declare it in a \`:root, [data-theme]\` block.`,
  )
})

// The editor's scoped defaults and the dark-surface overrides have equal specificity, so
// source order decides: the defaults must come first or every dark theme loses its brighter
// syntax hues. Asserted here rather than explained in the CSS, which ships its comments in a
// stylesheet that sits at its gzip budget.
test("the dark-surface editor overrides come after the editor's scoped defaults", () => {
  const css = readFileSync(TOKENS, 'utf8')
  const defaults = css.indexOf('--cascivo-editor-syntax-string: oklch(')
  const overrides = css.indexOf('--cascivo-editor-syntax-string: var(--cascivo-chart-3)')
  assert.ok(defaults !== -1 && overrides !== -1, 'editor syntax tokens moved; update this guard')
  assert.ok(defaults < overrides, 'the dark-surface editor rule must follow the scoped defaults')
})
