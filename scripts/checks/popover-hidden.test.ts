/**
 * Popover-hidden guard — a closed popover must not be laid out.
 *
 * The browser hides a closed popover with `[popover]:not(:popover-open) { display: none }`.
 * That rule lives in the **UA origin**, so *any* author `display` declaration in the
 * element's base rule beats it — layer, specificity and source order are all irrelevant.
 *
 * When that happens the panel keeps its box while closed. `opacity: 0` renders nothing, so
 * screenshots look perfect and there is no console output, but the element is still
 * fixed-position and still hit-testable:
 *
 *     :popover-open false · display flex · opacity 0 · pointer-events auto · height 214px
 *     document.elementFromPoint(<centre of the button below>) → input._search_…
 *     clicking the button                                     → never fires
 *
 * A 2026-07-28 adopter lost an afternoon to it: a single `<MultiSelect>` made everything
 * beneath it unclickable, presenting as "my button randomly stopped working". Two
 * components shipped it (`MultiSelect`, `Sheet`); `HeaderPanel` had the correct shape all
 * along and is the template.
 *
 * No existing guard could see this. `computed:check` mounts one component at a time in a
 * 640px box, so a closed panel never has anything underneath it to swallow — Mechanism E,
 * see `docs/internal/feedback/README.md`. This is the cheap source-text half; the browser
 * half is the C13 case in `pnpm bare-page:check`.
 *
 * The rule: if a popover element's base rule declares `display` at all, that value must be
 * `none`, and the visible value must live under `&:popover-open`.
 *
 * Run: `pnpm popover:check` (also in `pnpm ready`).
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const SOURCE_DIRS = [
  join(REPO_ROOT, 'packages/components/src'),
  join(REPO_ROOT, 'packages/layouts/src'),
  join(REPO_ROOT, 'packages/flow/src'),
  join(REPO_ROOT, 'packages/editor/src'),
  join(REPO_ROOT, 'packages/ai/src'),
]

interface Offender {
  file: string
  className: string
  display: string
}

function tsxFiles(dir: string): string[] {
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
    if (statSync(full).isDirectory()) out.push(...tsxFiles(full))
    else if (entry.endsWith('.tsx') && !entry.endsWith('.test.tsx')) out.push(full)
  }
  return out
}

/**
 * CSS-module class names used on elements that carry a `popover` attribute.
 *
 * Scans forward from each `popover=` to the end of that JSX tag and collects every
 * `styles.foo` / `styles['foo']` reference. Deliberately loose: over-collecting a class
 * that is merely *near* a popover attribute costs a false positive that a human resolves
 * in seconds, while under-collecting reproduces the defect this guard exists to catch.
 */
function popoverClasses(source: string): string[] {
  const names = new Set<string>()
  for (const match of source.matchAll(/popover=/g)) {
    const tagEnd = source.indexOf('>', match.index)
    const tag = source.slice(match.index, tagEnd === -1 ? source.length : tagEnd)
    for (const ref of tag.matchAll(/styles(?:\.(\w+)|\[['"]([\w-]+)['"]\])/g)) {
      names.add(ref[1] ?? ref[2]!)
    }
  }
  return [...names]
}

/** The body of the top-level `.className { … }` rule, nested blocks included. */
function ruleBody(css: string, className: string): string | null {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const start = css.search(new RegExp(`(?:^|[\\s,>+~])\\.${escaped}\\s*\\{`, 'm'))
  if (start === -1) return null
  const open = css.indexOf('{', start)
  let depth = 0
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0) return css.slice(open, i + 1)
  }
  return null
}

/**
 * Declarations in the rule itself — nested blocks (`&:popover-open`, `@media`,
 * `@starting-style`) removed.
 *
 * `body` arrives wrapped in its own braces, so those are dropped first: collapsing
 * innermost-block-first over the wrapped form eventually makes the *outer* block the
 * innermost one and strips everything, which silently returns "no declarations" for
 * every rule and makes the caller pass vacuously.
 */
function topLevelDeclarations(body: string): string {
  let stripped = body.trim().replace(/^\{/, '').replace(/\}$/, '')
  let previous: string
  do {
    previous = stripped
    stripped = stripped.replace(/\{[^{}]*\}/g, '')
  } while (stripped !== previous)
  return stripped
}

function findOffenders(): Offender[] {
  const offenders: Offender[] = []
  for (const dir of SOURCE_DIRS) {
    for (const file of tsxFiles(dir)) {
      const source = readFileSync(file, 'utf8')
      const classes = popoverClasses(source)
      if (classes.length === 0) continue

      const cssPath = file.replace(/\.tsx$/, '.module.css')
      let css: string
      try {
        css = readFileSync(cssPath, 'utf8')
      } catch {
        continue // styled elsewhere, or not styled at all
      }

      for (const className of classes) {
        const body = ruleBody(css, className)
        if (body === null) continue
        const declared = topLevelDeclarations(body).match(/(?:^|[;{])\s*display:\s*([^;}]+)/)
        if (declared === null) continue
        const value = declared[1]!.trim()
        if (value === 'none') continue
        offenders.push({ file: relative(REPO_ROOT, cssPath), className, display: value })
      }
    }
  }
  return offenders
}

describe('popover-hidden — a closed popover keeps no box', () => {
  it('no popover element declares a visible `display` in its base rule', () => {
    const offenders = findOffenders()
    assert.deepEqual(
      offenders.map((o) => `${o.file} .${o.className} { display: ${o.display} }`),
      [],
      'These popover panels declare `display` in their base rule, which beats the UA-origin ' +
        '`[popover]:not(:popover-open) { display: none }`. While closed they stay laid out and ' +
        'swallow every click beneath them, invisibly and with no console output ' +
        '(2026-07-28 report C13).\n\n' +
        'Fix — move the value into the open state, as `header-panel.module.css` already does:\n' +
        '  .panel {\n' +
        '-   display: flex;\n' +
        '    &:popover-open {\n' +
        '+     display: flex;\n' +
        '    }\n' +
        '  }\n' +
        'Keep `display … allow-discrete` in the transition so the exit animation survives.',
    )
  })

  it('finds the popover components it is meant to cover (guards against silent skips)', () => {
    // If the TSX→CSS resolution ever breaks, the guard above passes vacuously. Assert the
    // scan still reaches a known-popover component with a real, resolvable rule.
    const sheet = readFileSync(join(REPO_ROOT, 'packages/components/src/sheet/sheet.tsx'), 'utf8')
    assert.ok(
      popoverClasses(sheet).includes('sheet'),
      "popoverClasses() no longer resolves Sheet's panel class — this guard is passing vacuously",
    )
    const css = readFileSync(
      join(REPO_ROOT, 'packages/components/src/sheet/sheet.module.css'),
      'utf8',
    )
    assert.ok(ruleBody(css, 'sheet') !== null, 'ruleBody() no longer resolves `.sheet`')
  })
})
