/**
 * Layer-order drift check.
 *
 * cascivo declares one canonical @layer order in packages/tokens/src/layers.css.
 * Historically the order was restated in ≥5 places (all.css, the CLI scaffold,
 * every example index.html, and the docs) and they drifted apart — some said
 * `component > theme`, others `theme > component` — which is what made overrides
 * feel "priority locked."
 *
 * This test extracts every `@layer a, b, c;` ORDER STATEMENT (the comma-list form,
 * not `@layer name { … }` blocks) from the shipped CSS, the example apps, the docs,
 * and the CLI scaffold, and asserts each is an ordered subsequence of the canonical
 * order. App-local layer names (e.g. cascivo.example) are not governed and may be
 * interleaved freely — only the relative order of the canonical layers is enforced.
 *
 * It also asserts every shipped `@layer <name> { … }` BLOCK uses a canonical name or
 * the `cascivo.blocks.<name>` pattern (depth ≤ 3) — so an undeclared layer name can
 * never be appended above `cascivo.override` and defeat the consumer escape hatch.
 */

import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname, relative, sep } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')

const CANONICAL_FILE = join(REPO_ROOT, 'packages/tokens/src/layers.css')

// A @layer order statement: `@layer <names>;` with no block `{`. Requires the
// trailing `;` so `@layer cascivo.component { … }` blocks are not matched.
const LAYER_STATEMENT_RE = /@layer\s+([a-zA-Z0-9_.\-,\s]+?)\s*;/g

// A @layer BLOCK prelude: a single layer name followed by `{` (no comma list).
// Matches `@layer cascivo.component {` and `@layer cascivo.blocks.app-shell {`.
const LAYER_BLOCK_RE = /@layer\s+([a-zA-Z0-9_.-]+)\s*\{/g

function parseLayerNames(statementBody: string): string[] {
  return statementBody
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function readCanonicalOrder(): string[] {
  const src = readFileSync(CANONICAL_FILE, 'utf8')
  LAYER_STATEMENT_RE.lastIndex = 0
  const match = LAYER_STATEMENT_RE.exec(src)
  assert.ok(match, `no @layer statement found in ${relative(REPO_ROOT, CANONICAL_FILE)}`)
  return parseLayerNames(match![1] ?? '')
}

// Only cascivo.* layers are governed by the canonical order; other names
// (e.g. an app's own `cascivo.example`) may be interleaved freely.
function isGoverned(name: string, canonical: string[]): boolean {
  return canonical.includes(name)
}

/** True when the canonical-governed names in `names` keep canonical relative order. */
function isOrderedSubsequence(names: string[], canonical: string[]): boolean {
  let cursor = -1
  for (const name of names) {
    if (!isGoverned(name, canonical)) continue
    const idx = canonical.indexOf(name)
    if (idx <= cursor) return false
    cursor = idx
  }
  return true
}

function collectFiles(dir: string, exts: Set<string>, names: Set<string>): string[] {
  const results: string[] = []
  try {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) results.push(...collectFiles(full, exts, names))
      else if (exts.has(extname(entry)) || names.has(entry)) results.push(full)
    }
  } catch {
    // skip unreadable dirs
  }
  return results
}

interface Statement {
  file: string
  line: number
  names: string[]
  raw: string
}

interface BlockName {
  file: string
  line: number
  name: string
}

function scanBlockNames(file: string): BlockName[] {
  const src = readFileSync(file, 'utf8')
  const rel = relative(REPO_ROOT, file)
  const blocks: BlockName[] = []
  let match: RegExpExecArray | null
  LAYER_BLOCK_RE.lastIndex = 0
  while ((match = LAYER_BLOCK_RE.exec(src)) !== null) {
    const name = (match[1] ?? '').trim()
    const line = src.slice(0, match.index).split('\n').length
    blocks.push({ file: rel, line, name })
  }
  return blocks
}

/**
 * A shipped `@layer <name> { … }` block name is legal iff it is either exactly a
 * canonical layer name, or a `cascivo.blocks.<block>` sublayer (depth 3, whose
 * two-segment prefix `cascivo.blocks` is canonical). Anything else — a resurrected
 * `cascivo.functions`, an invented `cascivo.layout.card.status`, or a foreign layer
 * root — is a drift/verbosity violation the report warns about.
 */
