#!/usr/bin/env node
/**
 * Flatten cascivo's token + theme CSS into a single file the Ghost theme can link.
 *
 * Ghost has no build step — it serves `assets/` verbatim — and cascivo's shipped theme CSS
 * uses BARE `@import` specifiers (`@import '@cascivo/tokens';`) that a browser cannot
 * resolve. Copying `light-dark.css` into `assets/css/` therefore produces a stylesheet whose
 * imports 404, silently, leaving every `--cascivo-*` undefined and the site unstyled.
 *
 * So the resolution happens here, once, on the author's machine. This is exactly the recipe
 * docs/USING-WITH-GHOST.md gives adopters; keeping the example on the same path is the point.
 *
 * Uses esbuild's JS API rather than spawning its CLI: `esbuild` is only on PATH under
 * `pnpm run`, and its `bin/esbuild` is a native binary on some platforms, so neither a bare
 * spawn nor running it through node is portable.
 *
 * The output is generated, not committed — see .gitignore. Real theme authors DO commit it,
 * because their repo is the deployable artifact.
 */
import { build } from 'esbuild'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'theme', 'assets', 'css', 'cascivo.css')

mkdirSync(join(ROOT, 'theme', 'assets', 'css'), { recursive: true })

await build({
  // `light-dark.css` is the two-theme bundle: tokens once, the base layer, then light + dark.
  // Swap for '@cascivo/themes/all.css' to ship all twelve.
  stdin: {
    contents: "@import '@cascivo/themes/light-dark.css';\n",
    resolveDir: ROOT,
    loader: 'css',
  },
  bundle: true,
  outfile: OUT,
})

/**
 * Collapse repeated names inside each `@layer a, b, c;` statement.
 *
 * Concatenating several cascivo CSS files yields one statement that re-lists layers already
 * named earlier in it (`…, cascivo.override, cascivo.reset, cascivo.tokens`). That is
 * harmless — a layer keeps the position of its FIRST appearance and later mentions are
 * no-ops — but it reads as though the order contradicts itself, and this repo's own
 * `layer:check` flags it as drift. Deduping restores the canonical statement verbatim.
 */
const css = readFileSync(OUT, 'utf8').replace(/@layer\s+([^{;]+);/g, (match, names) => {
  const unique = [
    ...new Set(
      names
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean),
    ),
  ]
  return `@layer ${unique.join(', ')};`
})
writeFileSync(OUT, css)

console.log(`ghost-theme: wrote ${OUT}`)
