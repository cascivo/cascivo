/**
 * Animation audit — the mechanical half of cascivo's motion contract.
 *
 * Scope note: this used to read only `packages/components/src`, and its forbidden-property
 * list named only PHYSICAL properties (`width`, `height`, `top`, `left`). cascivo mandates
 * logical properties everywhere — `rtl:check` fails a build for shipping `left` — so the
 * list described a spelling the codebase is not allowed to use, and the check was very
 * nearly inert. It did not catch ProgressBar sweeping `inset-inline-start` on an infinite
 * loop, or Progress animating `inline-size`, both of which ran the whole animation on the
 * layout path every frame. Both spellings are now covered, and the sweep spans every
 * package that ships CSS.
 *
 * Rules, in order of how expensive the failure is to find by hand:
 *
 *   1. `global()` on cross-file keyframe references. CSS Modules localises `animation-name`,
 *      so a module referencing a keyframe it does not itself define gets a hashed name that
 *      resolves to nothing. There is NO diagnostic — the animation silently never runs. This
 *      is the rule that matters most; everything else is style.
 *   2. Every `global(name)` resolves to a keyframe in the shared catalogue.
 *   3. One naming convention: `cascivo-`. The catalogue arrived after three had accumulated
 *      (`cascivo-`, `cascade-`, and a bare `shimmer`).
 *   4. No two keyframes share a body. That is what three separate shimmers looked like.
 *   5. No transition or keyframe animates a layout property, in either spelling.
 *   6. Open/close components animate via `@starting-style`.
 *
 * Run: `pnpm audit:animation`.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const CATALOGUE = join(REPO_ROOT, 'packages/tokens/src/motion.css')

/** Components with open/close or enter/exit behavior — must animate via @starting-style. */
const OPEN_CLOSE = ['modal', 'dropdown', 'tooltip', 'toast', 'command-menu']

/**
 * Layout-affecting properties that must never be transitioned or keyframed. Both spellings:
 * cascivo authors logical, but copied third-party CSS and old code use physical.
 */
const LAYOUT_PROPS = [
  'max-height',
  'height',
  'width',
  'min-width',
  'min-height',
  'top',
  'left',
  'right',
  'bottom',
  'inset',
  'inset-inline',
  'inset-inline-start',
  'inset-inline-end',
  'inset-block',
  'inset-block-start',
  'inset-block-end',
  'inline-size',
  'block-size',
  'min-inline-size',
  'min-block-size',
  'margin',
  'margin-inline',
  'margin-inline-start',
  'margin-block',
  'padding',
  'padding-inline',
  'padding-block',
]
const LAYOUT_RE = new RegExp(`\\b(${LAYOUT_PROPS.join('|')})\\b`)
const TRANSITION_DECL = /transition(?:-property)?\s*:([^;{}]*)/g

/**
 * Documented exceptions: `<file suffix>` → reason. Each is a place the platform, not the
 * author, forces the layout-animating form.
 */
const LAYOUT_EXCEPTIONS = new Map<string, string>([
  [
    'components/src/accordion/accordion.module.css',
    'grid-template-rows 0fr→1fr / ::details-content block-size — the documented height-animation exception',
  ],
  [
    'components/src/collapsible/collapsible.module.css',
    'same disclosure-height exception as accordion',
  ],
  [
    'components/src/tree-view/tree-view.module.css',
    'grid-template-rows 0fr→1fr disclosure exception',
  ],
  [
    'components/src/progress/progress.module.css',
    'native <progress> pseudo-elements accept sizing but not translate — documented at the keyframe',
  ],
  [
    'components/src/progress-bar/progress-bar.module.css',
    'determinate fill transitions inline-size; only the indeterminate LOOP had to leave the layout path',
  ],
  // A collapsing rail reflows the content beside it. `transform` cannot express that — it
  // would slide the rail while leaving its footprint behind, so the main column keeps a gap
  // the width of the expanded sidebar. These are one-shot, user-initiated, and bounded.
  [
    'components/src/app-shell/app-shell.module.css',
    'collapsing sidebar rail must reflow its sibling column',
  ],
  [
    'layouts/src/app-shell/app-shell.module.css',
    'collapsing sidebar rail must reflow its sibling column',
  ],
  [
    'components/src/side-nav/side-nav.module.css',
    'collapsing nav rail must reflow its sibling column',
  ],
  [
    'components/src/pull-to-refresh/pull-to-refresh.module.css',
    'the spinner well opens by growing, pushing the list down — a transform would overlap it',
  ],
])

/**
 * Each theme stylesheet is independently importable — a user may load only `arcade.css` —
 * so it must be self-contained. Two retro themes carrying the same six-line scanline is
 * correct duplication; extracting it would make one theme file depend on another.
 */
function themeLocal(rel: string): boolean {
  return rel.startsWith('packages/themes/src/')
}

function collectCss(dir: string): string[] {
  const out: string[] = []
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '__fixtures__') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...collectCss(full))
    else if (entry.endsWith('.css') && full.includes(`${sep}src${sep}`)) out.push(full)
  }
  return out
}