function isLegalBlockName(name: string, canonical: string[]): boolean {
  if (canonical.includes(name)) return true
  const segments = name.split('.')
  return segments.length === 3 && segments[0] === 'cascivo' && segments[1] === 'blocks'
}

function scanFile(file: string): Statement[] {
  const src = readFileSync(file, 'utf8')
  const rel = relative(REPO_ROOT, file)
  const statements: Statement[] = []
  let match: RegExpExecArray | null
  LAYER_STATEMENT_RE.lastIndex = 0
  while ((match = LAYER_STATEMENT_RE.exec(src)) !== null) {
    const names = parseLayerNames(match[1] ?? '')
    // Ignore statements that touch no cascivo.* layer (unrelated author layers).
    if (!names.some((n) => n.startsWith('cascivo.'))) continue
    const line = src.slice(0, match.index).split('\n').length
    statements.push({ file: rel, line, names, raw: match[0].trim() })
  }
  return statements
}

describe('layer-order:check — one canonical @layer order, no drift', () => {
  const canonical = readCanonicalOrder()

  const scanned: Statement[] = [
    ...collectFiles(join(REPO_ROOT, 'packages'), new Set(['.css']), new Set()),
    ...collectFiles(join(REPO_ROOT, 'apps'), new Set(['.css', '.html']), new Set()),
    // Docs recommend order statements in fenced code blocks; scan .md too.
    ...collectFiles(join(REPO_ROOT, 'docs'), new Set(['.md']), new Set()),
    // The CLI scaffolds an order statement into consumer index.html.
    join(REPO_ROOT, 'packages/cli/src/commands/create.ts'),
  ].flatMap(scanFile)

  it('canonical order is the expected sequence', () => {
    assert.deepEqual(canonical, [
      'cascivo.reset',
      'cascivo.base',
      'cascivo.tokens',
      'cascivo.component',
      'cascivo.platform',
      'cascivo.theme',
      'cascivo.blocks',
      'cascivo.override',
    ])
  })

  it('found at least the shipped + scaffold statements', () => {
    // layers.css + all.css comment is prose; real statements: layers.css, cli,
    // and the 7 example apps. Guard against the scan silently matching nothing.
    assert.ok(scanned.length >= 8, `expected ≥8 layer statements, found ${scanned.length}`)
  })

  it('the order statement is wired to load first from every entry path', () => {
    // tokens/index.css imports layers.css before any layered block.
    const tokensIndex = readFileSync(join(REPO_ROOT, 'packages/tokens/src/index.css'), 'utf8')
    const importIdx = tokensIndex.indexOf("@import './layers.css'")
    const firstBlockIdx = tokensIndex.indexOf('@layer cascivo.tokens {')
    assert.ok(importIdx >= 0, 'tokens/index.css must @import ./layers.css')
    assert.ok(
      importIdx < firstBlockIdx,
      'tokens/index.css must import layers.css before its first @layer block',
    )
    // themes/all.css imports the statement explicitly, first.
    const allCss = readFileSync(join(REPO_ROOT, 'packages/themes/src/all.css'), 'utf8')
    assert.ok(
      allCss.includes("@import '@cascivo/tokens/layers.css'"),
      'themes/all.css must import @cascivo/tokens/layers.css',
    )
    // The @cascivo/react aggregate prepends the statement to styles.css.
    const reactCfg = readFileSync(join(REPO_ROOT, 'packages/react/vite.config.ts'), 'utf8')
    assert.ok(
      reactCfg.includes('layers.css') && reactCfg.includes('LAYER_ORDER'),
      'react vite.config must prepend the canonical layer statement to styles.css',
    )
  })

  it('every @layer statement is an ordered subsequence of the canonical order', () => {
    const violations = scanned.filter((s) => !isOrderedSubsequence(s.names, canonical))
    if (violations.length > 0) {
      const msg = violations
        .map(
          (v) =>
            `  ${v.file}:${v.line}\n    ${v.raw}\n    canonical: @layer ${canonical.join(', ')};`,
        )
        .join('\n')
      assert.fail(`@layer statements that contradict the canonical order:\n${msg}`)
    }
  })

  // Shipped CSS (packages/*/src) may only open @layer BLOCKS whose name is
  // canonical or `cascivo.blocks.<name>` — no invented layer names, no depth > 3.
  // This mechanically enforces the "layer budget": undeclared names append above
  // cascivo.override and silently defeat the consumer escape hatch.
  const shippedBlocks: BlockName[] = collectFiles(
    join(REPO_ROOT, 'packages'),
    new Set(['.css']),
    new Set(),
  )
    .filter((f) => f.includes(`${sep}src${sep}`))
    .flatMap(scanBlockNames)

  it('found the shipped @layer blocks', () => {
    // 171 component + 12 theme + tokens + base + 8 blocks ≫ 50. Guard the scan.
    assert.ok(
      shippedBlocks.length >= 50,
      `expected ≥50 @layer blocks, found ${shippedBlocks.length}`,
    )
  })

  it('every shipped @layer block uses a canonical or cascivo.blocks.<name> name', () => {
    const violations = shippedBlocks.filter((b) => !isLegalBlockName(b.name, canonical))
    if (violations.length > 0) {
      const msg = violations
        .map((v) => `  ${v.file}:${v.line}\n    @layer ${v.name} { … }`)
        .join('\n')
      assert.fail(
        `@layer block names that are not canonical or cascivo.blocks.<name>:\n${msg}\n` +
          `  allowed: ${canonical.join(', ')} — or cascivo.blocks.<block-name>`,
      )
    }
  })
})

