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
 * KNOWN lists the ones that are neither yet, with the reason they are not fixed here; the
 * list may only shrink.
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

/**
 * Frozen at the root today: `@cascivo/editor`'s chrome and syntax colours. Moving them is not
 * a one-line change, because the same file overrides them per dark-surface theme further down
 * (equal specificity, so a scoped copy placed after those rules would undo them).
 */
const KNOWN = new Set([
  '--cascivo-editor-bg',
  '--cascivo-editor-fg',
  '--cascivo-editor-gutter-bg',
  '--cascivo-editor-gutter-fg',
  '--cascivo-editor-current-line',
  '--cascivo-editor-selection',
  '--cascivo-editor-border',
  '--cascivo-editor-syntax-keyword',
  '--cascivo-editor-syntax-comment',
  '--cascivo-editor-syntax-function',
  '--cascivo-editor-syntax-operator',
  '--cascivo-editor-syntax-punctuation',
  '--cascivo-editor-syntax-tag',
])

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

  const unexpected = frozen.filter((n) => !KNOWN.has(n))
  assert.deepEqual(
    unexpected,
    [],
    `declared on :root alone from a theme colour, so frozen at the root theme inside any ` +
      `scoped [data-theme]: ${unexpected.join(', ')}. Declare it in the \`:root, [data-theme]\` block.`,
  )
  const fixed = [...KNOWN].filter((n) => !frozen.includes(n))
  assert.deepEqual(fixed, [], `no longer frozen, remove from KNOWN: ${fixed.join(', ')}`)
})