/** Blank comment bodies, preserving offsets and newlines. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
}

/** `@keyframes <name> { … }` blocks: name plus a normalised body for duplicate detection. */
function keyframes(css: string): Array<{ name: string; body: string; line: number }> {
  const clean = stripComments(css)
  const out: Array<{ name: string; body: string; line: number }> = []
  for (const match of clean.matchAll(/@keyframes\s+([\w-]+)\s*\{/g)) {
    const start = match.index + match[0].length
    let depth = 1
    let i = start
    while (i < clean.length && depth > 0) {
      if (clean[i] === '{') depth++
      else if (clean[i] === '}') depth--
      i++
    }
    out.push({
      name: match[1]!,
      body: clean
        .slice(start, i - 1)
        .replace(/\s+/g, ' ')
        .trim(),
      line: clean.slice(0, match.index).split('\n').length,
    })
  }
  return out
}

/** Keyframe names referenced by `animation`/`animation-name`, split by `global()` wrapping. */
function references(css: string): { bare: string[]; global: string[] } {
  const clean = stripComments(css)
  const bare: string[] = []
  const globals: string[] = []
  for (const decl of clean.matchAll(/animation(?:-name)?\s*:([^;{}]*)/g)) {
    const value = decl[1]!
    for (const g of value.matchAll(/global\(\s*([\w-]+)\s*\)/g)) globals.push(g[1]!)
    // Anything left that looks like an identifier and is not a keyword/function/var.
    const rest = value.replace(/global\([^)]*\)/g, ' ').replace(/var\([^)]*\)/g, ' ')
    for (const word of rest.matchAll(/(?<![\w-@.(])([a-zA-Z][\w-]*)(?![\w-]*\s*\()/g)) {
      const w = word[1]!
      if (KEYWORDS.has(w)) continue
      bare.push(w)
    }
  }
  return { bare, global: globals }
}

/** Every CSS-wide and animation-shorthand keyword that can appear in an `animation` value. */
const KEYWORDS = new Set([
  'none',
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
  'infinite',
  'alternate',
  'alternate-reverse',
  'reverse',
  'normal',
  'forwards',
  'backwards',
  'both',
  'running',
  'paused',
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'step-start',
  'step-end',
  'auto',
])

const failures: string[] = []
const files = collectCss(join(REPO_ROOT, 'packages'))
const catalogue = new Set(keyframes(readFileSync(CATALOGUE, 'utf8')).map((k) => k.name))
const bodies = new Map<string, string>()
const bodyOwner = new Map<string, string>()

for (const file of files) {
  const rel = relative(REPO_ROOT, file).split(sep).join('/')
  if (file === CATALOGUE) continue
  const css = readFileSync(file, 'utf8')
  const clean = stripComments(css)
  const local = keyframes(css)
  const localNames = new Set(local.map((k) => k.name))
  const refs = references(css)
  const isModule = file.endsWith('.module.css')

  // 1. Cross-file references from a module must be wrapped in global().
  for (const name of refs.bare) {
    if (localNames.has(name)) continue
    if (!isModule) continue
    failures.push(
      `${rel}: animation references "${name}", which this file does not define.\n` +
        `      CSS Modules will localise it to a hashed name that resolves to nothing, silently.\n` +
        `      fix: animation: global(${name}) …`,
    )
  }

  // 2. global() must resolve to the shared catalogue.
  for (const name of refs.global) {
    if (catalogue.has(name)) continue
    failures.push(
      `${rel}: global(${name}) is not defined in packages/tokens/src/motion.css.\n` +
        `      fix: add it to the catalogue, or define it locally and drop the global() wrapper.`,
    )
  }

  for (const kf of local) {
    // 3. One naming convention.
    if (!kf.name.startsWith('cascivo-')) {
      failures.push(`${rel}:${kf.line}: @keyframes "${kf.name}" does not use the cascivo- prefix.`)
    }
    // 4. No duplicate bodies.
    const seen = bodies.get(kf.body)
    if (seen && themeLocal(rel) && themeLocal(seen)) {
      // Two themes may each carry the same decorative effect — see themeLocal().
    } else if (seen) {
      failures.push(
        `${rel}:${kf.line}: @keyframes "${kf.name}" duplicates ${bodyOwner.get(kf.body)}.\n` +
          `      fix: reference the shared one via global(), or delete one of the two.`,
      )
    } else {
      bodies.set(kf.body, rel)
      bodyOwner.set(kf.body, `${rel} "${kf.name}"`)
    }
  }

  // 5. No layout properties in transitions or keyframes.
  const exempt = [...LAYOUT_EXCEPTIONS.keys()].some((suffix) => rel.endsWith(suffix))
  if (!exempt) {
    for (const decl of clean.matchAll(TRANSITION_DECL)) {
      const hit = LAYOUT_RE.exec(decl[1]!)
      if (hit)
        failures.push(`${rel}: transitions layout property "${hit[1]}" — not compositor-safe`)
    }
    for (const kf of local) {
      const hit = LAYOUT_RE.exec(kf.body)
      if (hit) {
        failures.push(
          `${rel}:${kf.line}: @keyframes "${kf.name}" animates layout property "${hit[1]}".\n` +
            `      fix: express it as translate/scale so the loop stays off the layout path.`,
        )
      }
    }
  }
}

// 6. Open/close components animate via @starting-style.
for (const name of OPEN_CLOSE) {
  const file = join(REPO_ROOT, `packages/components/src/${name}/${name}.module.css`)
  const css = stripComments(readFileSync(file, 'utf8'))
  if (!css.includes('@starting-style')) {
    failures.push(`${name}: open/close component without @starting-style`)
  }
}

if (failures.length > 0) {
  console.error(`Animation audit failed:\n${failures.map((f) => `  - ${f}`).join('\n')}`)
  process.exit(1)
}
console.log(
  `Animation audit passed (${files.length} stylesheets, ${catalogue.size} shared keyframes)`,
)