/**
 * App-slot position (2026-07-25 plan, WS-12 / mechanism C).
 *
 * The same fact was answered twice, differently, inside one file:
 * `docs/CSS-LAYERS-PITFALL.md` said app-local sublayers go "between `cascivo.blocks` and
 * `cascivo.override`" (matching `packages/tokens/src/layers.css`), and twenty lines later
 * its own worked example put `cascivo.example` between `cascivo.component` and
 * `cascivo.theme`. Meanwhile `AI-RULES.md` told agents to declare the app slot "in the
 * order statement" and then printed a statement with no app slot in it. Because layer
 * order beats specificity, a wrong guess here silently loses every app style to a theme.
 *
 * The canonical position is immediately before `cascivo.override`: above cascivo's
 * components, themes and blocks, below the consumer's last-resort escape hatch.
 */
describe('layer-order:check — an app-local slot sits immediately before cascivo.override', () => {
  const canonical = readCanonicalOrder()
  const scanned: Statement[] = [
    ...collectFiles(join(REPO_ROOT, 'docs'), new Set(['.md']), new Set()),
    ...collectFiles(join(REPO_ROOT, 'apps'), new Set(['.css', '.html']), new Set()),
    join(REPO_ROOT, 'packages/cli/src/commands/create.ts'),
  ].flatMap(scanFile)

  it('every non-canonical cascivo.* layer is placed just before cascivo.override', () => {
    const failures: string[] = []
    for (const statement of scanned) {
      const appSlots = statement.names.filter(
        (n) => n.startsWith('cascivo.') && !isGoverned(n, canonical),
      )
      if (appSlots.length === 0) continue
      const overrideIdx = statement.names.indexOf('cascivo.override')
      if (overrideIdx === -1) continue // no override in this statement — nothing to anchor to
      for (const slot of appSlots) {
        if (statement.names.indexOf(slot) !== overrideIdx - 1) {
          failures.push(
            `${statement.file}:${statement.line}: app layer '${slot}' must sit immediately ` +
              `before 'cascivo.override' (got: ${statement.names.join(', ')})`,
          )
        }
      }
    }
    assert.deepEqual(
      failures,
      [],
      `App-local layer slots are misplaced. Layer order beats specificity, so a slot below ` +
        `cascivo.theme loses every app style to the theme:\n  ${failures.join('\n  ')}`,
    )
  })
})
